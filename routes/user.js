const router = require('express').Router()
const auth = require('./auth')
const mongoose = require('mongoose')
const User = mongoose.model('User')
const nanoid = require('nanoid')

router.get('/private', auth.required, function (req, res) {
  res.json({
    message: 'Private Endpoint: Welcome to Stratagan'
  })
  console.log(req.user)
})

// Create User
// when using auth.required, req.user returns user values:
// 1. req.user.sub - string
// 2. req.user.email - string
// 3. req.user.email_verified - bool
router.get('/login', auth.required, function (req, res, next) {
  User.findOne({ sub: req.user.sub }).then(function (user) {
    if (!user && req.user.email_verified === false) {
      return res.sendStatus(401)
    } else if (!user && req.user.email_verified === true) {
      user = new User()
      user.sub = req.user.sub
      user.email = req.user.email
      user.username = req.user.email.split("@")[0] + "-" + nanoid(10)
      user.save().then(function () {
        return res.json({
          user: user.getUser(null)
        })
      }).catch(next);
    }

    return res.json({
      user: user.getUser(null)
    })
  }).catch(next)
})

// Get User Profile
router.get('/user', auth.required, function (req, res, next) {
  User.findOne({ sub: req.user.sub })
  .populate('tags', '-countChallenges -countMembers -__v')
  .then(function (user) {
    if (!user) {
      return res.sendStatus(401)
    }

    return res.json({ user: user.getUser(null) })
  }).catch(next)
})


// Update User
router.put('/user', auth.required, async (req, res, next) => {
  try {
    let user = await User.findOne({ sub: req.user.sub })
    if (!user) { return res.sendStatus(401) }

    // Main Attributes
    if (typeof req.body.user.username !== 'undefined') {
      user.username = req.body.user.username.substring(0, 50)
    }
    if (typeof req.body.user.name !== 'undefined') {
      user.name = req.body.user.name.substring(0, 50)
    }
    if (typeof req.body.user.image !== 'undefined') {
      user.image = req.body.user.image
    }
    if (typeof req.body.user.role !== 'undefined') {
      user.role = req.body.user.role.substring(0, 50)
    }
    if (typeof req.body.user.company !== 'undefined') {
      user.company = req.body.user.company.substring(0, 50)
    }
    if (typeof req.body.user.headline !== 'undefined') {
      user.headline = req.body.user.headline.substring(0, 300)
    }

    // Account Attributes
    if (typeof req.body.user.linkedIn !== 'undefined') {
      user.linkedIn = req.body.user.linkedIn.substring(0, 75)
    }
    if (typeof req.body.user.website !== 'undefined') {
      user.website = req.body.user.website.substring(0, 50)
    }
    if (typeof req.body.user.address !== 'undefined') {
      user.address = req.body.user.address.substring(0, 150)
    }
    if (typeof req.body.user.companySize !== 'undefined') {
      user.companySize = req.body.user.companySize
    }
    if (typeof req.body.user.companyImage !== 'undefined') {
      user.companyImage = req.body.user.companyImage
    }
    if (typeof req.body.user.companyWebsite !== 'undefined') {
      user.companyWebsite = req.body.user.companyWebsite.substring(0, 50)
    }
    if (typeof req.body.user.industryCategory !== 'undefined') {
      user.industryCategory = req.body.user.industryCategory.substring(0, 50)
    }
    if (typeof req.body.user.industryName !== 'undefined') {
      user.industryName = req.body.user.industryName.substring(0, 100)
    }
    // Tags
    if (typeof req.body.user.tags !== 'undefined') {
      user.tags = await user.putTags(req.body.user.tags)
    }
    // About Section
    if (typeof req.body.user.about !== 'undefined') {
      user.about = req.body.user.about
    }

    await user.save()
    return res.json({ user: user.getUser(null) })

  } catch(err) {
    console.log(err)
    return next(err)
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