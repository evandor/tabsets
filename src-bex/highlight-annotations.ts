// @ts-ignore
import {bexContent} from 'quasar/wrappers'
// @ts-ignore
import rangy from "rangy/lib/rangy-core.js";
//import "rangy/lib/rangy-highlighter";
//import "rangy/lib/rangy-classapplier";
//import "rangy/lib/rangy-textrange";
import "rangy/lib/rangy-serializer";

export default bexContent((bridge: any) => {

    console.log("tabsets: initializing content script for highlight-annotations")
    const data = document.querySelector('script[data-id="tabsets-rangy-annotation-data"]');
    if (data) {
        const annos = JSON.parse(data.getAttribute("data-annotations"))
        console.log("annosjson", annos)
        window.getSelection().removeAllRanges();
        Object.values(annos).forEach(anno => {
            //console.log("anno", anno.range)
            const r:WrappedRange = rangy.deserializeRange(anno.range) as WrappedRange
            console.log("r", typeof r, r.nativeRange)
            document.getSelection().addRange(r.nativeRange)
        })
    }

})
