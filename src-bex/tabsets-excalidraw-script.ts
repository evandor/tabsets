// Hooks added here have a bridge allowing communication between the BEX Content Script and the Quasar Application.
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/content-hooks
// @ts-expect-error TODO bexContent unknown
import {bexContent} from 'quasar/wrappers'
import {LocalStorage} from "quasar";

export default bexContent((bridge: any) => {

  // @ts-expect-error TODO contentScriptAnalysisAlredyCalled unknown
  if (window.contentScriptAnalysisAlredyCalled) {
    // https://stackoverflow.com/questions/23208134/avoid-dynamically-injecting-the-same-script-multiple-times-when-using-chrome-tab
    return
  }

  console.debug("tabsets: initializing content script for excalidraw...")

  // @ts-expect-error TODO contentScriptAnalysisAlredyCalled unknown
  window.contentScriptAnalysisAlredyCalled = true

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request === 'getExcerpt') {
      console.debug("tabsets: got request 'getExcerpt'")
      const responseMessage = {
        html: "",
        metas: {},
        storage: {
          //tabsetsName: LocalStorage.getItem('tabsets_name'),
          tabsetsTabId: LocalStorage.getItem('tabsets_tabId'),
          tabsetsTimestamp: LocalStorage.getItem('tabsets_ts')
        }
      }
      console.debug("responseMessage", responseMessage)
      sendResponse(responseMessage);
    }
    return true
  })

})
