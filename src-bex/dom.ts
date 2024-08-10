// Hooks added here have a bridge allowing communication between the Web Page and the BEX Content Script.
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/dom-hooks
import {bexDom} from 'quasar/wrappers'
import {diffWords} from "diff"
import {useUtils} from "src/core/services/Utils";
import {useRoute} from "vue-router";

const {sendMsg} = useUtils()

const route = useRoute()

export default bexDom((bridge) => {

  document.addEventListener('focusin', function (e: FocusEvent) {
    if (!window.location.href.startsWith("chrome-extension://")) {
      return
    }
    if (window.location.href.indexOf('/www/index.html#/mainpanel/') < 0) {
      return
    }
    console.log('focusin!', window.location.href, e)
    const target = e.target!
    // console.log('focusin!', e.target)
    // console.log('focusin!', e.target?.innerHTML)

    // @ts-ignore
    if (target.dataset.changedHtml) {
      console.log("setting to changed HTML")
      // @ts-ignore
      target.innerHTML = target.dataset.changedHtml
    } else {
      // @ts-ignore
      e.target.dataset.originalHtml = e.target.innerHTML
    }
    // @ts-ignore
    console.log("set data to", e.target.dataset.originalHtml)
  })

  document.addEventListener('focusout', function (e: FocusEvent) {
    if (!window.location.href.startsWith("chrome-extension://")) {
      return
    }
    if (window.location.href.indexOf('/www/index.html#/mainpanel/') < 0) {
      return
    }

    const target = e.target!
    console.log('focusout!', e)
    console.log('focusout!', e.target)
    // console.log('focusout!', e.target.innerHTML)

    // @ts-ignore
    //const diff = diffChars(target.dataset.originalHtml || '', target.innerHTML);
    const diff = diffWords(target.dataset.originalHtml || '', target.innerHTML);
    // const diff = execute(e.target.dataset.originalHtml || '', e.target.innerHTML);
    console.log("diff", diff)

    let fragment = document.createDocumentFragment();
    let html = ''
    diff.forEach((part: any) => {
      if (part.added) {
        const span = document.createElement('span');
        span.style.backgroundColor = "lightgreen";
        var doc = new DOMParser().parseFromString(part.value, "text/html");
        span.innerHTML = part.value
        fragment.appendChild(span);
        html += span.outerHTML
      } else if (part.removed) {
        const span = document.createElement('span');
        span.style.backgroundColor = "lightred";
        span.style.textDecoration = "line-through"
        let doc = new DOMParser().parseFromString(part.value, "text/html");
        span.innerHTML = part.value
        fragment.appendChild(span);
        html += span.outerHTML

      } else {
        html += part.value
      }


      // const color = part.added ? 'green' :
      //   part.removed ? 'red' : 'grey';
      // const span = document.createElement('span');
      // span.style.backgroundColor = color;
      // //console.log("part.value", part.value)
      //
      // var doc = new DOMParser().parseFromString(part.value, "text/html");
      // // span.appendChild(doc.innerHTML);
      // span.innerHTML = part.value
      // console.log("span", span)
      // fragment.appendChild(span);
      //html += span.outerHTML

    });

    console.log("parsing", html)
    const domFromHtml = new DOMParser().parseFromString(html, "text/html");


    // @ts-ignore
    target.dataset.changedHtml = target.innerHTML
    // @ts-ignore
    target.innerHTML = domFromHtml.body.innerHTML

    sendMsg('snapshot-edited', {
      html: document.documentElement.innerHTML,
      path: document.location.hash
    })

    //target.appendChild(fragment.textContent)
    // document.body.appendChild(fragment)
    //  document.body.insertAdjacentHTML(
    //    "beforeend",
    //    div.innerHTML
    //  );

  })
  //alert("sendingsending")
  // bridge.send('quasar.detect', {})
  //   .then((answer: any) => {
  //     console.log("answer", answer)
  //   })
  //   .catch((error: any) => {
  //     console.log("error", error)
  //   })
})
