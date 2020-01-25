const { run } = require('micro')
const cors = require('micro-cors')()
const { parse } = require('url')
const cheerio = require('cheerio')
const got = require('got')

const client = got.extend({
  prefixUrl: 'https://www.haaretz.co.il/misc/article-print-page/',
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
  }
})

const style = [
  'direction': 'rtl',
  'max-width: 64rem',
  'margin: 0 auto',
  'font-family: sans-serif',
  'line-height: 1.6',
  'padding: 2rem'
].join(';')

const handler = async (req, res) => {
  const { pathname } = parse(req.query.url)
  const article = pathname.split('/').pop()
  const { body } = await client.get(article)
  const $ = cheerio.load(body)
  const teaser = $('.teaser')
  const p = $('p')

  return `
    <body style="${style}">
      ${teaser}
      ${p}
    </body>
  `
}

module.exports = cors((req, res) => run(req, res, handler))
