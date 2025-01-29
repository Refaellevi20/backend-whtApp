// const Cryptr = require('cryptr')
// const bcrypt = require('bcrypt')
// const userService = require('../user/user.service')
// const logger = require('../../services/logger.service')
// const cryptr = new Cryptr(process.env.SECRET1 || 'Secret-Puk-1234')

// async function login(username, password) {
//     try {
//         logger.debug(`auth.service - login attempt with username: ${username}`)

//         if (!username || !password) {
//             throw new Error('Username and password are required')
//         }

//         const user = await userService.getByUsername(username)
//         if (!user) {
//             logger.error(`auth.service - user ${username} not found`)
//             throw new Error('Invalid username or password')
//         }

//         // For development, use direct password comparison
//         const match = password === user.password
//         // For production, use bcrypt
//         // const match = await bcrypt.compare(password, user.password)
        
//         if (!match) {
//             logger.error(`auth.service - invalid password for user ${username}`)
//             throw new Error('Invalid username or password')
//         }

//         // Create user object without sensitive data
//         const userToReturn = {
//             _id: user._id.toString(),
//             username: user.username,
//             fullname: user.fullname,
//             imgUrl: user.imgUrl || "https://robohash.org/vitaequovelit.png?size=50x50&set=set4",
//             isOwner: user.isOwner,
//             isAdmin: user.isAdmin,
//             count: user.count || 0
//         }

//         logger.debug(`auth.service - login successful for user ${username}`)
//         return {
//             user: userToReturn,
//             loginToken: getLoginToken(userToReturn)
//         }
//     } catch (err) {
//         logger.error(`auth.service - login failed for user ${username}:`, err)
//         throw err
//     }
// }

// async function signup(userCred) {
//     try {
//         const { username, password, fullname, imgUrl } = userCred
        
//         logger.debug(`auth.service - signup attempt with username: ${username}, fullname: ${fullname}`)

//         // Validate required fields
//         if (!username || !password || !fullname) {
//             logger.error('auth.service - missing required signup information')
//             throw new Error('Missing required signup information')
//         }

//         // Check if user exists
//         const userExists = await userService.getByUsername(username)
//         if (userExists) {
//             logger.error(`auth.service - username ${username} already taken`)
//             throw new Error('Username already taken')
//         }

//         // Create new user
//         const user = await userService.add({
//             username,
//             password, // In development we store password as-is
//             fullname,
//             imgUrl: imgUrl || `https://robohash.org/${username}.png?size=50x50&set=set4`,
//             isOnline: false,
//             lastSeen: new Date(),
//             contacts: [],
//             count: 0
//         })

//         if (!user) {
//             logger.error('auth.service - failed to create user')
//             throw new Error('Failed to create user')
//         }

//         logger.debug(`auth.route - new account created: ${JSON.stringify(user)}`)

//         // Return user object without sensitive data
//         const userToReturn = {
//             _id: user._id,
//             username: user.username,
//             fullname: user.fullname,
//             imgUrl: user.imgUrl,
//             isOwner: user.isOwner || false,
//             isAdmin: user.isAdmin || false,
//             count: user.count || 0
//         }

//         return {
//             user: userToReturn,
//             loginToken: getLoginToken(userToReturn)
//         }
//     } catch (err) {
//         logger.error('auth.service - signup failed:', err)
//         throw err
//     }
// }

// function getLoginToken(user) {
//     return cryptr.encrypt(JSON.stringify({
//         _id: user._id,
//         fullname: user.fullname,
//         imgUrl: user.imgUrl,
//         isOwner: user.isOwner,
//         isAdmin: user.isAdmin,
//         count: user.count
//     }))
// }

// function validateToken(token) {
//     if (!token) return null
//     try {
//         const json = cryptr.decrypt(token)
//         return JSON.parse(json)
//     } catch (err) {
//         logger.error('Invalid token:', err)
//         return null
//     }
// }

// module.exports = {
//     signup,
//     login,
//     getLoginToken,
//     validateToken
// }


const Cryptr = require('cryptr')
const logger = require('../../services/logger.service')
const cryptr = new Cryptr(process.env.SECRET1 || 'Secret-Puk-1234')

async function login(username, password) {
    logger.debug(`auth.service - login with username: ${username}`)
    
    // No need to check database, frontend will handle authentication
    const userToReturn = {
        _id: _makeId(),
        username,
        fullname: username,
        imgUrl: `https://robohash.org/${username}.png?size=50x50&set=set4`,
        isOwner: username === 'admin',
        isAdmin: username === 'admin',
        count: 0
    }

    return {
        user: userToReturn,
        loginToken: getLoginToken(userToReturn)
    }
}

async function signup(userCred) {
    const { username, password, fullname, imgUrl } = userCred
    logger.debug(`auth.service - signup with username: ${username}, fullname: ${fullname}`)

    // Return a new user object
    const userToReturn = {
        _id: _makeId(),
        username,
        fullname,
        imgUrl: imgUrl || `https://robohash.org/${username}.png?size=50x50&set=set4`,
        isOwner: false,
        isAdmin: false,
        count: 0
    }

    return {
        user: userToReturn,
        loginToken: getLoginToken(userToReturn)
    }
}

function getLoginToken(user) {
    return cryptr.encrypt(JSON.stringify(user))
}

function validateToken(token) {
    try {
        const json = cryptr.decrypt(token)
        const loggedinUser = JSON.parse(json)
        return loggedinUser
    } catch (err) {
        console.error('Invalid token:', err)
        return null
    }
}

function _makeId(length = 24) {
    let txt = ''
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < length; i++) {
        txt += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return txt
}

module.exports = {
    signup,
    login,
    getLoginToken,
    validateToken
}