import {bexBackground} from 'quasar/wrappers';

let modelPromise: any = null

function loadAIModule() {
  const {pipeline, env} = require('@xenova/transformers');

  console.log("initializing transformers....")

// Set environment variables to only use local models.
  env.useBrowserCache = false;
  env.remoteModels = false;
//env.localModelPath = chrome.runtime.getURL('models/')
  env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL('www/wasm/')
  env.backends.onnx.wasm.numThreads = 1;

// const task = 'text-classification';
// const model = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';

  const task = 'zero-shot-classification';
  //const model = 'Xenova/bart-large-mnli';
  const model = 'Xenova/finbert';

// Load model, storing the promise that is returned from the pipeline function.
// Doing it this way will load the model in the background as soon as the worker is created.
// To actually use the model, you must call `await modelPromise` to get the actual classifier.
  modelPromise = pipeline(task, model, {
    progress_callback: (data: any) => {
      if (data.status !== 'progress') {
        console.log("got progress_callback", data)
      }
      // If you would like to add a progress bar for model loading,
      // you can send `data` back to the UI.
      const msg = {
        "name": 'progress-indicator',
        "percent": data.progress,
        status: data.status,
        "label": "AI Module " + data.name
      }
      //console.log("sending", msg)
      //chrome.runtime.sendMessage(msg)
      chrome.runtime.sendMessage(msg, (callback) => {
        if (chrome.runtime.lastError) { /* ignore */
          //console.log("hier!!!", chrome.runtime.lastError)
        } else {
          console.log("cb", callback)
        }
      })
    }
  });
}

// Listen for messages from the UI, process it, and send the result back.
console.debug("adding listener for init-ai-module in background.js")

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // Run model prediction asynchronously
  (async function () {
    if (message.name === 'init-ai-module') {
      console.log("got message init-ai-module")
      loadAIModule()
      sendResponse("ai module loaded")
    } else if (message.name === 'zero-shot-classification') {
      console.log("got zero-shot-classification message", message, modelPromise)
      let model = await modelPromise;
      let result = await model(message.data.text, message.data.candiates);
      console.log("result:", result)
      alert(JSON.stringify(result))
      sendResponse(result);
    }
  })();
  // return true to indicate we will send a response asynchronously
  // see https://stackoverflow.com/a/46628145
  return true;
});

// @ts-ignore
if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  // @ts-ignore
  chrome.sidePanel
    .setPanelBehavior({openPanelOnActionClick: true})
    .catch((error: any) => console.error(error));
}

chrome.runtime.onInstalled.addListener((details) => {
  console.debug("adding onInstalled listener in background.ts", details)
  // @ts-ignore
  if (chrome.action) {
    // @ts-ignore
    chrome.action.onClicked.addListener((tab) => {
      // Opens our extension in a new browser window.
      // Only if a popup isn't defined in the manifest.
      chrome.tabs.create(
        {
          url: chrome.runtime.getURL('www/index.html'),
        },
        (newTab) => {
          console.log("newTab", newTab)
        }
      );
    });
  } else {
    // @ts-ignore
    //browser.browserAction.onClicked.addListener(openMyPage);
  }
});

chrome.runtime.onStartup.addListener(() => {
  console.log("adding onStartup listener in background.ts")
  // @ts-ignore
  if (chrome.action) {
    // @ts-ignore
    chrome.action.onClicked.addListener((tab) => {
      // Opens our extension in a new browser window.
      // Only if a popup isn't defined in the manifest.

      chrome.tabs.create(
        {
          url: chrome.runtime.getURL('www/index.html'),
        },
        (newTab) => {
          console.log("newTab", newTab)
        }
      );
    });
  }
})

export default bexBackground((bridge, cons/* , allActiveConnections */) => {
  //console.log("bexBackgroundBridge!")
  bridge.on('some.event', ({data, respond}) => {
    console.log('Event receieved, responding...')
    respond(data.someKey + ' hey!')
  })

});
