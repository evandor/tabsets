import { bexContent } from 'quasar/wrappers'
import {HTMLSelection} from "src/models/Tab";

console.log( "?========?")



const
  iFrame = document.createElement('iframe'),
  defaultFrameHeight = '62px'

/**
 * Set the height of our iFrame housing our BEX
 * @param height
 */
const setIFrameHeight = height => {
  iFrame.height = height
}

/**
 * Reset the iFrame to its default height e.g The height of the top bar.
 */
const resetIFrameHeight = () => {
  setIFrameHeight(defaultFrameHeight)
}

function scrollToTarget(eleID, type, headerHeight = 40) {
  console.log(eleID, type, headerHeight);
}


/**
 * The code below will get everything going. Initialize the iFrame with defaults and add it to the page.
 * @type {string}
 */
iFrame.id = 'bex-app-iframe'
iFrame.width = '100%'
resetIFrameHeight()

// Assign some styling so it looks seamless
Object.assign(iFrame.style, {
  position: 'fixed',
  top: '0',
  right: '0',
  bottom: '0',
  left: '0',
  border: '0',
  zIndex: '9999999', // Make sure it's on top
  overflow: 'visible'
})

;(function () {
  const url = document.location.href
  console.log(" === url == ", url)
  const urlParams = new URLSearchParams(window.location.search);
  const tabId = urlParams.get('tabId');
  console.log("got url2", url, tabId)
  iFrame.src = chrome.runtime.getURL('/www/index.html#/annotations/' + tabId)
  document.body.prepend(iFrame)


  var l = document.createElement('link');
  l.setAttribute("href","https://cdn.jsdelivr.net/npm/@recogito/recogito-js@1.8.2/dist/recogito.min.css")
  l.setAttribute("rel","stylesheet")
  document.head.appendChild(l)

  var s = document.createElement('script');
  s.src = chrome.runtime.getURL('www/js/recogito/recogito.min.js');
  (document.head || document.documentElement).appendChild(s);

  var s2 = document.createElement('script');
  s2.dataset.variable = 'some string variable!';
  s2.dataset.not_a_string = JSON.stringify({some: 'object!'});
  s2.src = chrome.runtime.getURL('www/js/recogito/recogito.content.js');
  document.body.appendChild(s2);



})()

export default bexContent((bridge) => {

  console.log("tabsets: initializing content script for recogito2")
  // @ts-ignore
  if (window.contentScriptRecogito2AlredyCalled) {
    // https://stackoverflow.com/questions/23208134/avoid-dynamically-injecting-the-same-script-multiple-times-when-using-chrome-tab
    console.log("stopping execution of recogito2 script as it is already setup")
    return
  }

  // @ts-ignore
  window.contentScriptRecogito2AlredyCalled  = true

  chrome.runtime.onMessage.addListener(function (response, sendResponse) { console.log("***",response);
  });
  /**
   * When the drawer is toggled set the iFrame height to take the whole page.
   * Reset when the drawer is closed.
   */
  bridge.on('wb.drawer.toggle', ({ data, respond }) => {
    console.log(" $%&/(/&%$%&/( ")
    if (data.open) {
      setIFrameHeight('100%')
    } else {
      resetIFrameHeight()
    }
    respond()
  })

  bridge.on('tabsets.annotations', ({ data, respond }) => {
    console.log(" *** data *** ", data)
    // if (data.open) {
    //   setIFrameHeight('100%')
    // } else {
    //   resetIFrameHeight()
    // }
    respond()
  })

  // chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  //   console.log("tabsets: got message", request)
  //   if (request.msg === 'sendAnnotations') {
  //     console.log("tabsets: received message for sendAnnotations", request)
  //
  //     // request.selections.forEach((selection: HTMLSelection) => {
  //     //   console.log("restoring selection", selection)
  //     //   doRestoreFromString(selection)
  //     // })
  //
  //     sendResponse({content: ""});
  //     return true
  //   }
  //   return sendResponse({content: "unknown request in highlighting.ts: " + request.msg});
  // })

})


