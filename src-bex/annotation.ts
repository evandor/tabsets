// @ts-ignore
import {bexContent} from 'quasar/wrappers'
// @ts-ignore
import rangy from "rangy/lib/rangy-core.js";
//import "rangy/lib/rangy-highlighter";
//import "rangy/lib/rangy-classapplier";
//import "rangy/lib/rangy-textrange";
import "rangy/lib/rangy-serializer";


export default bexContent((bridge: any) => {
    console.log("tabsets: initializing content script for website annotation", bridge)
    let selection = document.getSelection()
    console.log("selection", selection, selection?.toString())
    // @ts-ignore
    if (selection?.rangeCount > 0) {
        const range = selection?.getRangeAt(0)
        console.log("got range", range)
        console.log("got range", rangy.serializeRange(range))
        const msg = {
            msg: 'capture-annotation',
            text: selection?.toString(),
            range: rangy.serializeRange(range)
        }
        console.log("tabsets: sending message", msg)
        chrome.runtime.sendMessage(msg, (callback) => {
            if (chrome.runtime.lastError) {
                console.warn("got runtime error", chrome.runtime.lastError)
            }
        })
    }


})
