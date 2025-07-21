export function useAnnotationUtils() {
  type CaretPosition = { sC: any[]; sO: number; eC: any[]; eO: number }

  var _caretPosition: CaretPosition

  const doSaveRange = () => {
    var editor = document //.getElementById('mw-content-text')
    var sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      var range = window.getSelection()!.getRangeAt(0)
      var sC = range.startContainer,
        eC = range.endContainer

      var A = []
      while (sC !== editor && sC) {
        A.push(getNodeIndex(sC))
        sC = sC.parentNode!
      }

      var B = []
      while (eC && eC !== editor) {
        B.push(getNodeIndex(eC))
        eC = eC.parentNode!
      }
      if (B.length == 0) {
        B = A
        eC = sC
      }

      _caretPosition = { sC: A, sO: range.startOffset, eC: B, eO: range.endOffset }
    }

    const el = document.getElementById('2string')
    if (el) {
      // el.value = getCP2String()
    }
    console.log('_caret', _caretPosition)
    return _caretPosition
  }

  const doRestoreRange = (caretPosition: { sC: any[]; sO: number; eC: any[]; eO: number }) => {
    console.log('doREstoreRange', caretPosition)
    var editor = document //.getElementById('editor')
    //var caretPosition = _caretPosition
    var sel = window.getSelection()
    var range = document.createRange()
    var x,
      C,
      sC = editor,
      eC = editor

    if (caretPosition.sC) {
      C = caretPosition.sC
      x = C.length
      while (x--) {
        var t = C[x]
        if (sC) {
          var a = sC.childNodes[t]
          if (a == undefined) {
            caretPosition.sO = 0
            break
          }
          // @ts-expect-error xxx
          sC = a
        }
      }
    }

    if (caretPosition.eC) {
      C = caretPosition.eC
      x = C.length

      while (x--) {
        if (!eC) break
        var a = eC.childNodes[C[x]]
        if (a == undefined) {
          caretPosition.eO = 0
          break
        }
        // @ts-expect-error xxx
        eC = a
      }
    }

    if (sC) {
      range.setStart(sC, caretPosition.sO)
    }

    if (eC) {
      var endPos = caretPosition.eO
      if (eC.nodeValue && endPos > eC.nodeValue.length) {
        // @ts-expect-error xxx
        endPos = eC.length
      }

      try {
        range.setEnd(eC, endPos)
      } catch (e) {
        console.log('caret restore not allowed')
      }
    }
    //sel!.removeAllRanges()
    console.log('adding range', sel, range)
    sel!.addRange(range)
  }

  const doClearRange = () => {
    var sel = window.getSelection()
    var range = sel!.getRangeAt(0)
    sel!.removeRange(range)
  }

  const doRestoreFromString = (serialTx: string) => {
    // var serialTx = el.value
    console.log('got', serialTx.split(';'))

    var _caretPosition: CaretPosition = {
      sC: serialTx.split(';')[0]!.split(','),
      // @ts-expect-error xxxx
      sO: serialTx.split(';')[1]!.split(','),
      eC: serialTx.split(';')[2]!.split(','),
      // @ts-expect-error xxxx
      eO: serialTx.split(';')[3]!.split(','),
    }

    // _caretPosition.sC = serialTx.split(';')[0]!.split(',')
    // _caretPosition.sO = serialTx.split(';')[1]!.split(',')
    // _caretPosition.eC = serialTx.split(';')[2]!.split(',')
    // _caretPosition.eO = serialTx.split(';')[3]!.split(',')

    console.log('sC=', _caretPosition.sC)
    console.log('sO=', _caretPosition.sO)
    console.log('eC=', _caretPosition.eC)
    console.log('eO=', _caretPosition.eO)
    doRestoreRange(_caretPosition)
  }

  const getNodeIndex = (n: any) => {
    var i = 0
    if (n) {
      while ((n = n.previousSibling)) i++
    }
    return i
  }

  const getCP2String = (_cp: { sC: any[]; sO: number; eC: any[]; eO: number }) => {
    console.log('sC=', _cp.sC)
    console.log('sO=', _cp.sO)
    console.log('eC=', _cp.eC)
    console.log('eO=', _cp.eO)
    return _cp.sC.toString() + ';' + _cp.sO + ';' + _cp.eC.toString() + ';' + _cp.eO
  }
  return {
    doSaveRange,
    doRestoreRange,
    doClearRange,
    getNodeIndex,
    doRestoreFromString,
    getCP2String,
  }
}
