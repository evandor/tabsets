// @ts-ignore
import {bexContent} from 'quasar/wrappers'

export default bexContent((bridge: any) => {

  console.log("tabsets: initializing content script for thumbnails")

  // @ts-ignore
  if (window.contentScriptThumbnailsAlredyCalled) {
    // https://stackoverflow.com/questions/23208134/avoid-dynamically-injecting-the-same-script-multiple-times-when-using-chrome-tab
    //console.log("stopping execution of content-script-thumbnails as it is already setup")
    return
  }
  // @ts-ignore
  window.contentScriptThumbnailsAlredyCalled  = true

  chrome.runtime.sendMessage({msg: "captureThumbnail"}, function (response) {
    console.log("tabsets: created thumbnail for tabsets")
    if (chrome.runtime.lastError) {
      console.warn("got runtime error", chrome.runtime.lastError)
    }
  });

})
