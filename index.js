const express = require('express')
const request = require('request')
const bodyParser = require('body-parser')
const path = require('path')

const app = express()
const port = process.env.PORT || 3000
const token = process.env.TOKEN || 'null'

app.use( bodyParser.json() )
app.use( bodyParser.urlencoded( {extended: true} ) )

let wanted = require('./wanted.js')
let hint = require('./hint.js')

let chanel = 
`章魚單車頻道：4747
御魂拾層頻道：1010
碎片挑戰頻道：818 (桃花/鐮鼬)
覺醒材料頻道：886
懸賞交換頻道：1700`
let help = 
`懸賞 大天狗 - 顯示大天狗的分布情形
線索 蒲公英 - 顯示線索為蒲公英的目標，多個線索請以空白分隔
副本 第六章 - 顯示副本第六章的分布與金錢經驗掉落
圖鑑 螢草 - 顯示螢草的圖鑑資料
頻道 - 顯示特定用途的頻道代碼
留言 Bug - 對開發者留下訊息，例如報錯
幫助 - 顯示本訊息`
let autoReply = 
`已將您的留言紀錄，但開發者不一定會回覆，請見諒`
let cmdNotFound = 
`無法辨識指令，輸入 幫助 查看哪些指令可以用`

app.post('/in', (req, res) => {
  let data = req.body
  if ( data.object === 'page' ) {
    data.entry.forEach( (entry) => {
      entry.messaging.forEach( (event) => {
        if ( event.message ) {
		  let reply = looker( event.message.text )
          sendMsg( event.sender.id, reply )
        } else
		  console.log(' Error ')
	  })
	})
  }
  res.sendStatus(200)
})

app.get('/pp.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'pp.html'))
})

app.all('/', (req, res) => {
  res.sendStatus(403)
})

function looker ( input ) {
  let spilt = input.match(/\S+/g)
  switch ( spilt[0] ){
    case '幫助':
	  return help
	  break
	case '懸賞':
	  return wanted[spilt[1]] || '查無資料，請確定目標名稱正確，查詢線索請使用 線索 (條件)'
	  break
	case '副本':
	  return mapLooker(spilt[1]) || '查無資料，請確定目標名稱正確'
	  break
	case '圖鑑':
	  return illLooker(spilt[1])
	  break
	case '線索':
	  return wantedLooker(spilt)
	  break
	case '頻道':
	  return chanel
	  break
	case '留言':
	  comment(input)
	  return autoReply
	  break
	default:
	  return cmdNotFound
  }
}

function wantedLooker ( dex ) {
  let result
  dex.splice(0, 1)
  if ( dex[0] ) {
    let mat = hint[dex[1]]
    if ( dex.length > 1 ) {
	  dex.forEach( (clue) => {
	    let tmp = hint[clue]
		mat.forEach( (sp) => {
		  if ( ! sp in tmp )
            mat.splice( mat.indexOf(sp), 1)
		})
		result = '查詢結果為: ' + (mat.join(',') || '無資料')
		if (mat.length === 1)
		  result += '\n' + wanted[mat[0]]
	  } )
    }
  } else 
    result = '沒有給予條件'
  return result
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

function comment ( input ) {
}

app.get('/in', (req, res) => {
  if ( req.query['hub.mode'] === 'subscribe' ) {
    if ( req.query['hub.verify_token'] === 'YalaBomm' ) res.send( req.query['hub.challenge'] )
    else res.status(403)
  }
})

app.listen(port, () => { console.log(`Listening to ${port}`) })