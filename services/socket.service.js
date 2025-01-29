const logger = require('./logger.service')

let gIo = null

function setupSocketAPI(http) {
    gIo = require('socket.io')(http, {
        cors: {
            origin: ['http://127.0.0.1:5173', 'http://localhost:5173'],
            credentials: true
        }
    })

    gIo.on('connection', socket => {
        logger.info(`New client connected [id: ${socket.id}]`)

        socket.on('set-user-socket', userId => {
            logger.info(`Setting socket.userId = ${userId} for socket [id: ${socket.id}]`)
            socket.userId = userId
            socket.join(userId)
        })

        socket.on('unset-user-socket', () => {
            logger.info(`Removing socket.userId for socket [id: ${socket.id}]`)
            delete socket.userId
        })

        socket.on('chat-send-msg', msg => {
            logger.info(`New chat msg from socket [id: ${socket.id}], msg: ${JSON.stringify(msg)}`)
            socket.to(msg.toUserId).emit('chat-add-msg', msg)
        })

        socket.on('user-typing', ({ toUserId, isTyping }) => {
            logger.info(`User ${socket.userId} typing status to ${toUserId}: ${isTyping}`)
            socket.to(toUserId).emit('user-is-typing', {
                userId: socket.userId,
                isTyping
            })
        })

        socket.on('disconnect', () => {
            logger.info(`Client disconnected [id: ${socket.id}]`)
            if (socket.userId) {
                gIo.emit('user-offline', socket.userId)
            }
        })
    })
}

function emitTo({ type, data, label }) {
    if (label) {
        logger.info(`Emitting to label ${label}: ${type}`)
        gIo.to('watching:' + label).emit(type, data)
    } else {
        logger.info(`Broadcasting: ${type}`)
        gIo.emit(type, data)
    }
}

function emitToUser({ type, data, userId }) {
    logger.info(`Emitting to user ${userId}: ${type}`)
    gIo.to(userId).emit(type, data)
}

// For debugging
function _printSockets() {
    const sockets = gIo.sockets.sockets
    console.log(`Sockets: (count: ${sockets.size})`)
    sockets.forEach(socket => {
        console.log(`- [id: ${socket.id}], userId: ${socket.userId}`)
    })
}

module.exports = {
    setupSocketAPI,
    emitTo,
    emitToUser
}