const router = require('express').Router()
const auth = require('./auth')
const mongoose = require('mongoose')
const Tag = mongoose.model('Tag')
const User = mongoose.model('User')

router.get('/tags', auth.optional, async (req, res, next) => {
  try {
    let tags = await Tag.find({})
    return res.json({ tags: tags })
  } catch(err) {
    console.log(err)
    next(err)
  }
})

// Get User Tags
router.param('username', function (req, res, next, username) {
  User.findOne({ username: username })
    .populate('tags', '-__v')
    .then(function (user) {
      if (!user) return res.sendStatus(404)

      req.member = user

      return next()
    }).catch(next)
})
router.get('/tags/member/:username', auth.optional, function (req, res, next) {
  if(!req.member) return res.sendStatus(404)
  return res.json({ tags: req.member.tags })
})


// Add a Tag
router.post('/tags/new', auth.required, async (req, res, next) => {
  try {
    let authUser = await User.findOne({ sub: req.user.sub })
    if (!authUser) return res.sendStatus(401)
    
    let foundTag = await Tag.findOne({ name: req.body.tag.name })
    if (!foundTag) {
      foundTag = new Tag()
      foundTag.name = req.body.tag.name
        .replace(/[^A-Za-z0-9& ]/gi, '')
        .toLowerCase().replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase() })
      
      authUser.tags.push(foundTag._id)
      await authUser.save()
      foundTag.countMembers = 1
      await foundTag.save()

    } else if(authUser.tags.indexOf(foundTag._id) === -1) {
      authUser.tags.push(foundTag._id)
      await authUser.save()
      foundTag.countMembers = foundTag.countMembers + 1
      await foundTag.save()
    }
    
    return res.json({ tag: foundTag })
  } catch(err) {
    console.log(err)
    next(err)
  }
})

let mainTags = [
  { name: "Strategy", description: "Design roadmaps for success in competitive markets." },
  { name: "Analytics", description: "Discover insight from market research & data." },
  { name: "Marketing & Sales", description: "Drive growth & strengthen brand recognition." },
  { name: "Digital", description: "Utilize online channels, tools, & solutions." },
  { name: "Technology", description: "Implement technologies for business value." },
  { name: "Design", description: "Create & design new solutions for particular problems." },
  { name: "Finance", description: "Identify profitable growth & asset management." },
  { name: "Operations", description: "Align systems, organize people, & optimize processes." },
  { name: "Human Resources", description: "Attract, manage, & retain top talent." },
  { name: "Legal & Compliance", description: "Ensure compliance with regulations." },
  { name: "Social & Nonprofit", description: "Provide expertise for social betterment." }
]

router.get('/tags/main', auth.optional, async (req, res, next) => {
  try {
    // let returnTags = await Tag.find({ main: true })

    // Create New Main Tags
    let returnTags = await Promise.all(mainTags.map(async (tag) => {
      let foundTag = await Tag.findOne({ name: tag.name })
      if (!foundTag) {
        foundTag = new Tag()
        foundTag.name = tag.name
        foundTag.description = tag.description,
        foundTag.main = true
        await foundTag.save()
      }
      return foundTag
    }))
    
    return res.json({ tags: returnTags })

  } catch (err) {
    console.log(err)
    next(err)
  }
})


module.exports = router