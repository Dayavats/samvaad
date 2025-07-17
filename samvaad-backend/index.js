const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
const Post = require('./models/Post');
const auth = require('./middleware/auth');
const { adminOnly } = require('./middleware/auth');

const User = require('./models/User');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
const Story = require('./models/Story');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ["GET", "POST"]
  }
});

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// CORS setup for frontend
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());


// Socket.io connection handling
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });
  
  io.on('connection', (socket) => {
    console.log('User connected:', socket.userId);
    
    // Join user to their personal room
    socket.join(socket.userId);
    
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId);
    });
    
    // Handle new message
    socket.on('send_message', async (data) => {
      console.log('send_message event received:', data, 'from user:', socket.userId);
      try {
        const { conversationId, text } = data;
        const message = new Message({
          conversation: conversationId,
          sender: socket.userId,
          text: text
        });
        await message.save();
        
        // Update conversation's last message
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id,
          lastMessageTime: new Date()
        });
        
        // Emit to all participants in the conversation
        const conversation = await Conversation.findById(conversationId);
        conversation.participants.forEach(participantId => {
          console.log('Emitting new_message to:', participantId.toString());
          io.to(participantId.toString()).emit('new_message', {
            message: message,
            conversationId: conversationId
          });
        });
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });
  });
  

app.get('/', (req, res) => {
  res.send('Samvaad backend is running!');
});

// Register endpoint
app.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed, role });
    await user.save();
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
    console.log('req.body', req.body);
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Both fields are required.' });
    }
    const user = await User.findOne({ email });
    console.log('user', user);
    if (!user) {
        console.log('user not found');
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const match = await bcrypt.compare(password, user.password);
    console.log('match', match);
    if (!match) {
        console.log('match not found');
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log('token', token);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.log('err', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Create a new post (auth required)
app.post('/posts', auth, async (req, res) => {
    try {
      const { text, image, tags } = req.body;
      const post = new Post({
        text,
        image,
        tags,
        author: req.user.id
      });
      await post.save();
      res.status(201).json(post);
    } catch (err) {
      res.status(500).json({ message: 'Server error.' });
    }
  });
  
  // Get all posts (public)
  app.get('/posts', async (req, res) => {
    try {
      const posts = await Post.find().populate('author', 'name role').sort({ createdAt: -1 });
      res.json(posts);
    } catch (err) {
      res.status(500).json({ message: 'Server error.' });
    }
  });

  app.get('/conversations', auth, async (req, res) => {
    try {
      const conversations = await Conversation.find({
        participants: req.user.id,
        isActive: true
      })
      .populate('participants', 'name role')
      .populate('lastMessage')
      .sort({ lastMessageTime: -1 });
      
      res.json(conversations);
    } catch (err) {
      res.status(500).json({ message: 'Server error.' });
    }
  });
  
  // Get messages for a conversation
  app.get('/conversations/:conversationId/messages', auth, async (req, res) => {
    try {
      const messages = await Message.find({
        conversation: req.params.conversationId
      })
      .populate('sender', 'name role')
      .sort({ createdAt: 1 });
      
      res.json(messages);
    } catch (err) {
      res.status(500).json({ message: 'Server error.' });
    }
  });
  
  // Create a new conversation
  app.post('/conversations', auth, async (req, res) => {
    try {
      const { participantId } = req.body;
      
      // Check if conversation already exists
      const existingConversation = await Conversation.findOne({
        participants: { $all: [req.user.id, participantId] },
        isActive: true
      });
      
      if (existingConversation) {
        return res.json(existingConversation);
      }
      
      const conversation = new Conversation({
        participants: [req.user.id, participantId]
      });
      await conversation.save();
      
      const populatedConversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name role');
      
      res.status(201).json(populatedConversation);
    } catch (err) {
      res.status(500).json({ message: 'Server error.' });
    }
  });

  // Get all users except the current user (for chat user search)
  app.get('/users', auth, async (req, res) => {
    try {
      const users = await User.find({ _id: { $ne: req.user.id } }, 'name email role');
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: 'Server error.' });
    }
  });

  // Create a new story (auth required)
  app.post('/stories', auth, async (req, res) => {
    try {
      const { text, tags, isAnonymous } = req.body;
      const story = new Story({
        text,
        tags,
        isAnonymous: !!isAnonymous,
        author: isAnonymous ? undefined : req.user.id
      });
      await story.save();
      res.status(201).json(story);
    } catch (err) {
      res.status(500).json({ message: 'Server error.' });
    }
  });

  // Get all stories (public)
  app.get('/stories', async (req, res) => {
    try {
      const stories = await Story.find()
        .populate({
          path: 'author',
          select: 'name role',
          options: { strictPopulate: false }
        })
        .sort({ createdAt: -1 });
      res.json(stories);
    } catch (err) {
      res.status(500).json({ message: 'Server error.' });
    }
  });

  // Get current user's profile
  app.get('/me', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('name email role');
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: 'Server error.' });
    }
  });

  // Update current user's profile (name, password)
  app.put('/me', auth, async (req, res) => {
    try {
      const { name, password } = req.body;
      const update = {};
      if (name) update.name = name;
      if (password) {
        const bcrypt = require('bcryptjs');
        update.password = await bcrypt.hash(password, 10);
      }
      const user = await User.findByIdAndUpdate(req.user.id, update, { new: true }).select('name email role');
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: 'Server error.' });
    }
  });

  // Admin: Change user role
  app.put('/users/:id/role', auth, adminOnly, async (req, res) => {
    try {
      const { role } = req.body;
      if (!['broken', 'counselor', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('name email role banned');
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: 'Server error.' });
    }
  });

  // Admin: Ban or unban user
  app.put('/users/:id/ban', auth, adminOnly, async (req, res) => {
    try {
      const { banned } = req.body;
      if (typeof banned !== 'boolean') {
        return res.status(400).json({ message: 'Invalid banned value' });
      }
      const user = await User.findByIdAndUpdate(req.params.id, { banned }, { new: true }).select('name email role banned');
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: 'Server error.' });
    }
  });

  // Admin: Delete a post
  app.delete('/posts/:id', auth, adminOnly, async (req, res) => {
    try {
      const post = await Post.findByIdAndDelete(req.params.id);
      if (!post) return res.status(404).json({ message: 'Post not found' });
      res.json({ message: 'Post deleted' });
    } catch (err) {
      res.status(500).json({ message: 'Server error.' });
    }
  });

  // Admin: Delete a story
  app.delete('/stories/:id', auth, adminOnly, async (req, res) => {
    try {
      const story = await Story.findByIdAndDelete(req.params.id);
      if (!story) return res.status(404).json({ message: 'Story not found' });
      res.json({ message: 'Story deleted' });
    } catch (err) {
      res.status(500).json({ message: 'Server error.' });
    }
  });

// Flag or unflag a post (any authenticated user)
app.put('/posts/:id/flag', auth, async (req, res) => {
  try {
    const { flagged } = req.body;
    if (typeof flagged !== 'boolean') {
      return res.status(400).json({ message: 'Invalid flagged value' });
    }
    const post = await Post.findByIdAndUpdate(req.params.id, { flagged }, { new: true });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Flag or unflag a story (any authenticated user)
app.put('/stories/:id/flag', auth, async (req, res) => {
  try {
    const { flagged } = req.body;
    if (typeof flagged !== 'boolean') {
      return res.status(400).json({ message: 'Invalid flagged value' });
    }
    const story = await Story.findByIdAndUpdate(req.params.id, { flagged }, { new: true });
    if (!story) return res.status(404).json({ message: 'Story not found' });
    res.json(story);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
