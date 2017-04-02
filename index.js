const express = require('express')
const request = require('request')

const app = express()
const port = process.env.PORT


app.all('/', (req, res) => {
  res.status(403)
})

app.post('/in', (req, res) => {
  res.send('')
})

app.all('/yadamama', (req, res) => {
  res.send('YalaBomm')
})

app.listen(port, () => { console.log(`Listening to ${port}`) })