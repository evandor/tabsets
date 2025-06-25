import { createBridge } from '#q-app/bex/background'
import Analytics from 'src/core/utils/google-analytics'
import { useAiService } from 'src/services/useAiService'

// https://stackoverflow.com/questions/49739438/when-and-how-does-a-pwa-update-itself
const updateTrigger = 10

// https://developer.chrome.com/docs/extensions/mv3/tut_analytics/
//console.log("ga: installing google analytics")

addEventListener('unhandledrejection', (event) => {
  console.log('[service-worker] ga: fire error event', event)
  // getting error: Service worker registration failed. Status code: 15
  Analytics.fireErrorEvent(event.reason)
})

chrome.omnibox.onInputEntered.addListener((text) => {
  const newURL = chrome.runtime.getURL('/www/index.html#/searchresult?t=' + encodeURIComponent(text))
  chrome.tabs.create({ url: newURL }).catch((err) => console.log('[BEX] background.js error', err))
})

if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch((error: any) => console.error(error))
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  ;(async function () {
    const aiGateway = useAiService().xenova
    if (message.name === 'init-ai-module') {
      console.log('got message init-ai-module!!')
      try {
        await aiGateway.loadModule()
        sendResponse('ai module loaded')
      } catch (err: any) {
        sendResponse('error: ' + err)
      }
    } else if (message.name === 'zero-shot-classification') {
      try {
        console.log('hier', modelPromise)
        const result = await aiGateway.zeroShotClassification(message.data.text, message.data.candidates as string[])
        sendResponse(result)
      } catch (err) {
        console.log('got error', err)
        sendResponse(err)
      }
    } else if (message.name === 'tab-added') {
      console.log('got message tab-added!!', message)
      const currentTabs = await chrome.tabs.query({ url: message.data.url })
      console.log('currentTabs', currentTabs)
      currentTabs
        .filter((tab: chrome.tabs.Tab) => tab.id)
        .forEach((tab: chrome.tabs.Tab) => {
          chrome.tabs.sendMessage(tab.id!, { name: 'tab-added', url: message.data.url }).catch((err) => {
            console.log("could not handle 'tab-added'", err)
          })
        })
    } else if (message.name === 'tab-deleted') {
      console.log('got message tab-deleted!!', message)
      // const currentTabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
      // console.log('currentTabs', currentTabs)
      // const currentTab = currentTabs[0]!
      // if (currentTab.id) {
      //   chrome.tabs.sendMessage(currentTab.id, 'tab-added', {}).catch((err) => {
      //     console.log("could not handle 'tab-added'", err)
      //   })
      // }
    } else {
      console.log(`got unknown message '${message.name}' in background.ts`)
    }
  })()
  // return true to indicate we will send a response asynchronously
  // see https://stackoverflow.com/a/46628145
  return true
})

let modelPromise: any = null

// if (useQuasar().platform.is.firefox) {
chrome.action.onClicked.addListener((t: chrome.tabs.Tab) => {
  try {
    // @ts-expect-error unknown
    if (browser && browser.sidebarAction) {
      // @ts-expect-error unknown
      browser.sidebarAction.toggle()
    }
  } catch (e: any) {
    console.log('e', e)
    // opera maybe?
    // @ts-expect-error unknown
    if (opr && opr.sidebarAction) {
      // @ts-expect-error unknown
      opr.sidebarAction.setPanel({ panel: 'www/index.html' })
    }
  }
})
// }

chrome.runtime.onInstalled.addListener((details) => {
  console.debug('adding onInstalled listener in background.ts', details)
  if (chrome.runtime.lastError) {
    console.warn('got runtime error', chrome.runtime.lastError)
  }
})

// chrome.runtime.onInstalled.addListener(openExtension);
// chrome.action.onClicked.addListener(openExtension);

chrome.runtime.onConnect.addListener(function (port) {
  if (port.name === 'tabsetsSidepanel') {
    //console.log("[service-worker] port3", port)
    // port.onDisconnect.addListener(async () => {
    //   //alert('Sidepanel closed.');
    // });
  }
})

declare module '@quasar/app-vite' {
  interface BexEventMap {
    log: [{ message: string; data?: any[] }, void]
    getTime: [never, number]

    'storage.get': [string | undefined, any]
    'storage.set': [{ key: string; value: any }, void]
    'storage.remove': [string, void]
  }
}

/**
 * Call useBridge() to enable communication with the app & content scripts
 * (and between the app & content scripts), otherwise skip calling
 * useBridge() and use no bridge.
 */
const bridge = createBridge({ debug: false })

bridge.on('update.indicator.icon', (payload: object) => {
  console.log(`[BEX] message!"`, payload, bridge.portList)
  chrome.tabs.query({ active: true, lastFocusedWindow: true }).then((tabs: chrome.tabs.Tab[]) => {
    if (tabs.length > 0 && tabs[0]) {
      const msg = payload['payload' as keyof object]
      if (msg && msg['managed']) {
        chrome.action.setBadgeText({ text: '✅' })
        chrome.action.setTitle({ title: JSON.stringify(payload['payload' as keyof object]) })
      } else {
        chrome.action.setBadgeText({ text: '' })
        chrome.action.setTitle({ title: 'none' })
      }
    }
  })
})

// bridge.on('log', ({ from, payload }) => {
//   console.log(`[BEX] @log from "${from}"`, payload)
// })
//
// bridge.on('getTime', () => {
//   return Date.now()
// })
//
// bridge.on('storage.get', ({ payload: key }) => {
//   return new Promise((resolve) => {
//     if (key === void 0) {
//       chrome.storage.local.get(null, (items) => {
//         // Group the values up into an array to take advantage of the bridge's chunk splitting.
//         resolve(Object.values(items))
//       })
//     } else {
//       chrome.storage.local.get([key], (items) => {
//         resolve(items[key])
//       })
//     }
//   })
// })

bridge.on('reload-current-tabset', async ({ payload }) => {
  // const ts = useTabsetsStore().getCurrentTabset
  // const currentTabsetId = await useTabsetsStore().getCurrentTabsetId()
  console.log('reload-current-tabset', payload)
  await bridge.send({
    event: 'reload-current-tabset',
    to: 'app',
    payload: payload,
  })
  // IndexedDbTabsetsPersistence.init()
  // if (currentTabsetId) {
  //   await useTabsetsStore().reloadTabset(currentTabsetId)
  // }
  // //commentFrame?.style.setProperty('display', 'none')
  // return 'done'
})
