import {bexBackground} from 'quasar/wrappers';
import Analytics from "src/utils/google-analytics";
import {useQuasar} from "quasar";

// https://stackoverflow.com/questions/49739438/when-and-how-does-a-pwa-update-itself
const updateTrigger = 8

chrome.runtime.onInstalled.addListener((details) => {
    console.debug("adding onInstalled listener in background.ts", details)
    // @ts-ignore
    console.debug("hier", chrome.runtime.getURL('www/index.html'))
    if (chrome.action) {
        console.debug("hier1")
        console.log("hier2")
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
        browser.browserAction.onClicked.addListener(openMyPage);
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
