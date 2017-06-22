const express = require('express')
const request = require('request')
const bodyParser = require('body-parser')
const path = require('path')
const xhub = require('express-x-hub')

const app = express()
const port = process.env.PORT || 3000
const token = process.env.TOKEN || 'null'
const appToken = process.env.APPTOKEN || 'null'

app.use(xhub({algorithm: 'sha1', secret: appToken}))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

let wanted = require('./wanted.js')
let simpleWanted = require('./simplewanted.js')
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
留言 - 對開發者留下訊息
幫助 - 顯示本訊息`
let autoReply =
`已將您的留言紀錄，但開發者不一定會回覆，請見諒`
let cmdNotFound =
`無法辨識指令，輸入 幫助 查看哪些指令可以用`

app.post('/in', (req, res) => {
  let data = req.body
  res.sendStatus(200)
  if (req.isXHub && req.isXHubValid() && data.object === 'page') {
    data.entry.forEach((entry) => {
      entry.messaging.forEach((event) => {
        if (event.message) {
          let reply = looker(event.message.text.replace(/[\(\)\\\/\!\$\^\*\?]/g, '') || 'Except', event.sender.id)
          for (let msglen = 0; msglen < reply.length; msglen++) {
            setTimeout( ()=>{
              msg = reply[msglen]
              if (typeof (msg) === 'string') {
                sendMsg(event.sender.id, msg)
              } else if (typeof (msg) === 'object') {
                sendMsg(event.sender.id, msg.payload, msg.type)
              } else {
                console.log('Bad Msg, type should be string or object')
              }
            }, msglen*400)
          }
        } else if (event.postback) {
          let reply = looker(event.postback.payload || 'Except')
          for (let msglen = 0; msglen < reply.length; msglen++) {
            setTimeout( ()=>{
              msg = reply[msglen]
              if (typeof (msg) === 'string') {
                sendMsg(event.sender.id, msg)
              } else if (typeof (msg) === 'object') {
                sendMsg(event.sender.id, msg.payload, msg.type)
              } else {
                console.log('Bad Msg, type should be string or object')
              }
            }, msglen*400)
          }
        } else { console.log('Error') }
      })
    })
  }
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

function looker (input, sender) {
  let spilt = input.match(/\S+/g)
  let reply = []
  switch (spilt[0]) {
    case '幫助':
      reply = reply.concat(help)
      break
    case '懸賞':
      reply = reply.concat(wantedSelector(spilt))
      if (!reply.length) { reply = reply.concat('查無資料，請確認式神名稱是否正確，也可能是尚無資料') }
      break
    case '副本':
      reply = reply.concat(mapLooker(spilt))
      if (!reply.length) { reply = reply.concat('查無資料，請確認副本名稱是否正確(如第一章、番外一)，也可能是尚無資料') }
      break
    case '圖鑑':
      reply = reply.concat('圖鑑查詢中，請稍等')
      illLooker(spilt, sender)
      break
    case '線索':
    case '提示':
      reply = reply.concat(wantedLooker(spilt))
      if (!reply.length) { reply = reply.concat('查無資料，請確認線索是否正確，也可能是尚無資料') }
      break
    case '頻道':
      reply = reply.concat(chanel)
      break
    case '留言':
      comment(input, sender)
      reply = reply.concat(autoReply)
      break
    case '回覆':
      if (sender !== process.env.DEVID) {
        reply = reply.concat('Permission Denied')
      } else {
        replycomment(spilt)
        reply = reply.concat('已送出')
      }
      break
    default:
      reply = reply.concat(blurLooker(spilt))
  }
  return reply
}

function wantedSelector (dex) {
  let result = []
  let tmp = []
  if (dex[1]) {
    if (['全', '全部', 'all', 'ALL', 'All', '所有'].indexOf(dex[2]) !== -1) {
      tmp = tmp.concat(wanted[dex[1]] || [])
    } else {
      if (simpleWanted[dex[1]]) {
        tmp = tmp.concat(simpleWanted[dex[1]], `目前顯示精簡版，完整版請輸入「懸賞 ${dex[1]} 全」`)
      } else {
        let heroes = Object.getOwnPropertyNames(simpleWanted)
        for (let i = 0; i < heroes.length; i++) {
          if (heroes[i].match(dex[1])) {
            tmp = tmp.concat(simpleWanted[heroes[i]], `目前使用模糊查詢，查詢結果為${heroes[i]}，如不正確請輸入完整名稱`)
            break
          }
        }
      }
    }
  }
  if (tmp.length) { result = result.concat(tmp) }
  return result
}

function wantedLooker (dex) {
  let result = []
  if (dex[1]) {
    let mat = hint[dex[1]] || []
    if (dex[2]) {
      let mat2 = hint[dex[2]]
      if (mat && mat2)mat = compare(mat, mat2)
    }
    if (mat.length >= 1 || dex[0] === '線索') { result = result.concat('查詢結果為: ' + (mat.join(',') || '無資料')) }
    if (mat.length === 1) { result = result.concat(wantedSelector(['懸賞', mat[0]])) }
  }
  return result
}

let chint = '一二三四五六七八九十'

function mapLooker (dex) {
  let result = []
  if (dex[1]) {
    let mapID
    map.alias.forEach((alias) => {
      if (alias.indexOf(dex[1]) + 1) {
        mapID = alias[0]
      }
    })
    if (dex[2]) {
      if (!isNaN(dex[2])) {
        mapID += dex[2]
      } else {
        mapID += chint.indexOf(dex[2]) + 1
      }
    }
    if (mapID || dex[0] === '副本') { result = result.concat(map.data[mapID] || '查無資料，若查詢御魂請以空白間隔層數（如：御魂 10），秘聞尚無資料') }
  }
  return result
}

function illLooker (dex, sender) {
  request.get({
    uri: 'https://script.google.com/macros/s/AKfycbyPRvf6ktvFOc4jpb8-xCaULuonPxKvgWVoYRS46LWXihQaOrY/exec',
    qs: {
      table: 'ill',
      name: dex[1]
    },
    json: true
  }, (err, res, body) => {
    if (err) {
      comment('illustration error')
      sendMsg(sender, '圖鑑查訊出錯，已自動回報開發者')
    } else {
      if (body.success) {
        let element = [{
          title: body.name,
          image_url: body.image
        }]
        for (let index = 0; index < 3; index++) {
          if (body.skills[index]) {
            element[index + 1] = {
              title: body.skills[index],
              subtitle: body.skilldes[index]
            }
          }
        }
        request({
          uri: 'https://graph.facebook.com/me/messages',
          qs: { access_token: token },
          method: 'POST',
          json: {
            recipient: { id: sender },
            message: {
              attachment: {
                type: 'template',
                payload: {
                  template_type: 'list',
                  elements: element,
                  buttons: [
                    {
                      title: '完整圖鑑',
                      type: 'web_url',
                      url: body.full
                    }
                  ]
                }
              }
            }
          }
        }, (err, res, body) => {
          if (err) {
            console.log(err)
          }
        })
      } else {
        sendMsg(sender, '查無資料，請確認名稱是否正確，或者尚未收錄該式神')
      }
    }
  })
}

function sendMsg (sender, payload, type = 'text') {
  let out
  if (type === 'text') {
    out = {text: payload}
  } else {
    out = {
      attachment: {
        type: type,
        payload: {
          url: payload
        }
      }
    }
  }
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: token },
    method: 'POST',
    json: {
      recipient: { id: sender },
      message: out
    }
  }, (err, res, body) => {
    if (err) {
      console.log(err)
    }
  })
}

function replycomment (dex) {
  sendMsg(dex[1], dex[2], dex[3] || 'text')
}

function comment (input, sender) {
  sendMsg(process.env.DEVID, input)
  if (sender) sendMsg(process.env.DEVID, `來自${sender}`)
}

function blurLooker (dex) {
  let result = []
  dex = ['null'].concat(dex)
  let tmp = []
  tmp = wantedSelector(dex)
  if (tmp.length) {
    result = result.concat(tmp, `若要查詢圖鑑請使用「圖鑑 式神名稱」`)
  } else {
    tmp = wantedLooker(dex)
    if (tmp.length) {
      result = result.concat(tmp)
    } else {
      tmp = mapLooker(dex)
      if (tmp.length) {
        result = result.concat(tmp)
      } else {
        result = result.concat(cmdNotFound)
        comment(`未知指令${dex.join(' ')}`, null)
      }
    }
  }
  return result
}

function compare (a, b) {
  let c = []
  a.forEach((child) => {
    if (b.indexOf(child) !== -1) {
      c = c.concat(child)
    }
  })
  return c
}

app.listen(port, () => { console.log(`Listening to ${port}`) })
