// Hooks added here have a bridge allowing communication between the BEX Content Script and the Quasar Application.
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/content-hooks
// @ts-ignore
import {bexContent} from 'quasar/wrappers'
import {LocalStorage} from "quasar";

export default bexContent((bridge: any) => {

  // @ts-ignore
  if (window.contentScriptAnalysisAlredyCalled) {
    // https://stackoverflow.com/questions/23208134/avoid-dynamically-injecting-the-same-script-multiple-times-when-using-chrome-tab
    return
  }

  console.log("tabsets: initializing content script for excalidraw...")

  // @ts-ignore
  window.contentScriptAnalysisAlredyCalled = true

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request === 'getExcerpt') {
      console.log("tabsets: got request 'getExcerpt'")
      const responseMessage = {
        html: "",
        metas: {},
        storage: {
          //tabsetsName: LocalStorage.getItem('tabsets_name'),
          tabsetsTabId: LocalStorage.getItem('tabsets_tabId'),
          tabsetsTimestamp: LocalStorage.getItem('tabsets_ts')
        }
      }
      console.log("responseMessage", responseMessage)
      sendResponse(responseMessage);
    }
    return true
  })

})
