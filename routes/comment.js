const router = require('express').Router()
const auth = require('./auth')
const mongoose = require('mongoose')
const User = mongoose.model('User')
const Challenge = mongoose.model('Challenge')
const Comment = mongoose.model('Comment')

// Delete Comment
router.delete('/comment', auth.required, async (req, res, next) => {
  try {
    let user = await User.findOne({ sub: req.user.sub }, '_id')
    if (!user) { return res.sendStatus(401) }

    let comment = await Comment.findById(req.body.comment._id, 'author')
    if (!comment) { return res.sendStatus(401) }

    if (user._id.toString() === comment.author.toString()) {
      await comment.remove()
      return res.sendStatus(204)
    } else {
      return res.sendStatus(403)
    }
  } catch (err) {
    console.log(err)
    next(err)
  }
})

// Post Comment
router.post('/comment', auth.required, async (req, res, next) => {
  try {
    let user = await User.findOne({ sub: req.user.sub }, '_id')
    if (!user) { return res.sendStatus(401) }

    let newComment = null
    if (req.body.comment._id !== null) {
      newComment = await Comment.findById(req.body.comment._id)
      if (String(newComment.author) !== String(user._id)) {
        return res.sendStatus(401)
      }
    } else {
      newComment = new Comment()
      newComment.author = user._id
    }

    newComment.body = req.body.comment.body
    if (req.body.comment.challengeId) newComment.challengeId = req.body.comment.challengeId
    else newComment.proposalSub = req.body.comment.proposalSub


    await newComment.save()
    return res.json({ comment: newComment })

  } catch (err) {
    console.log(err)
    next(err)
  }
})

// Get Comments of Member
router.get('/comment/member/:username', auth.optional, async (req, res, next) => {
  try {
    let authUser = null
    if (req.user) authUser = await User.findOne({ sub: req.user.sub }, 'commentsLiked')
    let member = await User.findOne({ username: req.params.username }, '_id')
    if (!member) { return res.sendStatus(404) }

    let allComments = await Comment.find({ author: member._id })
      .populate('author', 'username name image role company')

    return res.json({
      comments: allComments.map(function (aComment) {
        if (authUser) aComment.isLiked = authUser.isLiked(aComment._id)
        return aComment;
      })
    })

  } catch (err) {
    console.log(err)
    next(err)
  }
})


// Get Comments of Challenge
router.get('/comment/challenge/:challengeId', auth.optional, async (req, res, next) => {
  try {
    let authUser = null
    if (req.user) authUser = await User.findOne({ sub: req.user.sub }, 'commentsLiked')
    let challenge = await Challenge.findById(req.params.challengeId, 'comments')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username name image role company'
        }
      })

    if (!challenge) { return res.sendStatus(404) }

    return res.json({
      comments: challenge.comments.map(function (aComment) {
        if (authUser) aComment.isLiked = authUser.isLiked(aComment._id)
        return aComment;
      })
    })

  } catch (err) {
    console.log(err)
    next(err)
  }
})

// Error Handler
router.use(function (err, req, res, next) {
  if (err.name === 'ValidationError') {
    return res.status(422).json({
      errors: Object.keys(err.errors).reduce(function (errors, key) {
        errors[key] = err.errors[key].message

        return errors
      }, {})
    })
  }
  return next(err)
})

module.exports = router