const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const Schema = mongoose.Schema
const userSchema = new Schema({
     // "_id":String,
     "photo":String,
     "firstName":String,
     "lastName":String,
<<<<<<< HEAD
     // "username":String,
=======
>>>>>>> 0af16dad27fb797c8b59ec27086b60b43d8f9daa
     "email": String, 
     "password":String
})
// userSchema.pre('save',async function(next){
//      try{
//          const salt = await bcrypt.genSalt(10)
//          const hash = await bcrypt.hash(this.password,salt) 
//          this.password = hash
//          next()
//      }
//      catch(error){
//           next(error)
//      }
// })
module.exports = mongoose.model('user', userSchema, 'users') 