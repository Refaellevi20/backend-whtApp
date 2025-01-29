const express = require('express')
const { login, signup, logout } = require('./auth.controller')
const router = express.Router()

// Verify that all controller functions exist before using them
if (!login || !signup || !logout) {
    throw new Error('Missing required controller functions')
}

router.post('/login', login)
router.post('/signup', signup)
router.post('/logout', logout)

module.exports = router