const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../model/user')
const Student = require('../model/student');
const mongoose = require('mongoose');
const multer  = require('multer');
const path = require('path');


mongoose.connect("mongodb://127.0.0.1/StudentsDatabase", { useNewUrlParser: true }, function (err) {
    if (err) throw err; console.log('Database Successfully connected');
});

function verifyToken(req,res,next){
    if (!req.headers.authorization){
        return res.status(401).send('Unauthorized request')
    }
    let token = req.headers.authorization.split(' ')[1];
    if(token == 'null'){
        return res.status(401).send('Unauthorized request')
    }
    let payload = jwt.verify(token,'secretKey')
    if(!payload){
        return res.status(401).send('Unauthorized request')
    }
    req.userId  = payload.subject
    next()
}

var storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,'uploads/')
    },
    filename:function(req,file,cb){
        let ext = path.extname(file.originalname)
        cb(null,Date.now()+ext)
    }
})
var upload = multer({
    storage:storage,
    filefilter:function(req,file,callback){
        if(
            file.mimetype == "image/png" ||
            file.mimetype == "image/jpg"
        ){
            callback(null,true)
        }else{
            console.log('only png and jpg files are supported!')
            callback(null.false)
        }
    },
    limits:{
        fileSize: 1024*1024*3
    }
})
   
router.get('/', (req, res) => {
     res.send('From API route')
}) 

router.post('/register',(req,res)=>{
    let userData = req.body
    let user = new User({
        email: userData.email,
        password:userData.password
    })
    user.save((error,registeredUser)=>{
        if(error){
            console.log(error);
        }else{
            let payload ={subject:registeredUser._id};
            let token = jwt.sign(payload,'secretKey');
            res.status(200).send({token})
        }
    })

}) 
router.post('/student-register', (req,res)=>{
    let studentData = req.body
    let student = new Student(studentData)
    student.save((error,registeredStudent)=>{
        if(error){
            console.log(error);
        }else{
            let payload ={subject:registeredStudent._id};
            let token = jwt.sign(payload,'secretKey');
            res.status(200).send({token,registeredStudent,student})
        }
    })

}) 


router.post('/login', (req, res) => {
     let userData = req.body

     User.findOne({email: userData.email}, (error, user)=> {
         if (error) { 
            console.log(error)
         } else { 
            if (!user) { 
               res.status(401).send('Invalid email')
            } else
            if ( user.password !== userData.password) {
                res.status(401).send('Invalid password')
            } else {
                let payload = {subject:user._id}
                let token = jwt.sign(payload,'secretKey')
                res.status(200).send({token})
            }
         }
     })
}) 

router.get('/events',verifyToken, (req, res) => {
    let events = [ 
        {
           "_id": "1",
           "name": "Auto Expo",
           "description": "lorem ipsum",
           "date": "2012-04-23t18:25:43.511Z"
        }, 
        {
            "_id": "2",
            "name": "Auto Expo",
            "description": "lorem ipsum",
            "date": "2012-04-23t18:25:43.511Z"
        },
        {
            "_id": "3",
            "name": "Auto Expo",
            "description": "lorem ipsum",
            "date": "2012-04-23t18:25:43.511Z"
         }, 
         {
            "_id": "4",
            "name": "Auto Expo",
            "description": "lorem ipsum",
            "date": "2012-04-23t18:25:43.511Z"
         }, 
         {
            "_id": "5",
            "name": "Auto Expo",
            "description": "lorem ipsum",
            "date": "2012-04-23t18:25:43.511Z"
         }, 
         {
            "_id": "6",
            "name": "Auto Expo",
            "description": "lorem ipsum",
            "date": "2012-04-23t18:25:43.511Z"
         } 
    ]  
    res.json(events)
}) 

router.get('/special',verifyToken ,(req,res)=>{
    let events = [ 
        {
           "_id": "1",
           "name": "Auto Expo",
           "description": "lorem ipsum",
           "date": "2012-04-23t18:25:43.511Z"
        }, 
        {
            "_id": "2",
            "name": "Auto Expo",
            "description": "lorem ipsum",
            "date": "2012-04-23t18:25:43.511Z"
        },
        {
            "_id": "3",
            "name": "Auto Expo",
            "description": "lorem ipsum",
            "date": "2012-04-23t18:25:43.511Z"
         }, 
         {
            "_id": "4",
            "name": "Auto Expo",
            "description": "lorem ipsum",
            "date": "2012-04-23t18:25:43.511Z"
         }, 
         {
            "_id": "5",
            "name": "Auto Expo",
            "description": "lorem ipsum",
            "date": "2012-04-23t18:25:43.511Z"
         }, 
         {
            "_id": "6",
            "name": "Auto Expo",
            "description": "lorem ipsum",
            "date": "2012-04-23t18:25:43.511Z"
         } 
    ]  
    res.json(events)
})

router.get('/studentList' ,(req,res)=>{
    Student.find(function (err, result) {
        if (err) return console.error(err);
        res.json(result);
    })
})

// student-register update api

router.put('/student-register' ,(req,res)=>{
    let hero = ({firstName,lastname} = req.body);
    let updatevar = { 
        firstName : hero.firstName,
        lastName : hero.lastName,
        age : '44',
        email : 'req@body.em',
        phone : '3424242',
        address : 'reqbodyaddress',
        password : 'reqbodypassword'
    };
    let filter = {_id:req.query._id,};
    Student.findOneAndUpdate(filter,{$set :updatevar},(err, student)=>{
        if(err) {return console.error(err);}  
        res.send(student)
        
    })
    
})


router.delete('/delete', verifyToken,(req,res,next)=>{
    // paramvar = req.query._id
    // console.log(paramvar)
    Student.findOneAndRemove({_id : req.query._id},(err,student)=>{
      if(err)
       res.status(500).json({errmsg:err});
     res.status(200).json({msg:student});
  
    });
  });
  




module.exports = router