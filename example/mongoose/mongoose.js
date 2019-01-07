const mongoose = require('mongoose')

module.exports = mongoose.connection = mongoose.createConnection('mongodb://localhost:27017/test', { useNewUrlParser: true })
