var mongoose = require('mongoose')

var TagSchema = new mongoose.Schema({
  name: { type: String, default: '', index: true, unique: true },
  description: String,
  main: Boolean,
  countChallenges: { type: Number, default: 0 },
  countProposals: { type: Number, default: 0 },
  countMembers: { type: Number, default: 0 }
})

TagSchema.methods.isEmpty = function () {
  return !this.main && this.countChallenges <= 0 && this.countProposals <= 0 && this.countMembers <= 0
}

mongoose.model('Tag', TagSchema)