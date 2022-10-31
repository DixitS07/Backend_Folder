const mongoose = require('mongoose')

const Schema = mongoose.Schema
const userSchema = new Schema({
     "firstName":String,
     "lastName":String,
     "age":Number,
     "email": String,
     "phone":Number,
     "address":String,
     "password":String
})
module.exports = mongoose.model('user', userSchema, 'users')