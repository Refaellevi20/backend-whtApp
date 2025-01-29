// const authService = require('./auth.service')
// const logger = require('../../services/logger.service')

// async function login(req, res) {
//     const { username, password } = req.body
//     try {
//         logger.debug('Login attempt:', { username })
        
//         if (!username || !password) {
//             return res.status(400).send({ err: 'Username and password are required' })
//         }

//         const { user, loginToken } = await authService.login(username, password)
//         logger.info('User login:', user)

//         // Set cookie with proper options
//         res.cookie('loginToken', loginToken, {
//             sameSite: 'None',
//             secure: true,
//             httpOnly: true,
//             maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
//         })

//         res.json(user)
//     } catch (err) {
//         logger.error('Failed to Login:', err)
//         res.status(401).send({ err: err.message || 'Failed to Login' })
//     }
// }

// async function signup(req, res) {
//     try {
//         const { username, password, fullname, imgUrl } = req.body
        
//         if (!username || !password || !fullname) {
//             return res.status(400).send({ err: 'All fields are required' })
//         }

//         const { user, loginToken } = await authService.signup(username, password, fullname, imgUrl)
//         logger.info('User signup:', user)

//         // Set cookie with proper options
//         res.cookie('loginToken', loginToken, {
//             sameSite: 'None',
//             secure: true,
//             httpOnly: true,
//             maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
//         })

//         res.json(user)
//     } catch (err) {
//         logger.error('Failed to signup:', err)
//         res.status(500).send({ err: err.message || 'Failed to signup' })
//     }
// }

// async function logout(req, res) {
//     try {
//         // Clear cookie with same options as set
//         res.clearCookie('loginToken', {
//             sameSite: 'None',
//             secure: true,
//             httpOnly: true
//         })
//         res.send({ msg: 'Logged out successfully' })
//     } catch (err) {
//         res.status(500).send({ err: 'Failed to logout' })
//     }
// }

// module.exports = {
//     login,
//     signup,
//     logout
// }


const authService = require('./auth.service')
const logger = require('../../services/logger.service')

async function login(req, res) {
    const { username, password } = req.body
    try {
        const user = await authService.login(username, password)
        const loginToken = authService.getLoginToken(user.user)
        logger.info('User login:', user)
        
        res.cookie('loginToken', loginToken, {
            sameSite: 'None',
            secure: true,
            httpOnly: true
        })
        res.json(user)
    } catch (err) {
        logger.error('Failed to Login:', err)
        res.status(401).send({ err: 'Failed to Login' })
    }
}

async function signup(req, res) {
    try {
        const { username, password, fullname, imgUrl } = req.body
        const account = await authService.signup({ username, password, fullname, imgUrl })
        logger.debug(`auth.route - new account created: ${JSON.stringify(account)}`)
        
        const loginToken = authService.getLoginToken(account.user)
        res.cookie('loginToken', loginToken, {
            sameSite: 'None',
            secure: true,
            httpOnly: true
        })
        res.json(account)
    } catch (err) {
        logger.error('Failed to signup:', err)
        res.status(500).send({ err: 'Failed to signup' })
    }
}

async function logout(req, res) {
    try {
        res.clearCookie('loginToken')
        res.send({ msg: 'Logged out successfully' })
    } catch (err) {
        res.status(500).send({ err: 'Failed to logout' })
    }
}

module.exports = {
    login,
    signup,
    logout
}