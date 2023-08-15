// @ts-ignore
import {bexContent} from 'quasar/wrappers'

//import * as rangy from 'rangy'
//import * as rangySelection from 'rangy-selectionsaverestore'
//import 'rangy'
//import rangySerializer from 'rangy'


// https://stackoverflow.com/questions/965968/serialize-internal-javascript-objects-like-range
export default bexContent((bridge: any) => {

  console.log("tabsets: initializing content script for quoting")

  // @ts-ignore
  if (window.contentScriptQuotingAlredyCalled) {
    // https://stackoverflow.com/questions/23208134/avoid-dynamically-injecting-the-same-script-multiple-times-when-using-chrome-tab
    console.log("stopping execution of script as it is already setup")
    return
  }
  // @ts-ignore
  window.contentScriptQuotingAlredyCalled  = true


  var _caretPosition: any;

  const sel = window.getSelection()
  var editor = document.body

  function getNodeIndex(n: Node | null) {
    var i = 0;
    if (n) {
      while (n = n.previousSibling) {
        i++;
      }
    }
    return i;
  }

  function getCP2String() {
    return _caretPosition.sC+';'+_caretPosition.sO+';'+_caretPosition.eC+';'+_caretPosition.eO;
  }

  let text = ''
  if (sel && sel.rangeCount > 0) {

    text = sel.toString()
    var range = sel.getRangeAt(0);
    var sC: Node | null = range.startContainer
    var eC: Node | null = range.endContainer;


    var A = [];
    while (sC !== editor && sC) {
      A.push(getNodeIndex(sC));
      sC = sC.parentNode;
    }


    var B = [];
    while (eC && eC !== editor) {
      B.push(getNodeIndex(eC));
      eC = eC.parentNode;
    }
    if (B.length == 0) {
      B = A;
      eC = sC;
    }

    _caretPosition = {"sC": A, "sO": range.startOffset, "eC": B, "eO": range.endOffset}

  }

  console.log("tabsets: about to send message!!!", sel)

  const msg = {
    msg: 'websiteQuote',
    text: text,
    selection: getCP2String()
  }
  console.log("sending", msg)
  chrome.runtime.sendMessage(msg, (callback) => {
    if (chrome.runtime.lastError) {
      console.warn("got runtime error", chrome.runtime.lastError)
    }
  })
})
