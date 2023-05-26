import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchArticle } from './_fetch'

class InvalidURLError extends Error {}

const fetchArticleByURL = (url: string) => {
  const { pathname, hostname } = new URL(url);
  const articleId = pathname.split("/").pop();
  if (!articleId) throw new InvalidURLError(url);

  switch (hostname) {
    case "www.haaretz.co.il":
      return fetchArticle({
        articleId,
        baseURL: "https://www.themarker.com",
        logo: `
          <svg viewBox="0 0 256 256" class="logo">
            <path d="M128 8.5a119.5 119.5 0 100 239 119.5 119.5 0 000-239zm69.3 182.1c-.3 0-.5.2-.5.5L90.2 112.6a21.1 21.1 0 00-7.9 15.4c-.9 6.8-.7 14.1.7 21.7 1.4 7.7 5.7 11.5 12.9 11.5h19.2c-1 12.4.7 23.4 5.1 32.7h-51c-.7-.6-.8-1.4-.5-2.3a171.7 171.7 0 006.5-36.9c.3-6-.2-11.6-1.4-17.1a75.1 75.1 0 01-1.9-17.5c0-5.6.3-9.7.9-12.4.7-2.7 1.3-7.3 1.9-13.8A53.4 53.4 0 0069.5 64c0-.3.2-.5.5-.5h8.4c6.2 5 15.5 12.1 28 21.3l33.7 25a9 9 0 003.5-3.7c1.1-1.9 2.3-4.7 3.5-8.4 1.2-4.7 1.2-8.6 0-11.7a23.8 23.8 0 01-1.9-9.3c-.3-3.1-.3-5.7.2-7.7s.7-3.8.7-5.4h43.5c-5.6 9-5.4 21.3.5 36.9h-30.9c-2.2 0-4.2.9-6.1 2.8a14.4 14.4 0 00-3.7 7c-.3 1.8-.1 3.8.7 5.8.8 2.1 1.7 3.4 2.6 4 8.1 5.7 15 10.6 20.6 15a268 268 0 0017.8 12.6c-.9 4.7-1.4 8.2-1.6 10.5a56.2 56.2 0 003.6 21.1 86.5 86.5 0 004.2 11.3z"/>
          </svg>
        `,
        css: `
          header {
            background: #00a7dc;
          }
        `,
      });
    case "www.themarker.com":
      return fetchArticle({
        articleId,
        baseURL: "https://www.themarker.com",
        logo: `
          <svg viewBox="0 0 25 25" class="logo">
            <path fill-rule="evenodd" d="M12 0c1.656 0 3.21.312 4.664.938a12.12 12.12 0 013.82 2.578 12.12 12.12 0 012.578 3.82C23.689 8.789 24 10.344 24 12c0 1.656-.312 3.21-.938 4.664a12.12 12.12 0 01-2.578 3.82 12.12 12.12 0 01-3.82 2.578C15.211 23.689 13.656 24 12 24c-1.656 0-3.21-.312-4.664-.938a12.12 12.12 0 01-3.82-2.578 12.12 12.12 0 01-2.579-3.82C.313 15.211 0 13.656 0 12c0-1.656.312-3.21.938-4.664a12.12 12.12 0 012.578-3.82A12.12 12.12 0 017.336.937C8.789.313 10.344 0 12 0zm6.234 17.297V6.703h-4.78l-.985 5.766h-.938l-.984-5.766H5.766v10.594h2.859V9.609l1.922 7.688h2.906l1.922-7.688v7.688h2.86z"/>
          </svg>
        `,
        css: `
          header {
            background: #00c800;
          }
        `,
      });
    default:
      throw new InvalidURLError(url);
  }
}

export default async function (req: VercelRequest, res: VercelResponse) {
  const url = req.query.url || req.query.text;
  if (typeof url !== "string") throw new InvalidURLError();
  const article = await fetchArticleByURL(url)
  res.send(article)
}
