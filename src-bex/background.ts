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

// https://github.com/huggingface/transformers.js/blob/main/examples/extension/src/background.js

// class PipelineSingleton {
//   // static task = 'text-classification' as const
//   // static model = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
//   static task = 'zero-shot-classification' as const
//   static model = 'Xenova/bart-large-mnli'
//
//   // console.log('initializing transformers....')
//   //
//   // env.useBrowserCache = true
//   // env.remoteModels = true //false;
//   // //env.localModelPath = chrome.runtime.getURL('models/')
//   // env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL('www/wasm/')
//   // env.backends.onnx.wasm.numThreads = 1
//   //
//   static instance: any = null //TextClassificationPipeline = null as unknown as TextClassificationPipeline
//
//   static async getInstance(progress_callback: ProgressCallback | undefined = undefined) {
//     henv.allowRemoteModels = true
//     // @ts-expect-error xxx
//     henv.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL('www/wasm/')
//     // @ts-expect-error xxx
//     henv.backends.onnx.wasm.numThreads = 1
//     console.log('getting intance')
//     this.instance ??= pipeline(this.task, this.model, {
//       progress_callback: (data: any) => {
//         const msg = {
//           name: 'progress-indicator',
//           percent: data.progress / 100,
//           status: data.status,
//           label: 'AI Module ' + data.name,
//         }
//
//         //console.log('msg', msg)
//         //    useUiStore().setProgress(data.progress / 100, `AI Model... ${data.progress}%`)
//         //chrome.runtime.sendMessage(msg)
//         chrome.runtime.sendMessage(msg, (callback) => {
//           if (chrome.runtime.lastError) {
//             /* ignore */
//             // TODO we get tons of errors here
//             //console.log('runtime error encountered', chrome.runtime.lastError)
//           } else {
//             //console.log("cb", callback)
//           }
//         })
//       },
//     })
//     console.log('got intance', this.instance)
//
//     return this.instance
//   }
// }

//
// Create generic classify function, which will be reused for the different types of events.
// const classify = async (text: string, candidates: string[]) => {
//   // Get the pipeline instance. This will load and build the model when run for the first time.
//   let model = await PipelineSingleton.getInstance((data: any) => {
//     // You can track the progress of the pipeline creation here.
//     // e.g., you can send `data` back to the UI to indicate a progress bar
//     console.log('progress', data)
//   })
//
//   // Actually run the model on the input text
//   let result = await model(text, candidates)
//   return result
// }

// // Listen for messages from the UI, process it, and send the result back.
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.action !== 'classify') return // Ignore messages that are not meant for classification.
//   console.log('sender', sender)
//   // Run model prediction asynchronously
//   ;(async function () {
//     console.log('Perform classification', message.text)
//     let result = await classify(message.text)
//
//     // Send response back to UI
//     sendResponse(result)
//   })()
//
//   // return true to indicate we will send a response asynchronously
//   // see https://stackoverflow.com/a/46628145 for more information
//   return true
// })

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
    }
  })()
  // return true to indicate we will send a response asynchronously
  // see https://stackoverflow.com/a/46628145
  return true
})

let modelPromise: any = null

// async function loadAIModule() {
//   // eslint-disable-next-line @typescript-eslint/no-require-imports
//   const { pipeline, env } = require('@xenova/transformers')
//
//   console.log('initializing transformers....')
//
//   env.useBrowserCache = true
//   env.remoteModels = true //false;
//   //env.localModelPath = chrome.runtime.getURL('models/')
//   env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL('www/wasm/')
//   env.backends.onnx.wasm.numThreads = 1
//
//   // const task = 'text-classification';
//   //const model = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
//   const task = 'zero-shot-classification'
//   const model = 'Xenova/bart-large-mnli'
//   //const model = 'Xenova/finbert';
//
//   try {
//     let start = 0
//
//     modelPromise = pipeline(task, model, {
//       progress_callback: (data: any) => {
//         if (data.status !== 'progress') {
//           console.log('got progress_callback', data)
//         }
//
//         // if (data.progress < start + 5) {
//         //   return
//         // }
//         start = data.progress
//
//         const msg = {
//           name: 'progress-indicator',
//           percent: data.progress / 100,
//           status: data.status,
//           label: 'AI Module ' + data.name,
//         }
//
//         //console.log('msg', msg)
//         //    useUiStore().setProgress(data.progress / 100, `AI Model... ${data.progress}%`)
//         //chrome.runtime.sendMessage(msg)
//         chrome.runtime.sendMessage(msg, (callback) => {
//           if (chrome.runtime.lastError) {
//             /* ignore */
//             // TODO we get tons of errors here
//             //console.log('runtime error encountered', chrome.runtime.lastError)
//           } else {
//             //console.log("cb", callback)
//           }
//         })
//       },
//     })
//   } catch (err) {
//     console.error('hier: error', JSON.stringify(err))
//   }
// }

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

bridge.on('storage.set', ({ payload: { key, value } }) => {
  chrome.storage.local.set({ [key]: value })
})

bridge.on('storage.remove', ({ payload: key }) => {
  chrome.storage.local.remove(key)
})

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
