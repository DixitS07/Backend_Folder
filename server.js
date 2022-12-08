const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const path = require('path')
const jwt = require('jsonwebtoken');

const PORT = 3000
const api = require('./routes/api')
const paytm = require('./routes/paytm')
const app = express()
const session = require('express-session')
const passport = require('passport')
const FacebookStategy = require('passport-facebook').Strategy
const User = require('./model/user')
require("dotenv").config();

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.set('views', __dirname);
app.use(express.static('./assets'));
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended:false}))
app.use(express.static(path.join(__dirname, 'uploads')))

app.use('/api', api)
app.use('/paytm', paytm)

app.use(session({
    secret: "thisissecretkey",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(passport.authenticate('session'));
passport.use(new FacebookStategy({
    clientID: process.env.clientID,
    clientSecret: process.env.clientSecret,
    callbackURL: "http://localhost:3000/facebook/callback",
    profileFields: ['id', 'displayName', 'name', 'gender', 'email']
}, function (accessToken, refreshToken, profile, done) {
    console.log(accessToken, refreshToken, profile, profile._json.email)
    // (req,res)=>{
    let userData = { _id: profile.id, email: profile._json.email }
    let newuser = new User(userData)
    User.find({ _id: userData._id })
        .then(
            result => {
                if (result.length) {
                    console.log('fb user already exist')
                }else{
                    newuser.save()
                }
            })
                    // (error, user) => {
    //                     if (error) {
    //                         console.log(error)
    //                         // return done(null,error)
    //                     } else {
    //                         if (!user) {
    //                             console.log('user not found')
    //                             // res.status(404).send('Invalid Credentials')
    //                             // return done(null,error)
    //                         } else {
    //                             let payload = { subject: user._id }
    //                             let token = jwt.sign(payload, 'secretKey')
    //                             // res.status(200).send({ token })
    //                             console.log(token,'from login block')
    //                             return done(null,token)
    //                         }
    //                     }
    //                 }
    //             }

    //             else {
    //                 newuser.save((error, registeredUser) => {
    //                     if (error) {
    //                         console.log(error);
    //                         return done(null,error)
    //                     } else {
    //                         console.log(registeredUser)
    //                         let payload = { subject: registeredUser._id };
    //                         let token = jwt.sign(payload, 'secretKey');
    //                         // res.status(200).send({ token })
    //                         return done(null,token)
    //                     }
    //                 })
    //             }
    //         }
        
    //     )
    // newuser.save()
    return done(null,profile)
}

))

passport.serializeUser(function (user, done) {
    done(null, user.id)
})

passport.deserializeUser(function (id, done) {
    return done(null, id)
})

app.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }), (req, res) => {
    console.log(req, res)
    res.setHeader("Access-Control-Allow-Origin", "*");
    // res.status(200).send('./views/facebook.ejs')
})

app.get('/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/api/fbregister',
    failureRedirect: '/api/login'
}),
)
app.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/')
})

app.get('/', function (req, res) {
    res.send('Hello from server')
})

app.listen(PORT, function () {
    console.log('Server running on localhost:' + PORT + '...')
})