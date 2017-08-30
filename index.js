const credentials = require('./credentials.json')
const PushBullet = require('pushbullet')
const request = require('request-promise')
const express = require('express')
const cheerio = require('cheerio')
const resolver = require('resolver')
const fs = require('fs')

const app = express()
app.use(express.static('public'))
app.set('view engine', 'pug')
let last_post = 1

async function latest_post() {
  const index_page = await request('https://clwo.eu/portal.php')
  const $ = cheerio.load(index_page)
  const latest_thread = $('.latestthreads_portal .itrow strong a').attr('href')
  const latest_post_url = latest_thread.replace('.html', '-lastpost.html')
  resolver.resolve(latest_post_url, async (err, url) => {
    let latest_post_id = /https:\/\/clwo\.eu\/thread-([0-9]+)-post-([0-9]+)\.html/.exec(url)[2]
    if (latest_post_id > last_post) {
      last_post = latest_post_id
      push_post(await get_post_info(latest_post_id))
    }
  })
}

async function get_post_info(post_id) {
    const post_page = await request(`https://clwo.eu/post-${post_id}.html`)
    const $ = cheerio.load(cheerio.load(post_page)(`#post_${post_id}`).html())

    let data = {
      author: {
        id: $('.author_avatar a').attr('href').split('-')[1].split('.')[0],
        profile: $('.author_avatar a img').attr('src'),
        name: $('.author_information .largetext a').text(),
        title: $('.author_information .smalltext').text().replace(/\r?\n/g, ''),
      },
      post: {
        id: post_id,
        title: $('.post_content strong a').attr('title'),
        date: $('.post_date').text(),
        body: $('.post_body').html()
      }
    }

    let statistics = $('.author_statistics').text().split('\n')
    data.author.posts = statistics[2].split(': ')[1]
    data.author.threads = statistics[3].split(': ')[1]
    data.author.joined = statistics[4].split(': ')[1]
    data.author.reputation = statistics[7]
    data.author.steamid = statistics[10].split(': ')[1]
    data.author.thanks = statistics[13].split(': ')[1]
    data.author.given_thanks = [statistics[14].split('Given ')[1].split(' thank')[0], statistics[14].split('in ')[1].split(' post')[0]]
    return data
}

function push_post(post) {
  console.log('New post!', post.post.id)
  for (let credential in credentials) {
    if (credentials[credential]) {
      const pusher = new PushBullet(credential.split(':')[0])
      pusher.link(credential.split(':')[1], post.post.title, `https://clwo.eu/post-${post.post.id}.html#pid${post.post.id}`, function(error, response) {
        if (error) console.log(error)
      })
    }
  }
}

function get_enabled(api_key) {
  let enabled = []
  for (let credential in credentials) {
    if (credentials[credential]) {
      if (credential.split(':')[0] == api_key) {
        enabled.push(credential.split(':')[1])
      }
    }
  }
  return enabled
}

function save() {
  fs.writeFileSync('./credentials.json', JSON.stringify(credentials, null, 4), 'utf8')
}

// ;(async () => { push_post(await get_post_info(25431)) })()
setInterval(latest_post, 30000)

app.get('/', (req, res) => { res.render('index') })

app.get('/enable/:key/:identity', (req, res) => {
  console.log('Enabling', req.params.identity)
  credentials[req.params.key + ':' + req.params.identity] = true
  save()
  res.redirect('/devices?key=' + req.params.key)
})

app.get('/disable/:key/:identity', (req, res) => {
  console.log('Disabling', req.params.identity)
  credentials[req.params.key + ':' + req.params.identity] = false
  save()
  res.redirect('/devices?key=' + req.params.key)
})

app.get('/devices', (req, res) => {
  const pusher = new PushBullet(req.query.key)
  pusher.devices(function(error, response) {
    res.render('devices', { devices: response, enabled: get_enabled(req.query.key), api_key: req.query.key })
  })
})

app.listen(3070, function () {
  console.log('Example app listening on port 3070!')
})
