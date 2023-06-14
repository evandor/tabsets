import {bexBackground} from 'quasar/wrappers';

function openMyPage() {
  console.log("injecting");
  // @ts-ignore
  browser.tabs.create({
    "url": "/www/index.html#/sidepanel"
  });
}

// if (typeof ServiceWorkerGlobalScope !== 'undefined' && self instanceof ServiceWorkerGlobalScope) {
  // Load the library
  const { pipeline, env } = require('@xenova/transformers');

console.log("here!!!")

// from transformers import AutoTokenizer, AutoModelForSequenceClassification

// const tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased-finetuned-sst-2-english")
//
// const model2 = AutoModelForSequenceClassification.from_pretrained("distilbert-base-uncased-finetuned-sst-2-english")



  // Set environment variables to only use local models.
  env.useBrowserCache = false;
  env.remoteModels = false;
  //env.localModelPath = chrome.runtime.getURL('models/')
  env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL('www/wasm/')
  env.backends.onnx.wasm.numThreads = 1;

  // TODO: Replace this with your own task and model
  const task = 'text-classification';
  // const model = 'distilbert-base-uncased-finetuned-sst-2-english';
  const model = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';

  // Load model, storing the promise that is returned from the pipeline function.
  // Doing it this way will load the model in the background as soon as the worker is created.
  // To actually use the model, you must call `await modelPromise` to get the actual classifier.
  const modelPromise = pipeline(task, null, {
    progress_callback: (data: any) => {
      console.log("got progress_callback", data)
      // If you would like to add a progress bar for model loading,
      // you can send `data` back to the UI.
    }
  });


  // Listen for messages from the UI, process it, and send the result back.
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    // Run model prediction asynchronously
    (async function () {
      console.log("got messaghes", message)
      let model = await modelPromise;     // 1. Load model if not already loaded
      let result = await model(message.data.text);  // 2. Run model prediction
      console.log("result:", result)
      sendResponse(result);               // 3. Send response back to UI
    })();
    console.log("!!!")
    // return true to indicate we will send a response asynchronously
    // see https://stackoverflow.com/a/46628145 for more information
    return true;
  });
// }

// @ts-ignore
if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  // @ts-ignore
  chrome.sidePanel
    .setPanelBehavior({openPanelOnActionClick: true})
    .catch((error: any) => console.error(error));
}

chrome.runtime.onInstalled.addListener((details) => {
  console.log("adding listener in background.ts", details)
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
  console.log("onStartup: adding listener in background.ts")
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
