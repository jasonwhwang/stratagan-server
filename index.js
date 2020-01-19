const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const morgan = require('morgan')
if (process.env.NODE_ENV !== 'production') { require('dotenv').config() }

mongoose.connect(process.env.M_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
}, function(err) {
  err ? console.log(err) : console.log("Server Connected.")
})

const app = express()
app.use(cors())
app.use(morgan('dev'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

require('./models')
app.use('/api', require('./routes'))
app.get('/', (req, res) => {
  res.send("Stratagan API");
});

app.use(function(req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({'errors': {
    message: err.message,
    error: {}
  }})
})

const port = process.env.PORT || 5000
app.listen(port, () => {
  console.log('API Port: ' + port)
})