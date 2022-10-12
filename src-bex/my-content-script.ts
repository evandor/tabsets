// Hooks added here have a bridge allowing communication between the BEX Content Script and the Quasar Application.
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/content-hooks


// Hooks added here have a bridge allowing communication between the BEX Content Script and the Quasar Application.
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/content-hooks
import {bexContent} from 'quasar/wrappers'



export default bexContent((bridge) => {
  //console.log("bexContentBridge1", bridge)
  // console.log("bexContentBridge2", typeof document.body, document.body.toString())

  chrome.runtime.sendMessage({msg: "capture"}, function(response) {
    console.log("created thumbnail for tabsets")
  });

  chrome.runtime.sendMessage({msg: "html2text", html:document.documentElement.outerHTML}, function(response) {
    console.log("created text excerpt for tabsets")
  });

  // chrome.runtime.sendMessage({msg: "textCapture"}, function(response) {
  //   console.log("captured text")
  // });


})
