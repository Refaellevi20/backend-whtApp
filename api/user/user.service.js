const dbService = require('../../services/db.service')
const logger = require('../../services/logger.service')
const ObjectId = require('mongodb').ObjectId

module.exports = {
    query,
    getById,
    getByUsername,
    remove,
    update,
    add,
    updateUserCount
}

// async function query(filterBy = {}) {
//     const criteria = _buildCriteria(filterBy)
//     try {
//         const collection = await dbService.getCollection('user')
//         var users = await collection.find(criteria).toArray()
//         users = users.map(user => {
//             delete user.password
//             user.createdAt = new ObjectId(user._id).getTimestamp()
//             // Returning fake fresh data
//             // user.createdAt = Date.now() - (1000 * 60 * 60 * 24 * 3) // 3 days ago
//             return user
//         })
//         return users
//     } catch (err) {
//         logger.error('cannot find users', err)
//         throw err
//     }
// }

async function query() {
    try {
        const collection = await dbService.getCollection('users')
        const users = await collection.find({}).toArray()
        return users.map(user => {
            delete user.password
            return user
        })
    } catch (err) {
        logger.error('cannot find users', err)
        throw err
    }
}

// Fix collection names to be consistent
async function getById(userId) {
    try {
        const collection = await dbService.getCollection('users')  // Changed from 'user' to 'users'
        const user = await collection.findOne({ _id: new ObjectId(userId) })
        delete user.password
        return user
    } catch (err) {
        logger.error(`while finding user by id: ${userId}`, err)
        throw err
    }
}

async function remove(userId) {
    try {
        const collection = await dbService.getCollection('users')  // Changed from 'user' to 'users'
        await collection.deleteOne({ _id: new ObjectId(userId) })
    } catch (err) {
        logger.error(`cannot remove user ${userId}`, err)
        throw err
    }
}

async function update(user) {
    try {
        const userToSave = {
            _id: new ObjectId(user._id),
            fullname: user.fullname,
            username: user.username,
            password: user.password,
            imgUrl: user.imgUrl,
            count: user.count
        }
        if (user.isOwner) userToSave.isOwner = user.isOwner
        const collection = await dbService.getCollection('users')  // Changed from 'user' to 'users'
        await collection.updateOne({ _id: userToSave._id }, { $set: userToSave })
        return userToSave
    } catch (err) {
        logger.error(`cannot update user ${user._id}`, err)
        throw err
    }
}

async function updateUserCount(userId) {
    try {
        const collection = await dbService.getCollection('users')  // Changed from 'user' to 'users'
        const user = await collection.findOne({ _id: new ObjectId(userId) })
        if (!user) {
            throw new Error('User not found')
        }
        user.count = Number(user.count) || 0
        user.count += 1
        await collection.updateOne({ _id: new ObjectId(userId) }, { $set: { count: user.count } })
        return user
    } catch (err) {
        logger.error(`Failed to update user count for user ${userId}`, err)
        throw err
    }
}

async function getByUsername(username) {
    try {
        const collection = await dbService.getCollection('users')
        const user = await collection.findOne({ username })
        return user
    } catch (err) {
        logger.error(`while finding user by username: ${username}`, err)
        throw err
    }
}

async function add(user) {
    try {
        // Validate user object
        if (!user.username || !user.password || !user.fullname) {
            throw new Error('Missing required user fields')
        }

        const collection = await dbService.getCollection('users')
        const result = await collection.insertOne(user)
        
        if (!result.acknowledged) {
            throw new Error('Failed to insert user')
        }

        user._id = result.insertedId
        return user
    } catch (err) {
        logger.error('cannot insert user', err)
        throw err
    }
}

function _buildCriteria(filterBy) {
    const criteria = {}
    if (filterBy.txt) {
        const txtCriteria = { $regex: filterBy.txt, $options: 'i' }
        criteria.$or = [
            {
                username: txtCriteria
            },
            {
                fullname: txtCriteria
            }
        ]
    }
    if (filterBy.minBalance) {
        criteria.score = { $gte: filterBy.minBalance }
    }
    return criteria
}


