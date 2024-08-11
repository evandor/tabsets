// Hooks added here have a bridge allowing communication between the BEX Content Script and the Quasar Application.
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/content-hooks
// @ts-ignore
import {bexContent} from 'quasar/wrappers'

export default bexContent((bridge: any) => {


  // @ts-ignore
  if (window.contentScriptThumbnailsAlredyCalled) {
    // https://stackoverflow.com/questions/23208134/avoid-dynamically-injecting-the-same-script-multiple-times-when-using-chrome-tab
    //console.log("stopping execution of content-script-thumbnails as it is already setup")
    return
  }
  // @ts-ignore
  window.contentScriptThumbnailsAlredyCalled  = true

  console.log("tabsets: initializing content script for thumbnails")

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("got request!!!", request)
    if (request === 'getContent') {
      console.log("tabsets: received message for content")
      //sendResponse({content: document.documentElement.outerHTML});
      sendResponse({
        html: document.documentElement.outerHTML,
       // metas: getMetas(document)
      });
    } else {
      sendResponse({content: "unknown request in content-scripts-thumbnails: " + request});
    }
    return true
  })

})
