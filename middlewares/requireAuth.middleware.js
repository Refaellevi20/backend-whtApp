const authService = require('../api/auth/auth.service')
const logger = require('../services/logger.service')
const config = require('../config')
const asyncLocalStorage = require('../services/als.service')

function requireAuth(req, res, next) {
    const { loginToken } = req.cookies
    
    logger.debug('Cookies received:', req.cookies)
    
    // Handle guest mode
    if (config.isGuestMode && !loginToken) {
        req.loggedinUser = { _id: '', fullname: 'Guest' }
        return next()
    }

    // Validate token
    try {
        const loggedinUser = authService.validateToken(loginToken)
        if (!loggedinUser) {
            return res.status(401).send({ err: 'Not authenticated - invalid token' })
        }

        // Store in async local storage
        const alsStore = asyncLocalStorage.getStore()
        alsStore.loggedinUser = loggedinUser
        
        // Store in request object
        req.loggedinUser = loggedinUser
        
        next()
    } catch (err) {
        logger.error('Failed to validate token:', err)
        res.status(401).send({ err: 'Not authenticated' })
    }
}

function requireAdmin(req, res, next) {
    const { loginToken } = req.cookies
    
    if (!loginToken) {
        return res.status(401).send({ err: 'Not authenticated' })
    }

    try {
        const loggedinUser = authService.validateToken(loginToken)
        if (!loggedinUser) {
            return res.status(401).send({ err: 'Not authenticated - invalid token' })
        }

        if (!loggedinUser.isAdmin) {
            logger.warn(`${loggedinUser.fullname} attempted to perform admin action`)
            return res.status(403).send({ err: 'Not authorized' })
        }

        next()
    } catch (err) {
        logger.error('Failed to validate admin:', err)
        res.status(401).send({ err: 'Not authenticated' })
    }
}

module.exports = {
    requireAuth,
    requireAdmin
}