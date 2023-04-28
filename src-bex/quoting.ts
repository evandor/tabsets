// @ts-ignore
import {bexContent} from 'quasar/wrappers'

import * as rangy from 'rangy'
//import * as rangySelection from 'rangy-selectionsaverestore'
//import 'rangy'
//import rangySerializer from 'rangy'


// https://stackoverflow.com/questions/965968/serialize-internal-javascript-objects-like-range
export default bexContent((bridge: any) => {

  console.log("tabsets: initializing content script for quoting")

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

  if (sel && sel.rangeCount > 0) {
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
    selection: getCP2String()
  }
  console.log("sending", msg)
  chrome.runtime.sendMessage(msg)
})
