const express = require('express')
const request = require('request')
const bodyParser = require('body-parser')

const app = express()
const port = process.env.PORT || 3000
const token = process.env.TOKEN || 'null'

app.use( bodyParser.json() )
app.use( bodyParser.urlencoded( {extended: true} ) )

let wanted = require('./wanted.json')
let map = require('./map.json')
let illustration = require('./illustration.json')

app.all('/', (req, res) => {
  res.status(403).send('403 Permission Denied')
})

app.post('/in', (req, res) => {
  let data = req.body
  if ( data.object === 'page' ) {
    data.entry.forEach( (entry) => {
      entry.messaging.forEach( (event) => {
        if ( event.message )
          sendMsg( event.message.sender.id, event.message.text )
        else
		  console.log(' Error ')
	  })
	})
  }
})

function looker ( input ) {
  
}

function sendMsg ( sender, message ) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: token },
    method: 'POST',
    json: {
      recipient: { id: sender },
      message: { text: message }
    }
  )
}

app.get('/in', (req, res) => {
  if ( req.query['hub.mode'] === 'subscribe' ) {
    if ( req.query['hub.verify_token'] === 'YalaBomm' ) res.send( req.query['hub.challenge'] )
    else res.status(403)
  }
})

app.listen(port, () => { console.log(`Listening to ${port}`) })