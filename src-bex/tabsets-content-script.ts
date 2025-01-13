import { createBridge } from '#q-app/bex/content'
import { LocalStorage } from 'quasar' // The use of the bridge is optional.

// The use of the bridge is optional.
const bridge = createBridge({ debug: false })
/**
 * bridge.portName is 'content@<path>-<number>'
 *   where <path> is the relative path of this content script
 *   filename (without extension) from /src-bex
 *   (eg. 'my-content-script', 'subdir/my-script')
 *   and <number> is a unique instance number (1-10000).
 */

declare module '@quasar/app-vite' {
  interface BexEventMap {
    // /* eslint-disable @typescript-eslint/no-explicit-any */
    'some.event': [{ someProp: string }, void]
    // /* eslint-enable @typescript-eslint/no-explicit-any */
  }
}

// Hook into the bridge to listen for events sent from the other BEX parts.
bridge.on('some.event', ({ payload }) => {
  if (payload.someProp) {
    // Access a DOM element from here.
    // Document in this instance is the underlying website the contentScript runs on
    const el = document.getElementById('some-id')
    if (el) {
      el.innerText = 'Quasar Rocks!'
    }
  }
})

function getMetas(document: Document) {
  //console.debug("tabsets: getting metas for document" )
  const result: { [k: string]: string } = {}
  //const res: string[] = []
  const metaNodes: NodeList = document.querySelectorAll('meta')
  metaNodes.forEach((node: Node) => {
    const element = <Element>node
    const nameAttr = element.attributes.getNamedItem('name')
    const propAttr = element.attributes.getNamedItem('property')
    const contAttr = element.attributes.getNamedItem('content')
    const key: string = nameAttr ? nameAttr.value.trim().toLowerCase() || 'undefName' : propAttr?.value || 'undefProp'
    //console.debug("tabsets: key", key, contAttr?.value || 'x')
    if (key) {
      result[key] = contAttr?.value || ''
    }
    // res.push((element.attributes.getNamedItem('name')?.textContent) || 'undef')
  })
  return result
}

function getExcerptResponseMessage() {
  return {
    html: document.documentElement.outerHTML,
    metas: getMetas(document),
    port: bridge.portName,
    url: window.location.href,
    storage: {
      //tabsetsName: LocalStorage.getItem('tabsets_name'),
      tabsetsTabId: LocalStorage.getItem('tabsets_tabId'),
      tabsetsTimestamp: LocalStorage.getItem('tabsets_ts'),
    },
  }
}

/**
 * Leave this AFTER you attach your initial listeners
 * so that the bridge can properly handle them.
 *
 * You can also disconnect from the background script
 * later on by calling bridge.disconnectFromBackground().
 *
 * To check connection status, access bridge.isConnected
 */
bridge
  .connectToBackground()
  .then(() => {
    console.log('[BEX-CT] Connected to background', bridge.portName)
    const responseMessage = getExcerptResponseMessage()
    bridge.send({ event: 'tabsets.bex.tab.excerpt', to: 'app', payload: responseMessage }).catch((err: any) => {
      console.log('[BEX-CT] Failed to send message to app', err)
    })
  })
  .catch((err) => {
    console.error('[BEX-CT] Failed to connect to background:', err)
  })

// alternative way to bridge tabsets.bex.tab.excerpt approach, called from bex
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request === 'getExcerpt') {
    console.debug("tabsets: got request 'getExcerpt'")
    const responseMessage = getExcerptResponseMessage()
    sendResponse(responseMessage)
  } else {
    sendResponse({ content: 'unknown request in tabsets-content-scripts: ' + request })
  }
  return true
})
