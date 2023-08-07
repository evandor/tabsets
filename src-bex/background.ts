import {bexBackground} from 'quasar/wrappers';
import {pipeline, env as env2} from "@xenova/transformers";

chrome.omnibox.onInputEntered.addListener((text) => {
  const newURL = chrome.runtime.getURL("/www/index.html#/searchresult?t=" + encodeURIComponent(text))
  chrome.tabs.create({ url: newURL })
    .catch((err) => console.log("background.js error", err))
});

let modelPromise: any = null

// Listen for messages from the UI, process it, and send the result back.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  (async function () {
    if (message.name === 'zero-shot-classification') {
      console.log("got zero-shot-classification message", message.data.text, typeof (message.data.candidates as string[]))

      try {
        let model = await modelPromise;
        let result = await model(message.data.text, message.data.candidates as string[]);
        console.log("result:", result)
        //let reviewer2 = await pipeline('zero-shot-classification', 'Xenova/bart-large-mnli');
        //let result3 = await model('View the latest news and breaking news today for, entertainment, politics and health at CNN.com.', ['News','Nachrichten','wasanderes']);
        //console.log("result3", result3)
        sendResponse(result);
      } catch (err) {
        console.log("got error", err)
        sendResponse(err)
      }


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
