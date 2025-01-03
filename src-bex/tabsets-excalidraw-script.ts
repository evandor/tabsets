import { createBridge } from '#q-app/bex/content'
import { LocalStorage } from 'quasar'

// The use of the bridge is optional.
const bridge = createBridge({ debug: false })

// // @ts-expect-error TODO contentScriptAnalysisAlredyCalled unknown
// if (window.contentScriptAnalysisAlredyCalled) {
//   // https://stackoverflow.com/questions/23208134/avoid-dynamically-injecting-the-same-script-multiple-times-when-using-chrome-tab
//   return
// }
//
// console.debug("tabsets: initializing content script for excalidraw...")
//
// // @ts-expect-error TODO contentScriptAnalysisAlredyCalled unknown
// window.contentScriptAnalysisAlredyCalled = true
//
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request === 'getExcerpt') {
//     console.debug("tabsets: got request 'getExcerpt'")
//     const responseMessage = {
//       html: "",
//       metas: {},
//       storage: {
//         //tabsetsName: LocalStorage.getItem('tabsets_name'),
//         tabsetsTabId: LocalStorage.getItem('tabsets_tabId'),
//         tabsetsTimestamp: LocalStorage.getItem('tabsets_ts')
//       }
//     }
//     console.debug("responseMessage", responseMessage)
//     sendResponse(responseMessage);
//   }
//   return true
// })

bridge
  .connectToBackground()
  .then(() => {
    console.log('[BEX-CT] Connected to background', bridge.portName, window.location.href)
    if (window.location.href === 'https://excalidraw.com/') {
      const responseMessage = {
        html: document.documentElement.outerHTML,
        metas: {},
        port: bridge.portName,
        url: window.location.href,
        storage: {
          //tabsetsName: LocalStorage.getItem('tabsets_name'),
          tabsetsTabId: LocalStorage.getItem('tabsets_tabId'),
          tabsetsTimestamp: LocalStorage.getItem('tabsets_ts'),
        },
      }
      bridge.send({ event: 'tabsets.bex.tab.excerpt', to: 'app', payload: responseMessage }).catch((err: any) => {
        console.log('[BEX-CT] Failed to send message to app', err)
      })
    }
  })
  .catch((err) => {
    console.error('[BEX-CT] Failed to connect to background:', err)
  })
