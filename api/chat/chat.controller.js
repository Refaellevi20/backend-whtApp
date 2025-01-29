const Chat = require('../../models/chat.model');

// Get all chats for a user
const getChats = async (req, res) => {
    try {
        const chats = await Chat.find({
            participants: req.user.userId
        }).populate('participants', 'username profilePic');
        
        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single chat by ID
const getChatById = async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.id)
            .populate('participants', 'username profilePic');
        
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }
        
        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create new chat
const createChat = async (req, res) => {
    try {
        const newChat = await Chat.create({
            participants: [req.user.userId, req.body.participantId],
            messages: []
        });
        
        const populatedChat = await newChat.populate('participants', 'username profilePic');
        res.status(201).json(populatedChat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update chat
const updateChat = async (req, res) => {
    try {
        const chat = await Chat.findByIdAndUpdate(
            req.params.id,
            { $push: { messages: req.body.message } },
            { new: true }
        ).populate('participants', 'username profilePic');
        
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }
        
        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete chat
const deleteChat = async (req, res) => {
    try {
        const chat = await Chat.findByIdAndDelete(req.params.id);
        
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }
        
        res.json({ message: 'Chat deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getChats,
    getChatById,
    createChat,
    updateChat,
    deleteChat
};