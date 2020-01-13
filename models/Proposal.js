var mongoose = require('mongoose')

var ProposalSchema = new mongoose.Schema({
  challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', index: true },
  title: { type: String, default: '', index: true },
  heading: { type: String, default: '' },
  body: { type: String, default: '' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },

  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  budget: { type: Number, default: 0 },
  upvotes: { type: Number, default: 0 }
}, { timestamps: true })

mongoose.model('Proposal', ProposalSchema)