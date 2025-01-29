const mongoose = require('mongoose')
const logger = require('./logger.service')

module.exports = {
    getCollection,
    connect
}

const dbName = 'whatapp_db'

async function connect() {
    try {
        const mongoUrl = `mongodb://127.0.0.1:27017/${dbName}`
        await mongoose.connect(mongoUrl)
        logger.info('Connected to MongoDB successfully')
    } catch (err) {
        logger.error('Cannot Connect to DB', err)
        throw err
    }
}

async function getCollection(collectionName) {
    try {
        return mongoose.connection.db.collection(collectionName)
    } catch (err) {
        logger.error('Failed to get Mongo collection', err)
        throw err
    }
}