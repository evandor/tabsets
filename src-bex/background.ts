import {bexBackground} from 'quasar/wrappers';

function openMyPage() {
  console.log("injecting");
  // @ts-ignore
  browser.tabs.create({
    "url": "/www/index.html#/sidepanel"
  });
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
