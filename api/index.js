const { run } = require('micro')
const cors = require('micro-cors')()
const { URL } = require('url')
const $ = require('cheerio')
const got = require('got')

const client = got.extend({
  prefixUrl: 'https://www.haaretz.co.il/amp/',
  headers: {
    // Chrome - iPhone
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/85.0.4183.121 Mobile/15E148 Safari/604.1'
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
    margin: 1rem -2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }

  figure img {
    width: 100vw;
    max-width: 100%;
  }

  figcaption span {
    display: block;
  }
`

const handler = async req => {
  const { pathname } = new URL(req.query.url || req.query.text)
  const path = pathname.split('/').pop()
  const { body } = await client.get(path)
  const title = $('title', body).text()
  const article = $('article.magazine', body)

  article.find('.amp-article-content').remove()

  const content = article.find('header h1, header p, header + figure, section.b-entry p, section.b-entry h2, section.b-entry blockquote, section.b-entry figure')

  content.find('amp-img').replaceWith((_, el) => {
    const { src, srcset = '', title } = $(el).attr()
    return $('<img>').attr({ src, srcset, title, loading: 'lazy' })
  })

  return `
  <!DOCTYPE html>
  <html dir="rtl">
  <head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Rubik&display=swap" rel="stylesheet">
    <link href="/manifest.json" rel="manifest">
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
