const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const storySchema = new mongoose.Schema({
  text: { type: String, required: true },
  tags: [{ type: String }],
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isAnonymous: { type: Boolean, default: false },
  flagged: { type: Boolean, default: false },
  reactions: {
    hope: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    recovery: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    support: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  replies: [replySchema]
}, { timestamps: true });

module.exports = mongoose.model('Story', storySchema); 