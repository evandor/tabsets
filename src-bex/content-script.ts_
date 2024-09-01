// Hooks added here have a bridge allowing communication between the BEX Content Script and the Quasar Application.
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/content-hooks
import {bexContent} from 'quasar/wrappers'

export default bexContent((bridge: any) => {

  // @ts-ignore
  if (window.contentScriptAlredyCalled) {
    // https://stackoverflow.com/questions/23208134/avoid-dynamically-injecting-the-same-script-multiple-times-when-using-chrome-tab
    console.debug("tabsets: stopping execution of content-script as it is already setup")
    return
  }

  console.log("tabsets: initializing content script")
  // @ts-ignore
  window.contentScriptAlredyCalled = true

  console.log("tabsets: adding listener...", chrome.runtime)
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("tabsets: hier", request)
    if (request === 'getContent') {
      console.log("tabsets: received message for content", document.documentElement.outerHTML)
      sendResponse({content: document.documentElement.outerHTML});
    } else if (request.action === "highlight-annotation") {
      sendResponse()
    // } else if (request === 'cs-iframe-close') {
    //   csIframe.width = "40px"
    //   csIframe.height = "30px"
    //   csIframe.style.right = "0px"
    //   csIframe.style.top = "80px"
    // } else if (request === 'cs-iframe-open') {
    //   csIframe.width = "220px"
    //   csIframe.height = "440px"
    //   csIframe.style.right = "5px"
    //   csIframe.style.top = "75px"
    }
    else if (request.type === "SET_EMAIL_FOR_SIGN_IN") {
      chrome.storage.local.set({ CURRENT_USER_EMAIL: request.email });
      chrome.storage.local.set({ tabext: sender.tab });
      console.log("SET_EMAIL_FOR_SIGN_IN", request.email);
    }
    sendResponse({content: "unknown request in content-scripts: " + request});
    return true
  })


})
