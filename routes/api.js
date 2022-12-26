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
        return res.status(403).send('Forbidden')
    }
    let token = req.headers.authorization.split(' ')[1];
    if (token == 'null') {
        return res.status(403).send('Forbidden')
    }
    let payload = jwt.verify(token, 'secretKey')
    if (!payload) {
        return res.status(401).send('Unauthorized request')
    }
    req.userId = payload.subject
    currentUser = req. userId
    console.log(currentUser,'from first verify')
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
    }
}).single('photo')

var currentotp;
var currentUser;

async function genHash(req, res, next) {
    try {
        console.log(req.body)
        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(req.body.password, salt)
        req.body.password = hash
        next()
    }
    catch (error) {
        next(error)
    }
}
router.get('/', (req, res) => {
    res.send('From API route')
})

function otpverify(req, res, next) {
    let userData = req.body
    console.log(userData, userData.email)
    var otptoken = otpGenerator.generate(6, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false });
    // console.log(otptoken)
    sendEmail(userData.email, 'OTP Verification', `your otp is ${otptoken}`,)
    if (sendEmail) {
        currentotp = otptoken
        console.log(currentotp, 'from current otp')
        res.status(200).send('OTP sent on email successfully')
        next()
    } else {
        res.status(400).send("OTP is not sent")
        next()
    }
} 

router.post('/otpverify', otpverify)

router.post('/register',upload, genHash,  (req, res) => {
    let userData = req.body
    // console.log(userData,req.file,'body')
    let userquery = req.query
    const url = req.protocol + '://' + req.get("host");
    let newuser = new User(userData)
    if (req.file) {
        newuser.photo = url + '/' + req.file.filename
    }
    User.find({ email: userData.email })
        .then(result => {
            if (result.length) {
                res.status(401).send('user already exists')
            } else {    
                if (userData.otp === currentotp) {
                    newuser.save((error, registeredUser) => {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log(registeredUser,'saved user')
                            uname = registeredUser.username
                            let message = "User registered Succesfully"
                            let payload = { subject: registeredUser._id };
                            let token = jwt.sign(payload, 'secretKey', { expiresIn: '3600s' });
                            res.status(200).send({ token,registeredUser, message }) 
                        }
                    }
                    )
                }else{
                    res.status(401).send({message:'otp is invalid'})
                }
            }
        })
})

router.post('/login', (req, res) => {
    let userData = req.body
    // console.log(userData)
    User.findOne({ email: userData.email }, async function (error, user) {
        if (error) {
            console.log(error)
        } else {
            if (!user) { 
                return res.status(401).send({message:'Invalid email'})
            } else {
                console.log(user)
                const match = await bcrypt.compare(userData.password, user.password)
                console.log(match)
                if (match) {
                    let message = 'Login Success' 
                    let payload = { subject: user._id }
                    let token = jwt.sign(payload, 'secretKey', { expiresIn: '3600s' })
                    res.status(200).send({ token, user, message })
                } else {
                    res.status(401).send({message:'Login Failed! Invalid Password'})
                }
            }
        }
    })


})

router.post('/reset-password', (req, res) => {
    console.log(req.body, 'req body reset api')
    let userData = req.body
    User.find({ email: userData.email })
        .then(result => {
            if (result.length) {
                var otptoken = otpGenerator.generate(6, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false });
                console.log(otptoken)
                sendEmail(userData.email, 'OTP Verification', `your otp is ${otptoken}`,)
                if (sendEmail) {
                    currentotp = otptoken
                    // console.log(currentotp,'from current otp')
                    res.status(200).send({message:'email is sent successfully'})
                } else {
                    res.status(400).send({message:"email is not sent"})
                }

            } else {
                res.status(404).send({message:"user not found"})
            }
        })

})

router.put('/register', genHash,(req, res) => {
    console.log(req.body, req.query)
    let userreq = req.body
    let userquery = req.query
    if (userquery.otp === currentotp) {
        let filter = { email: userquery.email }
        updatevar = {
            email: userreq.email,
            password: userreq.password
        };
        User.findOneAndUpdate(filter, updatevar, { new: true }, (err, user) => {
            if (err) { return console.error(err); }
            let message = 'Password Changed Successfully'
            res.status(200).send({user,message})

        })
    } else {
        (res.status(400).send({message:'OTP Is Not Valid'}))
    }
})
router.post('/student-register', verifyToken, upload, (req, res) => {
    const url = req.protocol + '://' + req.get("host");
    let studentData = req.body
    // console.log(req.body,req.file)
    let newstudent = new Student(studentData)
    if (req.file) {
        // student.photo = req.file.path
        newstudent.photo = url + '/' + req.file.filename
    }
    newstudent.userId = currentUser
    newstudent.save((error, registeredUser) => {
        if (error) {
            console.log(error)
            res.status(500).send({message:"Can't Register ! Please Try Again"})
        } else {
            let message ="Student Registered Succesfully"
            res.status(200).send({registeredUser,message})
        }
    })

})

router.get('/fbregister', (req, res) => {
    res.render('views/facebook.ejs', {
        user: req.user
    })
    // console.log(req.user,req.profile)
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

router.get('/studentList', verifyToken, async (req, res) => {
    // Student.find(function (err, result) {
    //     if (err) { return console.error(err) }
    //     res.json(result.filter(result => result.userId === currentUser));
    let agg = await Student.aggregate([
        {$match : {userId:currentUser}},
        {$project : {__v:0,password:0,userId:0}}
    ])
    // console.log(agg)
    res.status(200).send(agg)
    })

router.get('/userDetails', verifyToken, (req, res) => {
    User.findOne({_id:currentUser}, (err, result) =>{
        if (err) { return console.error(err) }
        // console.log(result,'user details')
        res.json(result);
    })
})

// user-register update api
router.put('/userDetails',verifyToken, upload, (req, res) => {
    let sd = req.body
    const url = req.protocol + '://' + req.get("host");
    
    let updatevar = {
        firstName: sd.firstName,
        lastName: sd.lastName,
        email:sd.email
    };
    if (req.file) {
        updatevar.photo = url + '/' + req.file.filename
    }
    // console.log(filter, req.body, req.body.firstName)
    User.findByIdAndUpdate({ _id:currentUser }, updatevar, { new: true }, (err, user) => {
        if (err) { 
            console.error(err)
            res.status(500).send({message:"Can't Update ! please try again"}) 
        }
        let message = "User Updated Successfully"
        res.send({user,message})
    })

})

// student-register update api
router.put('/student-register', verifyToken, upload, (req, res) => {
    let sd = req.body
    const url = req.protocol + '://' + req.get("host");
    
    let updatevar = {
        firstName: sd.firstName,
        lastName: sd.lastName,
        age: sd.age,
        email: sd.email,
        phone: sd.phone,
        address: sd.address,
        password: sd.password
    };
    if (req.file) {
        updatevar.photo = url + '/' + req.file.filename
    }
    let filter = { _id: req.query._id, };
    // console.log(filter, req.body, req.body.firstName)
    Student.findByIdAndUpdate(filter, updatevar, { new: true }, (err, student) => {
        if (err) {
            console.error(err)
            res.status(500).send({message:"Can't Update ! Please try again"})
         }
        let message = "Student Updated Successfully"
        res.send({student,message})

    })

})

router.delete('/student-register', verifyToken, (req, res, next) => {
    // paramvar = req.query._id
    // console.log(paramvar)
    Student.findOneAndRemove({ _id: req.query._id }, (err, student) => {
        if (err) res.status(500).json({ message: err });
        let message="Student Deleted Successfully"
        res.status(200).send({student,message});
    });
});


router.post('/deleteAccount', verifyToken, (req, res) => {
    userData = req.body;
    if (!userData.password) {
        return res.status(400).json({ message: "please enter password" })
    }
    User.findOne({ _id: currentUser}, async (error, user) => {
        if (error) console.log(error)
        else {
            console.log(userData.password, user.password)
            const isMatch = await bcrypt.compare(userData.password, user.password) 
            console.log(isMatch)
            if (!isMatch) {
                res.status(400).json({ message: "Password Does NOt Match" })
 
            } else {
                User.deleteOne({ _id: user._id }, (err, docs) => {
                    if (err) console.log(err)
                    else {
                        res.status(200).json({ message: "User Have Been Deleted Successfully" })
                        console.log(docs)
                    }
                });
                Student.deleteMany({ userId: user._id }, (err, docs) => {
                    if (err) console.log(err)
                    console.log(docs)
                })
            }
        }
    })
})



module.exports = router