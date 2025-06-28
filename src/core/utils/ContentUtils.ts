import * as cheerio from 'cheerio'
// @ts-expect-error TODO
import { convert } from 'html-to-text'

function dump(name: string, val: string | undefined) {
  if (val === 'async') {
    console.log(`dumping '${name}=${val}': async`)
    return 'async '
  }
  if (val === 'defer') {
    return 'defer '
  }
  return val && val.trim().length > 0 ? name + '="' + val + '" ' : ''
}

class ContentUtils {
  private isRelative(href: string | undefined) {
    if (!href) {
      return true
    }
    return !(href.startsWith('http://') || href.startsWith('https://') || href.startsWith('chrome-extension://'))
  }

  private getAbsoluteUrl(url: URL, path: string): string {
    //console.log(`checking1: '${url.toString()}','${path}'`)
    let absoluteUrl = url.toString()
    if (path.startsWith('//')) {
      absoluteUrl = `${url.protocol}${path}`
    } else if (this.isRelative(path)) {
      const pathWithoutDoubleSlashes = `/${path}`.replaceAll('//', '/')
      absoluteUrl = `${url.protocol}//${url.hostname}${pathWithoutDoubleSlashes}`
      //console.log("checking2: ", absoluteUrl)
    } else {
      absoluteUrl = path
      //console.log("checking3: ", absoluteUrl)
    }
    return absoluteUrl
  }

  private noLeadingSlash(href: string) {
    if (!href || href.trim().length === 0) {
      return ''
    }
    return href.trim().startsWith('/') ? href.trim().substring(1) : href
  }

  html2tokens(html: string): Set<any> {
    //console.log("got html", html)
    const text = convert(html, {
      wordwrap: 130,
    })
    //console.log("got text", text)
    const text2 = text.replace(/\[[^\]].*/g, '').replaceAll('*', '')
    //console.log("got text2", text2)
    const tokens = text2
      .replaceAll('\\n', ' ')
      .replaceAll('[0-9a-fA-F]{8}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{12}', ' ')
      .replaceAll('[\u00AD\u002D\u2011]', ' ')
      .replaceAll('\n', ' ')
      .replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>»«{}\[\]\\\/]/gi, ' ')
      .split(' ')
    // console.log("got token", tokens)
    let res = ''
    const tokenSet = new Set()
    tokens.forEach((t: string) => {
      if (t.length >= 4 && t.length <= 24) {
        res += t + ' '
        tokenSet.add(t.toLowerCase())
      }
    })
    // console.log("got token2", tokenSet)
    return tokenSet
  }

  html2text(html: string): string {
    //console.log("got html", html)
    const text = convert(html, {
      wordwrap: 130,
    })
    //console.log('got text', text)
    const text2 = text.replace(/\[[^\]].*/g, '').replaceAll('*', '')
    //console.log("got text2", text2)
    const tokens = text2
      .replaceAll('\\n', ' ')
      .replaceAll('[0-9a-fA-F]{8}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{12}', ' ')
      .replaceAll('[\u00AD\u002D\u2011]', ' ')
      .replaceAll('\n', ' ')
      .replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>»«{}\[\]\\\/]/gi, ' ')
    //.split(' ')
    // console.log("got token", tokens)
    // let res = ''
    // const tokenSet = new Set()
    // tokens.forEach((t: string) => {
    //   if (t.length >= 4 && t.length <= 24) {
    //     res += t + ' '
    //     tokenSet.add(t.toLowerCase())
    //   }
    // })
    // // console.log("got token2", tokenSet)
    // return tokenSet
    return tokens
  }

  async imageUrlToBase64(url: string) {
    const data = await fetch(url)
    const blob = await data.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(blob)
      reader.onloadend = () => {
        const base64data = reader.result
        resolve(base64data)
      }
      reader.onerror = reject
    })
  }

  async processHtml(tabUrl: string, html: string) {
    try {
      let normalized = tabUrl.endsWith('/') ? tabUrl.substring(0, tabUrl.length - 1) : tabUrl
      console.log('normalized URL', normalized)
      let url = new URL(normalized)
      // const htmlWithBaseRef = await this.setBaseHref(url, html)
      const $ = cheerio.load(html)
      await this.inlineScripts(url, $)
      //await this.removeScripts(url, $)
      await this.inlineImgs(url, $)
      await this.inlinePictures(url, $)
      await this.inlineCSS(url, $)

      return $.html()
    } catch (err: any) {
      console.error(err)
      return 'could not process due to ' + err.toString()
    }
  }

  async inlineImgs(url: URL, $: cheerio.CheerioAPI) {
    for (const elem of $('img')) {
      const src = $(elem).attr('src')
      if (src && !src.startsWith('chrome-extension://') && !src.startsWith('data:image')) {
        // && isRelative(src)) {
        const base64rep = (await this.imageUrlToBase64(this.getAbsoluteUrl(url, src))) as string
        $(elem).attr('src', base64rep)
      }
    }
  }

  async inlinePictures(url: URL, $: cheerio.CheerioAPI) {
    for (const elem of $('picture')) {
      // console.log("picture", elem)
      const pictureChildren = $(elem).children()
      for (const p of pictureChildren) {
        if (p.name === 'source') {
          const srcset = $(p).attr('srcset')
          if (srcset) {
            const src = srcset.startsWith('https://') || srcset.startsWith('http://') ? srcset : `${url}/${srcset}`
            // console.log("src:", src)
            if (src && !src.startsWith('chrome-extension://') && !src.startsWith('data:image')) {
              // && isRelative(src)) {
              $(elem).before(`\n<!-- ${src}-->\n\n<img src="${src}">`)
              $(elem).remove()
              break
            }
          }
        }
      }
    }
  }

  async inlineScripts(url: URL, $: cheerio.CheerioAPI) {
    for (const elem of $('script')) {
      const src = $(elem).attr('src')
      const charset = $(elem).attr('charset')
      const defer = $(elem).attr('defer')

      if (src && !src.startsWith('chrome-extension://')) {
        // && isRelative(src)) {
        try {
          // console.log("checking2", src, async, defer)
          const useSrc = src.startsWith('https://') || src.startsWith('http://') ? src : `${url}/${src}`
          const script = await fetch(this.getAbsoluteUrl(url, useSrc))
          if (script.status !== 404) {
            const s = await script.text()
            // $(elem).removeAttr("src")
            // $(elem).text(s)

            // console.log("defer:", defer)
            $(elem).before(
              `\n<!-- ${src}-->\n\n<script ${dump('charset', charset)}${dump('defer', defer)}>${s}</script>`,
            )
            $(elem).remove()
          }
        } catch (err: any) {
          console.log('err', err)
        }
      }
    }
  }

  async removeScripts(url: URL, $: cheerio.CheerioAPI) {
    for (const elem of $('script')) {
      const src = $(elem).attr('src')
      if (src) {
        // && isRelative(src)) {
        $(elem).remove()
      }
    }
  }

  async inlineCSS(url: URL, $: cheerio.CheerioAPI) {
    const regex = /url\(([^)]*)\)/gm
    for (const elem of $('link')) {
      const rel = $(elem).attr('rel')
      if (!rel || rel !== 'stylesheet') {
        continue
      }
      const href = $(elem).attr('href')
      const media = $(elem).attr('media')
      const title = $(elem).attr('title')
      if (href) {
        // && isRelative(src)) {
        //console.log("checking1: ", href, this.isRelative(href))
        const cssUrl = this.isRelative(href)
          ? href.startsWith('/')
            ? `${url.protocol}//${url.hostname}/${this.noLeadingSlash(href)}`
            : `${url}/${this.noLeadingSlash(href)}`
          : href
        try {
          console.log('css:', cssUrl)
          const script = await fetch(cssUrl)
          console.log('data', script.status)
          if (script.status !== 404) {
            let s = await script.text()
            //console.log("===>s", s)
            // s = s.replaceAll("/url\\(([^)]*)\\)/gm", function(a,b) {
            s = s.replaceAll(regex, function (a, b) {
              const normalizedGroup = b.trim().replace('"', '').replace("'", '')
              if (
                normalizedGroup.startsWith('http://') ||
                normalizedGroup.startsWith('https://') ||
                normalizedGroup.startsWith('data:')
              ) {
                return a
              }
              const res = 'url(' + `${url.protocol}//${url.hostname}/${b.trim()}` + ')'
              console.log('replacing ', b.trim())
              console.log('with      ', res)
              return res
            })
            $(elem).before(`\n<!-- ${href}-->\n\n<style ${dump('title', title)}${dump('media', media)}>${s}</style>`)
            $(elem).remove()
          }
        } catch (err: any) {
          console.log('err', err)
        }
      }
    }
  }

  async setBaseHref(url: URL, html: string) {
    // TODO puppeteer seems to have issues with this approach
    const headWithBase = '<head><base href="' + url.protocol + '//' + url.hostname + '/" />'
    //const headWithBase = "<head>"

    // const $ = cheerio.load(html);
    // $("link").each(function () {
    //   let href = $(this).attr("href");
    //   if (href && isRelative(href)) {
    //     // console.log("replaced", href, `${url.protocol}//${url.hostname}/${href}`)
    //     $(this).attr("href", `${url.protocol}//${url.hostname}/${href}`);
    //   }
    // });
    // $("script").each(function () {
    //   let src = $(this).attr("src");
    //   if (src && isRelative(src)) {
    //     $(this).attr("src", `${url.protocol}//${url.hostname}/${src}`);
    //   }
    // });
    // $("a").each(function () {
    //   let href = $(this).attr("href");
    //   if (href && isRelative(href)) {
    //     $(this).attr("href", `${url.protocol}//${url.hostname}/${href}`);
    //   }
    // });

    //
    // for (const elem of $('img')) {
    //   const src = $(elem).attr("src")
    //   if (src) { // && isRelative(src)) {
    //     const absoluteUrl = `${url.protocol}//${url.hostname}/${src}`
    //     const base64rep = await this.imageUrlToBase64(absoluteUrl) as string
    //     $(elem).attr("src", base64rep);
    //   }
    // }

    // console.log("------", $.html())
    return html.replace('<head>', headWithBase)
  }
}

export default new ContentUtils()
