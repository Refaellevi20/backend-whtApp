const express = require('express')
const {requireAuth, requireAdmin} = require('../../middlewares/requireAuth.middleware')
const {getUser, getUsers, deleteUser, updateUser, updateUserCount, getAllUserCounts} = require('./user.controller')
const router = express.Router()

router.get('/', getUsers)
router.get('/:id', getUser)
router.put('/:id', requireAuth,  updateUser)
router.put('/:id/count', requireAuth, updateUserCount)
router.get('/counts', getAllUserCounts)

// router.put('/:id',  requireAuth, updateUser)
router.delete('/:id',  requireAuth, requireAdmin, deleteUser)

module.exports = router