const express = require('express')
const {login, signup, logout} = require('../auth/auth.controller')

const router = express.Router()

router.post('/login', login)
router.post('/signup', signup)
router.post('/logout', logout)

module.exports = router