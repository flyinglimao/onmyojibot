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
let chanel = `
章魚單車頻道：4747
御魂拾層頻道：1010
碎片挑戰頻道：818 (桃花/鐮鼬)
覺醒材料頻道：886
懸賞交換頻道：1700
`

app.all('/', (req, res) => {
  res.sendStatus(403)
})

app.post('/in', (req, res) => {
  let data = req.body
  if ( data.object === 'page' ) {
    data.entry.forEach( (entry) => {
      entry.messaging.forEach( (event) => {
        if ( event.message ) {
		  // console.log(`Got msg: ${event.message.text}`)
		  let reply = looker( event.message.text )
          sendMsg( event.sender.id, reply )
        } else
		  console.log(' Error ')
	  })
	})
  }
  res.sendStatus(200)
})

function looker ( input ) {
  let spilt = input.match(/\S+/)
  switch ( spilt[0] ){
    case '幫助':
	  return help
	  break
	case '懸賞':
	  return wanted[spilt[1]] || '查無資料，請確定目標名稱正確，查詢線索請使用 線索 (條件)'
	  break
	case '副本':
	  return mapLooker(spilt[1])
	  break
	case '圖鑑':
	  return illLooker(spilt[1])
	  break
	case '線索':
	  return wantedLooker(spilt[1])
	  break
	case '頻道':
	  return chanel
	  break
	case '留言':
	  comment(input)
	  break
  }
}

function wantedLooker ( dex ) {
}

function mapLooker ( dex ) {
}

function illLooker ( dex ) {
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
  })
}

app.get('/in', (req, res) => {
  if ( req.query['hub.mode'] === 'subscribe' ) {
    if ( req.query['hub.verify_token'] === 'YalaBomm' ) res.send( req.query['hub.challenge'] )
    else res.status(403)
  }
})

app.listen(port, () => { console.log(`Listening to ${port}`) })