const router = require('express').Router()
const auth = require('./auth')
const mongoose = require('mongoose')
const User = mongoose.model('User')
const Tag = mongoose.model('Tag')

// Preload member profile on routes with ':username'
router.param('username', function (req, res, next, username) {
  User.findOne({ username: username })
    .populate('tags', '-countChallenges -countMembers -countProposals -__v')
    .then(function (user) {
      if (!user) { return res.sendStatus(404) }

      req.member = user

      return next()
    }).catch(next)
})

// Get Member Profile
router.get('/member/:username', auth.optional, async (req, res, next) => {
  try {
    let authUser = null
    if (req.user) {
      authUser = await User.findOne({ sub: req.user.sub })
    }
    return res.json({ user: req.member.getUser(authUser) })

  } catch (err) {
    console.log(err)
    next(err)
  }
})


// Get All Members
router.get('/members', auth.optional, async (req, res, next) => {
  try {
    let tag = null
    if(req.query.community) {
      tag = await Tag.findOne({ name: req.query.community })
      if(!tag) return res.sendStatus(404)
    }
    let query = {}
    if(tag) query.tags = tag._id
    if(req.query.industryCategory) query.industryCategory = req.query.industryCategory
    if(req.query.companySize) query.companySize = req.query.companySize

    let textSearch = {}, options = {}
    if(req.query.keywords) textSearch = {$text: {$search: req.query.keywords}}
    if(Object.entries(textSearch).length !== 0 || textSearch.constructor !== Object) {
      query = {...query, ...textSearch}
      options = { score: { $meta: "textScore" } }
    }

    let limit = 20
    let offset = 0
    if (typeof req.query.offset !== 'undefined') {
      offset = req.query.offset;
    }
    let authUser = null
    if(req.user) {
      authUser = await User.findOne({ sub: req.user.sub })
    }
    let allUsers = await User.find(query, options)
      .limit(Number(limit))
      .skip(Number(offset))
      .sort(options)
    
    return res.json({
      list: allUsers.map(function (aUser) {
        return aUser.getUserBasic(authUser);
      })
    })

  } catch(err) {
    console.log(err)
    next(err)
  }
})

// Get Member Count
router.get('/members/count', auth.optional, async (req, res, next) => {
  try {
    let tag = null
    if(req.query.community && req.query.community !== "All Communities") {
      tag = await Tag.findOne({ name: req.query.community })
      if(!tag) return res.sendStatus(404)
    }
    
    let query = {}
    if(tag) query = { tags: tag._id }

    let totalCount = await User.countDocuments(query)

    let limit = 8
    let offset = 0

    let allUsers = await User.find(query).limit(Number(limit)).skip(Number(offset))
    return res.json({
      count: totalCount,
      members: allUsers.map(function (aUser) {
        return { image: aUser.image, username: aUser.username };
      })
    })

  } catch(err) {
    console.log(err)
    next(err)
  }
})



module.exports = router