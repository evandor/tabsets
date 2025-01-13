import { createBridge } from '#q-app/bex/background'

// https://stackoverflow.com/questions/49739438/when-and-how-does-a-pwa-update-itself
const updateTrigger = 10

// https://developer.chrome.com/docs/extensions/mv3/tut_analytics/
//console.log("ga: installing google analytics")

addEventListener('unhandledrejection', async (event) => {
  console.log('[service-worker] ga: fire error event', event)
  // getting error: Service worker registration failed. Status code: 15
  //Analytics.fireErrorEvent(event.reason);
})

// chrome.runtime.onInstalled.addListener((callback) => {
//   console.log("[BEX] ga: fire event install", callback.reason, callback.previousVersion)
//   // getting error: "Service worker registration failed. Status code: 15"
//   // Analytics.fireEvent('install-' + callback.reason);
//   console.log("[BEX] callback:::", callback)
//   if (callback.reason !== OnInstalledReason.CHROME_UPDATE) {
//     chrome.tabs.create({
//       active: false,
//       url: callback.previousVersion ?
//         "https://docs.tabsets.net/release-notes" :
//         "https://tabsets.web.app/#/installed/"
//     }).then((newTab: chrome.tabs.Tab) => {
//       setTimeout(() => {
//         chrome.tabs.update(newTab.id || 0, {active: true})
//       }, 2000)
//     })
//   }
//   if (chrome.runtime.lastError) {
//     console.warn("got runtime error", chrome.runtime.lastError)
//   }
// });

chrome.omnibox.onInputEntered.addListener((text) => {
  const newURL = chrome.runtime.getURL('/www/index.html#/searchresult?t=' + encodeURIComponent(text))
  chrome.tabs.create({ url: newURL }).catch((err) => console.log('[BEX] background.js error', err))
})

if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error: any) => console.error(error))
}

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
  // @ts-ignore
  if (chrome.action) {
    // @ts-ignore
    // chrome.action.onClicked.addListener((tab) => {
    //   chrome.tabs.create(
    //     {
    //       url: chrome.runtime.getURL('www/index.html'),
    //     },
    //     (newTab) => {
    //       console.log("[service-worker] newTab", newTab)
    //     }
    //   );
    // });
  } else {
    // @ts-ignore
    //browser.browserAction.onClicked.addListener(openMyPage);
  }
})

// chrome.runtime.onInstalled.addListener(openExtension);
// chrome.action.onClicked.addListener(openExtension);

chrome.runtime.onStartup.addListener(() => {
  console.log('[service-worker] adding onStartup listener in background.ts')
  // @ts-ignore
  if (chrome.action) {
    // @ts-ignore
    // chrome.action.onClicked.addListener((tab) => {
    //   // Opens our extension in a new browser window.
    //   // Only if a popup isn't defined in the manifest.
    //
    //   chrome.tabs.create(
    //     {
    //       url: chrome.runtime.getURL('www/index.html'),
    //     },
    //     (newTab) => {
    //       console.log("[service-worker] newTab", newTab)
    //     }
    //   );
    // });
  }
})

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

bridge.on('log', ({ from, payload }) => {
  console.log(`[BEX] @log from "${from}"`, payload)
})

bridge.on('getTime', () => {
  return Date.now()
})

bridge.on('storage.get', ({ payload: key }) => {
  return new Promise((resolve) => {
    if (key === void 0) {
      chrome.storage.local.get(null, (items) => {
        // Group the values up into an array to take advantage of the bridge's chunk splitting.
        resolve(Object.values(items))
      })
    } else {
      chrome.storage.local.get([key], (items) => {
        resolve(items[key])
      })
    }
  })
})

bridge.on('storage.set', async ({ payload: { key, value } }) => {
  await chrome.storage.local.set({ [key]: value })
})

bridge.on('storage.remove', async ({ payload: key }) => {
  await chrome.storage.local.remove(key)
})
