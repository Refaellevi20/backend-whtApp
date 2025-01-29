const Chat = require('../../models/chat.model')
const logger = require('../../services/logger.service')

async function query(userId) {
    try {
        const chats = await Chat.find({ participants: userId })
            .populate('participants', 'fullname imgUrl')
            .populate('messages.sender', 'fullname imgUrl')
        return chats
    } catch (err) {
        logger.error('cannot find chats', err)
        throw err
    }
}

async function getById(chatId) {
    try {
        const chat = await Chat.findById(chatId)
            .populate('participants', 'fullname imgUrl')
            .populate('messages.sender', 'fullname imgUrl')
        return chat
    } catch (err) {
        logger.error(`while finding chat ${chatId}`, err)
        throw err
    }
}

async function add(chat) {
    try {
        const addedChat = await Chat.create(chat)
        return addedChat
    } catch (err) {
        logger.error('cannot add chat', err)
        throw err
    }
}

async function update(chatId, update) {
    try {
        const updatedChat = await Chat.findByIdAndUpdate(chatId, update, { new: true })
        return updatedChat
    } catch (err) {
        logger.error(`cannot update chat ${chatId}`, err)
        throw err
    }
}

async function remove(chatId) {
    try {
        await Chat.findByIdAndDelete(chatId)
    } catch (err) {
        logger.error(`cannot remove chat ${chatId}`, err)
        throw err
    }
}

async function addMessage(chatId, message) {
    try {
        const chat = await Chat.findByIdAndUpdate(
            chatId,
            { $push: { messages: message } },
            { new: true }
        ).populate('messages.sender', 'fullname imgUrl')
        return chat
    } catch (err) {
        logger.error(`cannot add message to chat ${chatId}`, err)
        throw err
    }
}

module.exports = {
    query,
    getById,
    add,
    update,
    remove,
    addMessage
}