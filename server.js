const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const path=require('path')

const PORT = 3000
const api = require('./routes/api')
const paytm = require('./routes/paytm')
const app = express()
const session = require('express-session')
const passport = require('passport')
const FacebookStategy = require('passport-facebook').Strategy

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.set('views', __dirname);
app.use(express.static('./assets'));
app.use(cors())
app.use(bodyParser.json()) 
app.use(express.static(path.join(__dirname,'uploads')))

app.use('/api', api)
app.use('/paytm', paytm)

app.use(session({
    secret:"thisissecretkey",
    resave: false,
    saveUninitialized:true,
    cookie: { secure: false }
}))
app.use(passport.initialize())
app.use(passport.session())
passport.use(new FacebookStategy({
    clientID:"529729785398057",
    clientSecret:"817efd8dc6e0299fe8d31db6920803fd",
    callbackURL:"http://localhost:3000/facebook/callback",
    profileFields:['id','displayName','name','gender']
},function(accessToken,refreshToken,profile,done){
    console.log(accessToken,refreshToken,profile)
    // const user = {}
    return done(null,profile)
}
))

passport.serializeUser(function(user,done){
    done(null,user.id)
})

passport.deserializeUser(function(id,done){
    return done(null,id)
})

app.get('/auth/facebook',passport.authenticate('facebook',{scope:'email'}),(req,res)=>{
    console.log(req,res)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).send('response from facebook')
})

app.get('/facebook/callback',passport.authenticate('facebook',{
    successRedirect:'/api/fbevents',
    failureRedirect:'/api/login'
}))
app.get('/logout',(req,res)=>{
    req.logout()
    res.redirect('/')
})

app.get('/', function(req, res){ 
    res.send('Hello from server') 
}) 

app.listen(PORT, function(){ 
    console.log('Server running on localhost:' + PORT)
})