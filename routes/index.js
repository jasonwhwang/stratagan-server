const router = require('express').Router()

router.use('/', require('./user'))
router.use('/', require('./members'))
router.use('/', require('./tag'))
router.use('/', require('./challenge'))
router.use('/', require('./comment'))

module.exports = router