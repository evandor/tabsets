// @ts-ignore
import {bexContent} from 'quasar/wrappers'

import * as rangy from 'rangy'


class Caret {
  public sC: any
  public sO: any
  public eC: any
  public eO: any
}

// https://stackoverflow.com/questions/965968/serialize-internal-javascript-objects-like-range
export default bexContent((bridge: any) => {

  console.log("tabsets: initializing tabset extension content script for highlighting")

  var _caretPosition = new Caret()

  function doRestoreRange() {
    console.log("tabsets: got editor", document.body)
    var editor = document.body
    var caretPosition = _caretPosition;
    var sel = window.getSelection();
    var range = document.createRange();
    var x, C, sC = editor
    var eC = editor;

    if (caretPosition.sC) {
      C = caretPosition.sC;
      x = C.length;
      while (x--) {
        var t = C[x];
        if (sC) {
          var a = sC.childNodes[t];
          if (a == undefined) {
            caretPosition.sO = 0;
            break;
          }
          // @ts-ignore
          sC = a;
        }
      }
    }

    if (caretPosition.eC) {
      C = caretPosition.eC;
      x = C.length;

      while (x--) {
        if (!eC) break;
        var a = eC.childNodes[C[x]];
        if (a == undefined) {
          caretPosition.eO = 0;
          break;
        }
        // @ts-ignore
        eC = a;

      }
    }

    if (sC) {
      range.setStart(sC, caretPosition.sO);
    }


    if (eC) {
      var endPos = caretPosition.eO;
      if (eC.nodeValue && endPos > eC.nodeValue.length) {
        // @ts-ignore
        endPos = eC.length;
      }

      try {
        range.setEnd(eC, endPos);
      } catch (e) {
        console.log('caret restore not allowed');
      }

    }
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  function doClearRange() {
    var sel = window.getSelection();
    if (sel) {
      var range = sel.getRangeAt(0);
      sel.removeRange(range);
    }
  }

  function doRestoreFromString(selection: string) {
    _caretPosition.sC = selection.split(';')[0].split(',');
    _caretPosition.sO = selection.split(';')[1].split(',');
    _caretPosition.eC = selection.split(';')[2].split(',');
    _caretPosition.eO = selection.split(';')[3].split(',');

    console.log('tabsets: sC=' + _caretPosition.sC);
    console.log('tabsets: sO=' + _caretPosition.sO);
    console.log('tabsets: eC=' + _caretPosition.eC);
    console.log('tabsets: eO=' + _caretPosition.eO);

    doRestoreRange();
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("tabsets: got message", request)
    if (request.msg === 'highlightSelections') {
      console.log("tabsets: received message for highlightSelections")

      request.selections.forEach((selection: any) => {
        console.log("restoring selection", selection)
        doRestoreFromString(selection)
      })

      sendResponse({content: ""});
    }
    return sendResponse({content: "unknown request in highlighting.ts: " + request.msg});
  })
})
