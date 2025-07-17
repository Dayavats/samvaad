const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  text: { type: String, required: true },
  image: { type: String }, // URL to image (optional)
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tags: [{ type: String }], // e.g., ['motivation', 'hope', 'recovery']
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of user IDs who liked
  flagged: { type: Boolean, default: false },
  comments: [commentSchema]
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);