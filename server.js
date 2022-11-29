const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const path=require('path')

const PORT = 3000
const api = require('./routes/api')
const app = express()
app.use(cors())

app.use(bodyParser.json()) 
app.use(express.static(path.join(__dirname,'uploads')))

app.use('/api', api)
app.get('/', function(req, res){ 
    res.send('Hello from server') 
}) 

app.listen(PORT, function(){ 
    console.log('Server running on localhost:' + PORT)
})