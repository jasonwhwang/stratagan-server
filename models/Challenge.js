var mongoose = require('mongoose')
const Tag = mongoose.model('Tag')

var ChallengeSchema = new mongoose.Schema({
  sub: { type: String, default: '', index: true, unique: true },
  image: { type: String, default: '' },
  title: { type: String, default: '', index: true },
  heading: { type: String, default: '', index: true },
  body: { type: String, default: '' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag', index: true }],
  startDate: Date,
  endDate: Date,

  budget: { type: Number, default: 0, index: true },
  status: { type: String, default: '', index: true },
  type: { type: String, default: '', index: true },
  companySize: { type: String, default: '', index: true },
  industryCategory: { type: String, default: '', index: true },
  proposals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Proposal' }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  bookmarked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }]
}, { timestamps: true })

ChallengeSchema.index({ title: 'text', heading: 'text' })

ChallengeSchema.methods.getChallenge = function (authUser) {
  return {
    _id: this._id,
    sub: this.sub,
    image: this.image,
    title: this.title,
    heading: this.heading,
    body: this.body,
    author: this.author,
    tags: this.tags,

    budget: this.budget.toString(),
    status: this.status,
    type: this.type,
    startDate: this.startDate ? this.startDate : null,
    endDate: this.endDate ? this.endDate : null,

    bookmarkedCount: this.bookmarked.length,
    userBookmarked: authUser ? authUser.isBookmarked(authUser._id) : false,
    updatedAt: this.updatedAt
  }
}

ChallengeSchema.methods.putTags = async function (newTags) {
  try {
    let newTagsId = await Promise.all(newTags.map(tag => { return tag._id }))
    let oldTagsId = await Promise.all(this.tags.map(tag => { return tag.toHexString() }))

    let returnTags = []
    for (let i = 0; i < newTagsId.length; i++) {
      let foundTag = await Tag.findOne({ name: newTags[i].name })
      if (!foundTag) {
        let createTag = new Tag()
        createTag.name = newTags[i].name
          .replace(/[^A-Za-z0-9& ]/gi, '')
          .toLowerCase().replace(/(?:^|\s)\S/g, function (a) { return a.toUpperCase() })
        createTag.countChallenges = 1
        await createTag.save()
        returnTags.push(createTag._id)
        continue
      }

      let tagIdx = oldTagsId.indexOf(newTagsId[i])
      if (tagIdx === -1) {
        foundTag.countChallenges = foundTag.countChallenges + 1
        await foundTag.save()
        returnTags.push(foundTag._id)

      } else {
        returnTags.push(this.tags[tagIdx])
        oldTagsId[tagIdx] = null
      }
    }

    for (let i = 0; i < oldTagsId.length; i++) {
      if(oldTagsId[i] === null) continue

      let foundTag = await Tag.findById(this.tags[i])
      if(!foundTag) continue
      foundTag.countChallenges = foundTag.countChallenges - 1
      if (foundTag.isEmpty()) await Tag.findByIdAndDelete(this.tags[i])
      else await foundTag.save()
    }

    return returnTags
  } catch (err) {
    console.log(err)
  }
}


mongoose.model('Challenge', ChallengeSchema)