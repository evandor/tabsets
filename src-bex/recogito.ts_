// @ts-ignore
import {bexContent} from 'quasar/wrappers'
// @ts-ignore
//import { Recogito } from '@recogito/recogito-js';

export default bexContent((bridge: any) => {

  console.log("tabsets: initializing content script for recogito")

  // @ts-ignore
  if (window.contentScriptRecogitoAlredyCalled) {
    // https://stackoverflow.com/questions/23208134/avoid-dynamically-injecting-the-same-script-multiple-times-when-using-chrome-tab
    console.log("stopping execution of script as it is already setup")
    return
  }
  // @ts-ignore
  window.contentScriptRecogitoAlredyCalled  = true

  var l: HTMLLinkElement = document.createElement('link');
  l.setAttribute("href","https://cdn.jsdelivr.net/npm/@recogito/recogito-js@1.8.2/dist/recogito.min.css")
  l.setAttribute("rel","stylesheet")
  document.head.appendChild(l)

  var s = document.createElement('script');
  s.src = chrome.runtime.getURL('www/js/recogito/recogito.min.js');
  (document.head || document.documentElement).appendChild(s);

  var s2 = document.createElement('script');
  s2.src = chrome.runtime.getURL('www/js/recogito/recogito.content.js');
  document.body.appendChild(s2);

  window.addEventListener(
    "message",
    (event) => {
      if (event.data && event.data.name && event.data.name.startsWith('recogito-')) {
        console.log("sending", event.data)
        chrome.runtime.sendMessage(event.data, (callback) => console.log("xxx callback", callback))
      }
    },
    false,
  );

})
