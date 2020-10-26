const { run } = require('micro')
const cors = require('micro-cors')()
const { URL } = require('url')
const $ = require('cheerio')
const got = require('got')

const client = got.extend({
  prefixUrl: 'https://www.haaretz.co.il/amp/',
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
  }
})

const css = `
  body {
    max-width: 32rem;
    margin: 2rem auto;
    font-family: 'Rubik', sans-serif;
    font-size: 16px;
    line-height: 1.6;
    padding: 0 2rem;
  }

  figure {
    margin: 1rem 0;
    padding: 0 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }

  img {
    max-width: 100vw;
  }
`

const handler = async req => {
  const { pathname } = new URL(req.query.url || req.query.text)
  const path = pathname.split('/').pop()
  const { body } = await client.get(path)
  const title = $('title', body).text()
  const content = $('main article.article', body).find('h1, p.t-body-text, figure.pic')

  content.find('img.lazyload').replaceWith((_, el) => {
    const img = $(el)
    const { src, srcset } = img.data()
    return img.attr({ src, srcset, loading: 'lazy' })
  })

  return `
  <!DOCTYPE html>
  <html dir="rtl">
  <head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Rubik&display=swap" rel="stylesheet">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
      ${css}
    </style>
  </head>
  <body>
    ${content}
  </body>
  </html>
  `
}

module.exports = cors((req, res) => run(req, res, handler))
