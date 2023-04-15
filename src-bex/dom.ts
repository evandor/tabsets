// Hooks added here have a bridge allowing communication between the Web Page and the BEX Content Script.
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/dom-hooks
import {bexDom} from 'quasar/wrappers'

export default bexDom((bridge) => {
  //console.log("bexDom", bridge)
  const allImgs = document.querySelectorAll('img')
  allImgs.forEach(i => {
   // console.log("i", i)
    i.setAttribute("style", "border: 1px solid red")

    const parent = i.parentElement
    //console.log("parent", typeof parent, parent?.toString())
    if (parent && (parent instanceof HTMLDivElement) &&
      (parent as unknown as HTMLDivElement).outerHTML.indexOf('class="tabsets_overlay_container"') >= 0) {
      // console.log("skipping", (parent as unknown as HTMLDivElement).outerHTML)
    } else {
      // const org_html = i.outerHTML;
      // // console.log("org_html", org_html)
      // const new_html =
      //   "<div class='tabsets_overlay_container' style='position:relative'>" +
      //   org_html +
      //   " <div class=\"tabsets_overlay\" style='position:absolute;left:0;top:0'>\n" +
      //   "    <h3>Position absolute place this heading on top of the image</h3> \n" +
      //   "  </div>" +
      //   "</div>";
      // i.outerHTML = new_html;
      // console.log("got result: ", i)
    }

  })
  /*
  bridge.send('message.to.quasar', {
    worked: true
  })
  */
})
