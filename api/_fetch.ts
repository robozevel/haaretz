import $ from 'cheerio'
import got from 'got'

const client = got.extend({
  headers: {
    // Chrome - iPhone
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/85.0.4183.121 Mobile/15E148 Safari/604.1'
  }
})

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

interface Params {
  articleId: string
  prefixUrl: string
  css: string
  logo: string
}

export const fetchArticle = async ({ articleId, prefixUrl, logo, css }: Params) => {
  const { body } = await client.get(`amp/${articleId}`, { prefixUrl })

  const title = $('title', body).text()
  const article = $('article', body).first()
  article.find('.amp-article-content').remove()

  const content = article.find('header h1, header p, header + figure, section.b-entry p, section.b-entry h2, section.b-entry blockquote, section.b-entry figure')

  content.find('amp-img').replaceWith(function () {
    const { src, srcset = '', title } = $(this).attr()
    return $('<img>').attr({ src, srcset, title, loading: 'lazy' })
  })

  return `
  <!DOCTYPE html>
  <html dir="rtl">
  <head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Rubik&display=swap" rel="stylesheet">
    <link href="/global.css" rel="stylesheet">
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
        ${logo}
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
