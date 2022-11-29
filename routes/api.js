const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../model/user')
const Student = require('../model/student');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
// const nodemailr = require('nodemailer')
const sendEmail = require('../nodemailr')
const otpGenerator = require('otp-generator')
const passport = require('passport')
const session = require('express-session')
const bcrypt = require('bcrypt')



mongoose.connect("mongodb://localhost:27017/StudentsDatabase", { useNewUrlParser: true }, function (err) {
    if (err) throw err; console.log('Database Successfully connected');
});



function verifyToken(req, res, next) {
    if (!req.headers.authorization) {
        return res.status(401).send('Unauthorized request')
    }
    let token = req.headers.authorization.split(' ')[1];
    if (token == 'null') {
        return res.status(401).send('Unauthorized request')
    }
    let payload = jwt.verify(token, 'secretKey')
    if (!payload) {
        return res.status(401).send('Unauthorized request')
    }
    req.userId = payload.subject
    next()
}

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        // let ext = path.extname(file.originalname)
        cb(null, Date.now() + file.originalname)
    }
})
var upload = multer({
    storage: storage,
    filefilter: function (req, file, callback) {
        if (
            file.mimetype == "image/png" ||
            file.mimetype == "image/jpg"
        ) {
            callback(null, true)
        } else {
            console.log('only png and jpg files are supported!')
            callback(null.false)
        }
    },
    limits: {
        fileSize: 1024 * 1024 * 3
    }
}).single('photo')






var currentotp;
var founduser;

router.get('/', (req, res) => {
    res.send('From API route')
})
async function genHash(req, res, next) {
    try {
        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(req.body.password, salt)
        req.body.password = hash
        next()
    }
    catch (error) {
        next(error)
    }
}
// async function matchHash(req,res,next){
//     User.findOne({ email: req.body.email }, (error, user) => {
//         if (error) {
//             console.log(error)
//         } else {
//             if (!user) {
//                 res.status(401).send('Invalid email')
//             } else
//                 if (user.password !== userData.password) {
//                     res.status(401).send('Invalid password')
//                 } else {
//                     let payload = { subject: user._id }
//                     let token = jwt.sign(payload, 'secretKey')
//                     res.status(200).send({ token })
//                 }
//         }
//     })
//     try{
//         const hash = await bcrypt.compare(req.body.password,) 
//         req.body.password = hash
//         next()
//     }
//     catch(error){
//          next(error)
//     }
// }

router.post('/register', genHash, (req, res) => {
    let userData = req.body
    console.log(userData)
    let newuser = new User(userData)
    User.find({ email: userData.email })
        .then(result => {
            if (result.length) {
                res.status(401).send('user already exists')
            } else {
                newuser.save((error, registeredUser) => {
                    if (error) {
                        console.log(error);
                    } else {
                        let payload = { subject: registeredUser._id };
                        let token = jwt.sign(payload, 'secretKey');
                        res.status(200).send({ token })
                    }
                })
            }
        })
})

router.post('/login', (req, res) => {
    let userData = req.body
    console.log(userData)
    User.findOne({ email: userData.email }, async function(error, user){
        if (error) {
            console.log(error)
        } else {
            if (!user) {
                res.status(401).send('Invalid email')
            } else
            founduser= user
            console.log(founduser)
            const match = await bcrypt.compare(userData.password,founduser.password)
            console.log(match)
            if (match) {
                let payload = { subject: user._id }
                let token = jwt.sign(payload, 'secretKey')
                res.status(200).send({ token })
            } else {
                res.status(401).send('Invalid password')
            }
        }
    })
    

})

router.post('/reset-password', (req, res) => {
    console.log(req.body,'chetan Sir')
    let userData = req.body
    var otptoken = otpGenerator.generate(6, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false });
    console.log(otptoken)
    User.find({ email: userData.email })
        .then(result => {
            if (result.length) {
                sendEmail(userData.email, 'OTP Verification', `your otp is ${otptoken}`,)
                if (sendEmail) {
                    currentotp = otptoken
                    // console.log(currentotp,'from current otp')
                    res.status(200).send('email is sent successfully')
                } else {
                    res.status(400).send("email is not sent")
                }

            } else {
                res.status(404).send("user not found")
            }
        })

})

router.put('/register', (req, res) => {
    console.log(req.body,req.query,'dixitbackend')
    let userreq = req.body
    let userquery = req.query
    if (userquery.otp === currentotp) {
        // console.log(userquery.otp,currentotp)
        let filter = { email: userquery.email }
        updatevar = {
            email: userreq.email,
            password: userreq.password
        };
        User.findOneAndUpdate(filter, updatevar, { new: true }, (err, user) => {
            if (err) { return console.error(err); }
            res.status(200).send(user)

        })
    } else (res.status(400).send('otp is not valid'))
})
router.post('/student-register', upload, (req, res) => {
    const url = req.protocol + '://' + req.get("host");
    let studentData = req.body
    // console.log(req.body,req.file)
    let student = new Student(studentData)
    if (req.file) {
        // student.photo = req.file.path
        student.photo = url + '/' + req.file.filename
    }
    student.save((error, registeredStudent) => {
        if (error) {
            console.log(error);
        } else {
            let payload = { subject: registeredStudent._id };
            let token = jwt.sign(payload, 'secretKey');
            res.status(200).send({ token, registeredStudent, student })
        }
    })

})





router.get('/fbevents', isLoggedIn, (req, res) => {
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
    // res.send(req.user)
})
router.get('/events', verifyToken, (req, res) => {
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
    // res.send(req.user)
})
function isLoggedIn(req, res, next) {
    if (req.isAuthanticated())
        return next()
    res.redirect('/')
}

router.get('/special', verifyToken, (req, res) => {
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

router.get('/studentList', (req, res) => {
    Student.find(function (err, result) {
        if (err) { return console.error(err) }
        res.json(result);
    })
})

// student-register update api

router.put('/student-register', verifyToken, upload, (req, res) => {
    // console.log(req)
    let sd = req.body
    let sd1 = req.file
    let updatevar = {
        photo: sd1.path,
        firstName: sd.firstName,
        lastName: sd.lastName,
        age: sd.age,
        email: sd.email,
        phone: sd.phone,
        address: sd.address,
        password: sd.lpassword
    };
    let filter = { _id: req.query._id, };
    console.log(filter, req.body, req.body.firstName)
    Student.findByIdAndUpdate(filter, updatevar, { new: true }, (err, student) => {
        if (err) { return console.error(err); }
        res.send(student)

    })

})


router.delete('/student-register', verifyToken, (req, res, next) => {
    // paramvar = req.query._id
    // console.log(paramvar)
    Student.findOneAndRemove({ _id: req.query._id }, (err, student) => {
        if (err)
            res.status(500).json({ errmsg: err });
        res.status(200).json({ msg: student });

    });
});

module.exports = router