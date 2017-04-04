const express = require('express')
const request = require('request')
const bodyParser = require('body-parser')
const path = require('path')

const app = express()
const port = process.env.PORT || 3000
const token = process.env.TOKEN || 'null'

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

let wanted = require('./wanted.js')
let hint = require('./hint.js')
let map = require('./map.js')

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
  if (data.object === 'page') {
    data.entry.forEach((entry) => {
      entry.messaging.forEach((event) => {
        if (event.message) {
          let reply = looker(event.message.text)
          reply.forEach((msg) => {
            sendMsg(event.sender.id, msg)
          })
        } else { console.log(' Error ') }
      })
    })
  }
  res.sendStatus(200)
})

app.get('/pp.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'pp.html'))
})

app.get('/in', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe') {
    if (req.query['hub.verify_token'] === 'YalaBomm') res.send(req.query['hub.challenge'])
    else res.status(403)
  }
})

app.all('/', (req, res) => {
  res.sendStatus(403)
})

function looker (input) {
  let spilt = input.match(/\S+/g)
  let reply = []
  switch (spilt[0]) {
    case '幫助':
      reply = reply.concat(help)
      break
    case '懸賞':
      reply = reply.concat(wanted[spilt[1]] || '查無資料，請確定目標名稱正確，查詢線索請使用 線索 (條件)')
      break
    case '副本':
      reply = reply.concat(mapLooker(spilt) || '查無資料，請確定目標名稱正確')
      break
    case '圖鑑':
      reply = reply.concat(illLooker(spilt[1]))
      break
    case '線索':
      reply = reply.concat(wantedLooker(spilt))
      break
    case '頻道':
      reply = reply.concat(chanel)
      break
    case '留言':
      comment(input)
      reply = reply.concat(autoReply)
      break
    default:
      reply = reply.concat(cmdNotFound)
  }
  return reply
}

function wantedLooker (dex) {
  let result = []
  dex.splice(0, 1)
  if (dex[0]) {
    let mat = hint[dex[0]]
    if (dex.length > 1) {
      dex.forEach((clue) => {
        let tmp = hint[clue]
        mat.forEach((sp) => {
          if (!(sp in tmp)) { mat.splice(mat.indexOf(sp), 1) }
        })
      })
    }
    result = result.concat('查詢結果為: ' + (mat.join(',') || '無資料'))
    if (mat.length === 1) { result = result.concat(wanted[mat[0]]) }
  } else { result = result.concat('沒有給予條件') }
  return result
}

let chint = '一二三四五六七八九十'

function mapLooker (dex) {
  let result = []
  dex.splice(0, 1)
  if (dex[0]) {
    let mapID
    map.alias.forEach((alias) => {
      if (dex[0] in alias) {
        mapID = alias[0]
      }
    })
    if (!mapID) {
      map.alias.forEach((alias) => {
        (function () {
          alias.forEach((name) => {
            if (dex[0].match(name)) {
              mapID = alias[0]
              if (!isNaN(dex[1])) {
                mapID += dex[1]
              } else {
                mapID += chint.indexOf(dex[1]) + 1
              }
              return 0
            }
          })
        })()
      })
    }
    result = result.concat(map.data[mapID] || '查無資料，若查詢御魂請以空白間隔層數（如：御魂 10），秘聞尚無資料')
  } else {
    result = result.concat('沒有給予條件')
  }
  return result
}

function illLooker (dex) {
  let result = []
  if (dex) {
    result = result.concat(ill[dex] || '查無資料，請輸入式神全名（大天狗 ✔；狗狗 ✗)')
  } else {
    result = result.concat('沒有給予條件')
  }
  return result
}

function sendMsg (sender, message, isImg = false) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: token },
    method: 'POST',
    json: {
      recipient: { id: sender },
      message: isImg ? {attachment: { type: 'image', payload: message }} : { text: message }
    }
  })
}

function comment (input) {
  sendMsg(process.env.DEVID, input)
}

app.listen(port, () => { console.log(`Listening to ${port}`) })
