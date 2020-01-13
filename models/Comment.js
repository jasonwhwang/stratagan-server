var mongoose = require('mongoose')

var CommentSchema = new mongoose.Schema({
  challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', index: true },
  proposalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', index: true },
  body: { type: String, default: '' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  likes: { type: Number, default: 0 }
}, { timestamps: true })

mongoose.model('Comment', CommentSchema)