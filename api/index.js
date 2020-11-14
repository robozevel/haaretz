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
    margin: 0 auto;
    font-family: 'Rubik', sans-serif;
    font-size: 16px;
    line-height: 1.6;
  }

  [role=button] {
    cursor: pointer;
    user-select: none;
  }

  main {
    padding: 0 2rem;
  }

  header {
    background: #00a7dc;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: .5rem .375rem .5rem .5rem;
  }

  header svg.logo {
    fill: #fff;
    display: block;
    height: 2rem;
    width: 2rem;
  }

  header svg.share {
    height: 1.5rem;
    width: 1.5rem;
    fill: #fff;
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

  figcaption {
    padding: 0 .5rem;
    text-align: center;
  }

  figcaption span {
    display: block;
  }
`

const script = `
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js')
  
  const shareButton = document.querySelector('.share')
  if (typeof navigator.share === 'function') {
    shareButton.addEventListener('click', async () => {
      try {
        await navigator.share({
          title: document.title,
          url: location.href
        })
      } catch (err) {
        alert(err.message)
      }
    })
  } else {
    shareButton.style.visibility = 'hidden'
  }
`

const handler = async req => {
  const { pathname, hostname } = new URL(req.query.url || req.query.text)
  if (hostname !== 'www.haaretz.co.il') throw new Error(`Invalid URL: ${req.query.url}`)

  const articleId = pathname.split('/').pop()
  const { body } = await client.get(articleId)
  const title = $('title', body).text()
  const article = $('article', body).first()
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
    <header>
      <a href="/">
        <svg viewBox="0 0 256 256" class="logo">
          <path d="M128 8.5a119.5 119.5 0 100 239 119.5 119.5 0 000-239zm69.3 182.1c-.3 0-.5.2-.5.5L90.2 112.6a21.1 21.1 0 00-7.9 15.4c-.9 6.8-.7 14.1.7 21.7 1.4 7.7 5.7 11.5 12.9 11.5h19.2c-1 12.4.7 23.4 5.1 32.7h-51c-.7-.6-.8-1.4-.5-2.3a171.7 171.7 0 006.5-36.9c.3-6-.2-11.6-1.4-17.1a75.1 75.1 0 01-1.9-17.5c0-5.6.3-9.7.9-12.4.7-2.7 1.3-7.3 1.9-13.8A53.4 53.4 0 0069.5 64c0-.3.2-.5.5-.5h8.4c6.2 5 15.5 12.1 28 21.3l33.7 25a9 9 0 003.5-3.7c1.1-1.9 2.3-4.7 3.5-8.4 1.2-4.7 1.2-8.6 0-11.7a23.8 23.8 0 01-1.9-9.3c-.3-3.1-.3-5.7.2-7.7s.7-3.8.7-5.4h43.5c-5.6 9-5.4 21.3.5 36.9h-30.9c-2.2 0-4.2.9-6.1 2.8a14.4 14.4 0 00-3.7 7c-.3 1.8-.1 3.8.7 5.8.8 2.1 1.7 3.4 2.6 4 8.1 5.7 15 10.6 20.6 15a268 268 0 0017.8 12.6c-.9 4.7-1.4 8.2-1.6 10.5a56.2 56.2 0 003.6 21.1 86.5 86.5 0 004.2 11.3z"/>
        </svg>
      </a>
      <svg viewBox="0 0 24 24" class="share" role="button">
        <path fill-rule="evenodd" d="M11.293 2.293a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L13 5.414V15a1 1 0 11-2 0V5.414L9.707 6.707a1 1 0 01-1.414-1.414l3-3zM4 11a2 2 0 012-2h2a1 1 0 010 2H6v9h12v-9h-2a1 1 0 110-2h2a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2v-9z" clip-rule="evenodd"/>
      </svg>
    </header>
    <main>
      ${content}
    </main>
    <script>
      ${script}
    </script>
  </body>
  </html>
  `
}

module.exports = cors((req, res) => run(req, res, handler))
