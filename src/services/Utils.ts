import {formatDistance} from "date-fns";
import sanitizeHtml from "sanitize-html";

export function useUtils() {

  const formatDate = (timestamp: number | undefined) =>
    timestamp ? formatDistance(timestamp, new Date(), {addSuffix: true}) : ""

  const createDataTestIdentifier = (prefix: string, url: string) =>
    prefix + "_" + url.replace("https://", "").replaceAll('.','').replaceAll("/", "")

  const inBexMode = () => process.env.MODE === 'bex'
  const modeIs = (ident: string) => process.env.MODE === ident

  const normalize = (url: string):string => {
    try {
      new URL(url)
      return url
    } catch (err) {
      return "https://" + url
    }
  }

  const sanitize = (input: string): string => {
    return sanitizeHtml(input, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      allowedAttributes: sanitizeHtml.defaults.allowedAttributes = {
        a: ['href', 'name', 'target'],
        img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading']
      }
    })
  }

  const sendMsg = (msgName: string, data: object) => {
    chrome.runtime.sendMessage({
      name: msgName, data: data
    }, (callback:any) => {
      console.log("got callback", callback)
      if (chrome.runtime.lastError) { /* ignore */
      }
    });
  }


  return {
    formatDate,
    createDataTestIdentifier,
    inBexMode,
    normalize,
    modeIs,
    sanitize,
    sendMsg
  }
}
