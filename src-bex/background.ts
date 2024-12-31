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
// Usage:
// bridge.send({
//   event: 'storage.get',
//   to: 'background',
//   payload: 'key' // or omit `payload` to get data for all keys
// }).then((result) => { ... }).catch((error) => { ... });

bridge.on('storage.set', async ({ payload: { key, value } }) => {
  await chrome.storage.local.set({ [key]: value })
})
// Usage:
// bridge.send({
//   event: 'storage.set',
//   to: 'background',
//   payload: { key: 'someKey', value: 'someValue' }
// }).then(() => { ... }).catch((error) => { ... });

bridge.on('storage.remove', async ({ payload: key }) => {
  await chrome.storage.local.remove(key)
})
// Usage:
// bridge.send({
//   event: 'storage.remove',
//   to: 'background',
//   payload: 'someKey'
// }).then(() => { ... }).catch((error) => { ... });

/*
// More examples:

// Listen to a message from the client
bridge.on('test', message => {
  console.log(message);
  console.log(message.payload);
});

// Send a message and split payload into chunks
// to avoid max size limit of BEX messages.
// Warning! This happens automatically when the payload is an array.
// If you actually want to send an Array, wrap it in an Object.
bridge.send({
  event: 'test',
  to: 'app',
  payload: [ 'chunk1', 'chunk2', 'chunk3', ... ]
}).then(responsePayload => { ... }).catch(err => { ... });

// Send a message and wait for a response
bridge.send({
  event: 'test',
  to: 'app',
  payload: { banner: 'Hello from background!' }
}).then(responsePayload => { ... }).catch(err => { ... });

// Listen to a message from the client and respond synchronously
bridge.on('test', message => {
  console.log(message);
  return { banner: 'Hello from background!' };
});

// Listen to a message from the client and respond asynchronously
bridge.on('test', async message => {
  console.log(message);
  const result = await someAsyncFunction();
  return result;
});
bridge.on('test', message => {
  console.log(message)
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ banner: 'Hello from background!' });
    }, 1000);
  });
});

// Broadcast a message to app & content scripts
bridge.portList.forEach(portName => {
  bridge.send({ event: 'test', to: portName, payload: 'Hello from background!' });
});

// Find any connected content script and send a message to it
const contentPort = bridge.portList.find(portName => portName.startsWith('content@'));
if (contentPort) {
  bridge.send({ event: 'test', to: contentPort, payload: 'Hello from background!' });
}

// Send a message to a certain content script
bridge
  .send({ event: 'test', to: 'content@my-content-script-2345', payload: 'Hello from background!' })
  .then(responsePayload => { ... })
  .catch(err => { ... });

// Listen for connection events
// (the "@quasar:ports" is an internal event name registered automatically by the bridge)
// --> ({ portList: string[], added?: string } | { portList: string[], removed?: string })
bridge.on('@quasar:ports', ({ portList, added, removed }) => {
  console.log('Ports:', portList)
  if (added) {
    console.log('New connection:', added);
  } else if (removed) {
    console.log('Connection removed:', removed);
  }
});

// Send a message to the client based on something happening.
chrome.tabs.onCreated.addListener(tab => {
  bridge.send(...).then(responsePayload => { ... }).catch(err => { ... });
});

// Send a message to the client based on something happening.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    bridge.send(...).then(responsePayload => { ... }).catch(err => { ... });
  }
});

// Dynamically set debug mode
bridge.setDebug(true); // boolean

// Log a message on the console (if debug is enabled)
bridge.log('Hello world!');
bridge.log('Hello', 'world!');
bridge.log('Hello world!', { some: 'data' });
bridge.log('Hello', 'world', '!', { some: 'object' });
// Log a warning on the console (regardless of the debug setting)
bridge.warn('Hello world!');
bridge.warn('Hello', 'world!');
bridge.warn('Hello world!', { some: 'data' });
bridge.warn('Hello', 'world', '!', { some: 'object' });
*/
