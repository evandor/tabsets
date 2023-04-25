// Hooks added here have a bridge allowing communication between the Web Page and the BEX Content Script.
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/dom-hooks
import {bexDom} from 'quasar/wrappers'

export default bexDom((bridge) => {
  //console.log("bexDom", bridge)
  const allImgs = document.querySelectorAll('img')
  allImgs.forEach(i => {
    const parent = i.parentElement || document.body
    var parentStyle =  window.getComputedStyle(parent);

    var imgStyle =  window.getComputedStyle(i);
    const height = Number.parseFloat(imgStyle.height.replace("px", ""))
    const width = Number.parseFloat(imgStyle.width.replace("px", ""))
    if (height > 100.0 && width > 100.0) {
      i.parentElement?.setAttribute("style", "position:relative")
      i.setAttribute("style", "border: 1px solid blue")

      var fav = document.createElement('a')
      fav.className = 'image-fav';
      const paddingTop = Number.parseFloat(parentStyle.paddingTop.replace("px", "")) + 10
      const paddingLeft = Number.parseFloat(parentStyle.paddingLeft.replace("px", "")) + 10
      fav.setAttribute("style", "position:absolute;display:block;" +
        "top:"+ paddingTop +"px;" +
        "left:"+ paddingLeft+"px;" +
        "width:25px;" +
        "height:25px;" +
        "background-image:url(https://www.filecart.com/images/icons/s/small-network-icons.gif);z-index:100000")
      fav.href = '#';
      fav.onclick=(ev) => {
        const msg = {
          msg: 'websiteImg',
          img: i.src
        }
        console.log("sending", msg)
        bridge.send('websiteImg', msg)
          .then((res:any) => {
            console.log("got res", res)
          })
        ev.stopPropagation();
        ev.stopImmediatePropagation()
      }

      i.parentElement?.appendChild(fav);
      i.onmouseover = function () {
        //fav.style.display = 'block'
      }
      i.onmouseout = function () {
        //fav.style.display = 'none'
      }
    }

  })
})
