import {bexBackground} from 'quasar/wrappers';
//import Analytics from "src/utils/google-analytics";
import OnInstalledReason = chrome.runtime.OnInstalledReason;

// https://stackoverflow.com/questions/49739438/when-and-how-does-a-pwa-update-itself
const updateTrigger = 10

// https://developer.chrome.com/docs/extensions/mv3/tut_analytics/
//console.log("ga: installing google analytics")

addEventListener('unhandledrejection', async (event) => {
  console.log("ga: fire error event")
  // getting error: Service worker registration failed. Status code: 15
  //Analytics.fireErrorEvent(event.reason);
});

chrome.runtime.onInstalled.addListener((callback) => {
  console.log("ga: fire event install", callback.reason, callback.previousVersion)
  // getting error: "Service worker registration failed. Status code: 15"
  // Analytics.fireEvent('install-' + callback.reason);
  if (callback.reason !== OnInstalledReason.CHROME_UPDATE) {
    chrome.tabs.create({
      active: true,
      url: callback.previousVersion ?
        "https://tabsets.web.app/#/updatedFrom/" + callback.previousVersion :
        "https://tabsets.web.app/#/installed/"
    })
  }
});

chrome.omnibox.onInputEntered.addListener((text) => {
  const newURL = chrome.runtime.getURL("/www/index.html#/searchresult?t=" + encodeURIComponent(text))
  chrome.tabs.create({url: newURL})
    .catch((err) => console.log("background.js error", err))
});

let modelPromise: any = null

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

chrome.runtime.onConnect.addListener(function (port) {
  if (port.name === 'tabsetsSidepanel') {
    //console.log("port3", port)
    port.onDisconnect.addListener(async () => {
      //alert('Sidepanel closed.');
    });
  }
});

export default bexBackground((bridge, cons/* , allActiveConnections */) => {
  // bridge.on('some.event', ({data, respond}) => {
  //   console.log('Event receieved, responding...')
  //   respond(data.someKey + ' hey!')
  // })
  // chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  //   console.log("sending to bridge")
  //   bridge.send('highlight.content', { url: tab.url })
  // })

  bridge.on('quasar.detect', ({data, respond}) => {
    console.log("quasar.detect2", data)
    // Let's resolve the `send()` call's promise, this way we can await it on the other side then display a notification.
    respond()
  })

});
