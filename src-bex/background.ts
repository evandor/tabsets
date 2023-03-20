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
  });

});

export default bexBackground((bridge, cons/* , allActiveConnections */) => {
  //console.log("bexBackgroundBridge", bridge)
});
