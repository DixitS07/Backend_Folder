const mongoose = require('mongoose')

const Schema = mongoose.Schema
const studentSchema = new Schema({
    "photo":String,
     "firstName":String,
     "lastName":String,
     "age":Number,
     "email": String,
     "phone":Number,
     "address":String,
     "password":String
    
})

module.exports= mongoose.model('student',studentSchema,'studentsFull') 