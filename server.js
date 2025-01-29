// const express = require('express')
// const cors = require('cors')
// const path = require('path')
// const cookieParser = require('cookie-parser')
// const dbService = require('./services/db.service')
// const logger = require('./services/logger.service')
// require('dotenv').config()

// const app = express()
// const http = require('http').createServer(app)

// // Express App Config
// app.use(express.json())
// app.use(cookieParser())
// app.use(express.static('public'))

// if (process.env.NODE_ENV === 'production') {
//     app.use(express.static(path.resolve(__dirname, 'public')))
// } else {
//     const corsOptions = {
//         origin: ['http://127.0.0.1:5173', 'http://localhost:5173',],
//         credentials: true
//     }
//     app.use(cors(corsOptions))
// }

// // Routes
// const authRoutes = require('./api/auth/auth.routers')
// const userRoutes = require('./api/user/user.routers')
// const chatRoutes = require('./api/chat/chat.routes')

// const setupAsyncLocalStorage = require('./middlewares/setupAls.middleware')
// app.all('*', setupAsyncLocalStorage)

// const { setupSocketAPI } = require('./services/socket.service')

// // API routes
// app.use('/api/auth', authRoutes)
// app.use('/api/user', userRoutes)
// app.use('/api/chat', chatRoutes)

// // Socket.io setup
// setupSocketAPI(http)

// // Make every server-side-route fall back to index.html
// app.get('/**', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'))
// })

// const PORT = process.env.PORT || 3030

// async function startServer() {
//     try {
//         await dbService.connect()
//         http.listen(PORT, () => {
//             logger.info(`Server is running on port: ${PORT}`)
//             logger.info(`Server is running in ${process.env.NODE_ENV || 'development'} mode`)
//         })
//     } catch (err) {
//         logger.error('Cannot connect to DB', err)
//         process.exit(1)
//     }
// }

// startServer()


const express = require('express')
const cors = require('cors')
const http = require('http')

const app = express()
const server = http.createServer(app)
const io = require('socket.io')(server, {
    cors: {
        origin: ['http://127.0.0.1:5173', 'http://localhost:5173'],
        credentials: true
    }
})

app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' http://localhost:3030;");
    next();
});

// Connected users map and active groups
const connectedUsers = new Map()
const activeGroups = new Map()

app.use(express.static('public'))
app.use(express.json())
app.use(cors({
    origin: ['http://127.0.0.1:5173', 'http://localhost:5173'],
    credentials: true
}))

app.get('/', (req, res) => {
    res.send('Hello, World!')
})


io.on('connection', socket => {
    console.log('New client connected:', socket.id)

    socket.on('set-user-socket', userId => {
        console.log(`Setting socket.userId = ${userId} for socket [id: ${socket.id}]`)
        socket.userId = userId
        connectedUsers.set(userId, socket.id)
        socket.join(userId)
    })

    // Group chat events
    socket.on('create-group', group => {
        console.log('New group created:', group)
        
        // Join creator to group room
        socket.join(group._id)
        
        // Add group to active groups
        activeGroups.set(group._id, group)
        
        // Notify all group members
        group.members.forEach(member => {
            const memberSocketId = connectedUsers.get(member.userId)
            if (memberSocketId) {
                io.to(memberSocketId).emit('group-created', group)
                // Join member to group room
                io.sockets.sockets.get(memberSocketId)?.join(group._id)
            }
        })
    })

    socket.on('join-group', groupId => {
        console.log(`User ${socket.userId} joining group ${groupId}`)
        socket.join(groupId)
    })

    socket.on('leave-group', groupId => {
        console.log(`User ${socket.userId} leaving group ${groupId}`)
        socket.leave(groupId)
    })

    socket.on('group-message', message => {
        console.log('New group message:', message)
        
        // Broadcast to all members in the group
        io.to(message.groupId).emit('chat-add-msg', {
            ...message,
            type: 'group',
            timestamp: Date.now()
        })
    })

    socket.on('group-update', ({ groupId, update, type }) => {
        console.log('Group update:', { groupId, update, type })
        
        // Update active group data
        const group = activeGroups.get(groupId)
        if (group) {
            Object.assign(group, update)
            activeGroups.set(groupId, group)
        }
        
        // Broadcast update to all group members
        io.to(groupId).emit('group-updated', { groupId, update, type })
    })

    // Direct chat events
    socket.on('chat-send-msg', msg => {
        console.log('New direct message:', msg)
        
        if (msg.toUserId) {
            // Emit to recipient
            socket.to(msg.toUserId).emit('chat-add-msg', {
                ...msg,
                type: 'direct',
                timestamp: Date.now()
            })
            // Emit back to sender
            socket.emit('chat-add-msg', {
                ...msg,
                type: 'direct',
                timestamp: Date.now()
            })
        }
    })

    // Handle member management
    socket.on('add-to-group', ({ groupId, userId }) => {
        const memberSocketId = connectedUsers.get(userId)
        if (memberSocketId) {
            io.sockets.sockets.get(memberSocketId)?.join(groupId)
        }
    })

    socket.on('remove-from-group', ({ groupId, userId }) => {
        const memberSocketId = connectedUsers.get(userId)
        if (memberSocketId) {
            io.sockets.sockets.get(memberSocketId)?.leave(groupId)
        }
    })

    // socket.on('user-typing', ({ chatId, userId, isGroup }) => {
    //     if (isGroup) {
    //         // Broadcast typing status to all group members except sender
    //         socket.to(chatId).emit('user-is-typing', { userId, chatId })
    //     } else {
    //         // Broadcast to chat participant
    //         socket.to(chatId).emit('user-is-typing', { userId, chatId })
    //     }
    // })

    // socket.on('user-stop-typing', ({ chatId, userId, isGroup }) => {
    //     if (isGroup) {
    //         socket.to(chatId).emit('user-stopped-typing', { userId, chatId })
    //     } else {
    //         socket.to(chatId).emit('user-stopped-typing', { userId, chatId })
    //     }
    // })

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
        if (socket.userId) {
            connectedUsers.delete(socket.userId)
            
            // Leave all group rooms
            socket.rooms.forEach(room => {
                if (room !== socket.id) {
                    socket.leave(room)
                }
            })
        }
    })
})

// Error handling
io.on('error', (err) => {
    console.error('Socket.IO Error:', err)
})

const port = process.env.PORT || 3030
server.listen(port, () => {
    console.log('Server is running on port:', port)
})