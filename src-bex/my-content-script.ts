// Hooks added here have a bridge allowing communication between the BEX Content Script and the Quasar Application.
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/content-hooks


// Hooks added here have a bridge allowing communication between the BEX Content Script and the Quasar Application.
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/content-hooks
import {bexContent} from 'quasar/wrappers'



export default bexContent((bridge) => {
  //console.log("bexContentBridge1", bridge)
  //console.log("bexContentBridge2", document.body)


  chrome.runtime.sendMessage({msg: "capture"}, function(response) {
    console.log("created thumbnail for tabsets")
  });




})
