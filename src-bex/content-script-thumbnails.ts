// Hooks added here have a bridge allowing communication between the BEX Content Script and the Quasar Application.
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/content-hooks
// @ts-ignore
import {bexContent} from 'quasar/wrappers'


export default bexContent((bridge: any) => {

  console.log("tabsets: initializing content script for thumbnails")

  chrome.runtime.sendMessage({msg: "captureThumbnail"}, function (response) {
    console.log("tabsets: created thumbnail for tabsets")
  });

})
