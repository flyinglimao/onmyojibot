const express = require('express')
const request = require('request')

const app = express()
const port = process.env.PORT


app.all('/', (req, res) => {
  res.status(403)
})

app.post('/in', (req, res) => {
  
})

app.get('/in', (req, res) => {
  if ( req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === 'YalaBomm' ) {
    res.send( req.query['hub.challenge'] )
  }
})

app.listen(port, () => { console.log(`Listening to ${port}`) })