import { createBridge } from '#q-app/bex/content'
import { LocalStorage } from 'quasar'

const bridge = createBridge({ debug: false })

bridge
  .connectToBackground()
  .then(() => {
    console.log('[BEX-CT] Connected to background', bridge.portName, window.location.href)
    if (window.location.href === 'https://excalidraw.com/' || window.location.href === 'https://draw.kvb.local') {
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
