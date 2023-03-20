import {bexBackground} from 'quasar/wrappers';


chrome.runtime.onInstalled.addListener((details) => {
  console.log("adding listener in background.ts", details)
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

    // @ts-ignore
    chrome.action.setPopup(
      {popup: "www/index.html#/popup"},
      () => {
        console.log("popup set", chrome.runtime.lastError)
      })
  });

});

chrome.runtime.onStartup.addListener(() => {
  console.log("onStartup: adding listener in background.ts")
  // @ts-ignore
  chrome.action.setPopup(
    {popup: ''},
    () => {
      console.log("popup unset", chrome.runtime.lastError)
    })

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

    // @ts-ignore
    chrome.action.setPopup(
      {popup: "www/index.html#/popup"},
      () => {
        console.log("popup set", chrome.runtime.lastError)
      })
  });

})

export default bexBackground((bridge, cons/* , allActiveConnections */) => {
  //console.log("bexBackgroundBridge", bridge)
});
