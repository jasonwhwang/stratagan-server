var mongoose = require('mongoose')
var uniqueValidator = require('mongoose-unique-validator')
const Tag = mongoose.model('Tag')

var UserSchema = new mongoose.Schema({
  sub: { type: String, unique: true, index: true },
  username: { type: String, lowercase: true, unique: true, required: [true, "can't be blank"], match: [/^[a-zA-Z0-9]+$/, 'is invalid'], index: true },
  email: { type: String, unique: true, index: true },
  name: { type: String, default: '', index: true },
  image: { type: String, default: '' },
  role: { type: String, default: '' },
  company: { type: String, default: '' },
  headline: { type: String, default: '' },

  about: { type: String, default: '' },
  linkedIn: { type: String, default: '' },
  website: { type: String, default: '' },
  address: { type: String, default: '' },
  companySize: { type: String, default: '' },
  companyImage: { type: String, default: '' },
  companyWebsite: { type: String, default: '' },
  industryCategory: { type: String, default: '' },
  industryName: { type: String, default: '' },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],

  upvotesCount: { type: Number, default: 0 },
  challengesBookmarked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' }],
  proposalsUpvoted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Proposal' }],
  commentsLiked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],

  networkFollowing: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  networkFollowers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true })

UserSchema.index({ name: 'text', company: 'text', role: 'text' })

UserSchema.plugin(uniqueValidator, { message: 'is already taken.' })

// User Functions
// user parameter is requester
UserSchema.methods.getUser = function (authUser) {
  return {
    username: this.username,
    name: this.name,
    image: this.image,
    role: this.role,
    company: this.company,
    headline: this.headline,

    about: this.about,
    website: this.website,
    linkedIn: this.linkedIn,
    address: this.address,
    companySize: this.companySize,
    companyImage: this.companyImage,
    companyWebsite: this.companyWebsite,
    industryCategory: this.industryCategory,
    industryName: this.industryName,
    tags: this.tags,

    isAuthUserFollowing: authUser ? authUser.isFollowing(this._id) : false
  }
}

UserSchema.methods.getUserBasic = function (authUser) {
  return {
    username: this.username,
    name: this.name,
    image: this.image,
    role: this.role,
    company: this.company,
    headline: this.headline,

    followersCount: this.networkFollowers.length,
    upvotesCount: this.upvotesCount,

    isAuthUserFollowing: authUser ? authUser.isFollowing(this._id) : false
  }
}



// Bookmark Functions
UserSchema.methods.bookmark = function (id) {
  if (this.challengesBookmarked.indexOf(id) === -1) {
    this.challengesBookmarked.push(id)
  }
  return this.save()
}
UserSchema.methods.unbookmark = function (id) {
  this.challengesBookmarked.remove(id)
  return this.save()
}
UserSchema.methods.isBookmarked = function (id) {
  return this.challengesBookmarked.some(function (challengeId) {
    return challengeId.toString() === id.toString()
  })
}



// Upvote Functions
UserSchema.methods.upvote = function (id) {
  if (this.proposalsUpvoted.indexOf(id) === -1) {
    this.proposalsUpvoted.push(id)
  }
  return this.save()
}
UserSchema.methods.unvote = function (id) {
  this.proposalsUpvoted.remove(id)
  return this.save()
}
UserSchema.methods.isUpvoted = function (id) {
  return this.proposalsUpvoted.some(function (proposalId) {
    return proposalId.toString() === id.toString()
  })
}
UserSchema.methods.addUpvoteCount = function () {
  this.upvotesCount = this.upvotesCount + 1
  return this.save()
}
UserSchema.methods.subtractUpvoteCount = function () {
  this.upvotesCount = this.upvotesCount - 1
  return this.save()
}



// Like Functions
UserSchema.methods.like = function (id) {
  if (this.commentsLiked.indexOf(id) === -1) {
    this.commentsLiked.push(id)
  }
  return this.save()
}
UserSchema.methods.unLike = function (id) {
  this.commentsLiked.remove(id)
  return this.save()
}
UserSchema.methods.isLiked = function (id) {
  return this.commentsLiked.some(function (commentId) {
    return commentId.toString() === id.toString()
  })
}



// Follow Functions
UserSchema.methods.follow = async function (user) {
  try {
    if (user.networkFollower.indexOf(this._id) === -1) {
      user.networkFollower.push(this._id)
      await user.save()
    }
    if (this.networkFollowing.indexOf(user._id) === -1) {
      this.networkFollowing.push(user._id)
      await this.save()
    }
  } catch (err) {
    return err
  }
}
UserSchema.methods.unfollow = async function (user) {
  try {
    user.networkFollower.remove(this._id)
    await user.save()
    this.networkFollowing.remove(user._id)
    await this.save()
  } catch (err) {
    return err
  }
}
UserSchema.methods.isFollowing = function (id) {
  return this.networkFollowing.some(function (followId) {
    return followId.toString() === id.toString()
  })
}



// Tags Function
UserSchema.methods.putTags = async function (newTags) {
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
        createTag.countMembers = 1
        await createTag.save()
        returnTags.push(createTag._id)
        continue
      }

      let tagIdx = oldTagsId.indexOf(newTagsId[i])
      if (tagIdx === -1) {
        foundTag.countMembers = foundTag.countMembers + 1
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
      foundTag.countMembers = foundTag.countMembers - 1
      if (foundTag.isEmpty()) await Tag.findByIdAndDelete(this.tags[i])
      else await foundTag.save()
    }

    return returnTags
  } catch (err) {
    console.log(err)
  }
}


mongoose.model('User', UserSchema)