import { createBridge } from '#q-app/bex/content'
import { LocalStorage } from 'quasar'
import { PageData } from 'src/tabsets/models/PageData'

// The use of the bridge is optional.
const bridge = createBridge({ debug: false })

declare module '@quasar/app-vite' {
  interface BexEventMap {
    'some.event': [{ someProp: string }, void]
  }
}

function getMetas(document: Document): { [k: string]: string } {
  //console.debug("tabsets: getting metas for document" )
  const result: { [k: string]: string } = {}
  //const res: string[] = []
  const metaNodes: NodeList = document.querySelectorAll('meta')
  metaNodes.forEach((node: Node) => {
    const element = <Element>node
    const nameAttr = element.attributes.getNamedItem('name')
    const propAttr = element.attributes.getNamedItem('property')
    const contAttr = element.attributes.getNamedItem('content')
    const key: string = nameAttr ? nameAttr.value.trim().toLowerCase() || 'undefName' : propAttr?.value || 'undefProp'
    //console.debug("tabsets: key", key, contAttr?.value || 'x')
    if (key) {
      result[key] = contAttr?.value || ''
    }
    // res.push((element.attributes.getNamedItem('name')?.textContent) || 'undef')
  })
  return result
}

function getResponseData(): PageData {
  return {
    html: document.documentElement.outerHTML,
    metas: getMetas(document),
    port: bridge.portName,
    url: window.location.href,
    storage: {
      //tabsetsName: LocalStorage.getItem('tabsets_name'),
      tabsetsTabId: LocalStorage.getItem('tabsets_tabId'),
      tabsetsTimestamp: LocalStorage.getItem('tabsets_ts'),
      tabsetsAnnotations: LocalStorage.getItem('tabsets.annotations'),
      tabsetsManaged: LocalStorage.getItem('tabsets.managed'),
    },
  }
}

function sendUpdateIndicatorIconMessage(show: boolean = true) {
  if (bridge.portList.indexOf('background') >= 0) {
    let managed = false
    if (show) {
      const managedTabs: string[] | null = LocalStorage.getItem('tabsets.managed')
      if (managedTabs && managedTabs.indexOf(window.location.href) >= 0) {
        managed = true
      }
    }
    console.log(`update.indicator.icon: managed ${managed}`)
    bridge.send({ event: 'update.indicator.icon', to: 'background', payload: { managed } }).catch((err: any) => {
      console.log("[BEX-CT] Failed to send 'update.indicator.icon' message to background", err)
    })
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    //console.log('Tab became visible/active')
    setTimeout(() => sendUpdateIndicatorIconMessage(), 100)
  } else if (document.visibilityState === 'hidden') {
    //console.log('Tab became invisible')
    sendUpdateIndicatorIconMessage(false)
  }
})

bridge
  .connectToBackground()
  .then(() => {
    console.log(
      `[BEX-CT] Connected to background (portName: ${bridge.portName}, portList: ${JSON.stringify(bridge.portList)})`,
    )

    sendUpdateIndicatorIconMessage()

    if (bridge.portList.indexOf('app') >= 0) {
      const responseMessage = getResponseData()
      bridge.send({ event: 'tabsets.bex.tab.excerpt', to: 'app', payload: responseMessage }).catch((err: any) => {
        console.log('[BEX-CT] Failed to send message to app', err)
      })
    }
  })
  .catch((err) => {
    console.error('[BEX-CT] Failed to connect to background:', err)
  })

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request === 'getExcerpt') {
    // alternative way to bridge tabsets.bex.tab.excerpt approach, called from bex
    console.debug("tabsets: got request 'getExcerpt'")
    const responseMessage = getResponseData()
    sendResponse(responseMessage)
  } else if (request.name === 'url-added') {
    const current: string[] = LocalStorage.getItem('tabsets.managed') || []
    if (current.indexOf(request.url) === -1) {
      current.push(request.url)
    }
    console.log('updating tabsets.managed', current)
    LocalStorage.setItem('tabsets.managed', current)
  } else if (request.name === 'url-deleted') {
    const current: string[] = LocalStorage.getItem('tabsets.managed') || []
    const index = current.indexOf(request.url)
    if (index !== -1) {
      current.splice(index, 1)
    }
    if (current.length === 0) {
      LocalStorage.removeItem('tabsets.managed')
    } else {
      LocalStorage.setItem('tabsets.managed', current)
    }
  } else {
    const msg = 'unknown request in tabsets-content-scripts: ' + JSON.stringify(request)
    console.log(msg)
    sendResponse({ content: msg })
  }
  return true
})

// const websiteData = getResponseData()
//
// useTagsService()
//   .analyse(websiteData.metas, undefined, location.href)
//   .then((answer) => {
//     console.log('answer', answer)
//   })

// === Annotations code ===

// // document.addEventListener('selectionchange', () => {
// //   const selection = window.getSelection()
// //   console.log('Selection changed:', selection?.toString())
// // })
//
// // const iframe = document.createElement('iframe')
// // iframe.style.border = 'none'
// // iframe.style.display = 'none'
// // iframe.style.left = '50px'
// // iframe.style.position = 'absolute'
// // iframe.style.zIndex = '2147483646'
// // iframe.src = chrome.runtime.getURL('/www/index.html#/overlay/annotations')
// // document.body.appendChild(iframe)
//
// const overlay = document.createElement('div')
// overlay.style.cssText = `
//   position: absolute;
//   background: white;
//   border: 1px solid #ccc;
//   border-radius: 4px;
//   padding: 5px;
//   box-shadow: 0 2px 5px rgba(0,0,0,0.2);
//   z-index: 9999;
//   display: none;
// `
//
// // save button
// const button = document.createElement('button')
// button.textContent = 'Save'
// button.style.cssText = `
//   background: #4285f4;
//   color: white;
//   border: none;
//   border-radius: 3px;
//   padding: 5px 10px;
//   cursor: pointer;
//   font-size: 12px;
// `
//
// overlay.appendChild(button)
//
// overlay.insertAdjacentHTML(
//   'afterbegin',
//   `
// <div style="max-height:100px !important;">
//   <div>Remark</div>
//   <textarea name="remark" id="tabsets.annotation.remark"></textarea>
//   <br>
//   <datalist id="colors">
//     <option value="#e6e6b3">
//     <option value="#b3e6b3">
//     <option value="#b3e6e6">
//     <option value="#b3b3e6">
//   </datalist>
//
//   <div class="colorpicker-wrapper">
//     <input type="color" id="tabsets.annotation.color" class="colorpicker" name="head" value="#e6e6b3" list="colors">
//   </div>
//   <br>
//   <input type="submit" id="tabsets.annotation.submitbutton" value="Save Annotation" style="margin:2px;text-align: right">
// </div>
// `,
// )
//
// document.body.appendChild(overlay)
//
// const annotations: object[] = (LocalStorage.getItem('tabsets.annotations') as object[]) || []
// const highlights: any[] = []
// for (let i = 0; i < 7; i++) {
//   const h = new Highlight()
//   highlights.push(h)
//   CSS.highlights.set(`hightlight-${i}`, h)
// }
//
// annotations.forEach((a: any) => {
//   console.log('annotation:', a.range)
//   const r = useAnnotationUtils().doRestoreFromString(a.range)
//   console.log('got color', a.color)
//   switch (a.color) {
//     case '#e6e6b3':
//       highlights[0].add(r)
//       break
//     case '#6B6134':
//       highlights[1].add(r)
//       break
//     case '#b3e6e6':
//       highlights[2].add(r)
//       break
//     default:
//     case '#b3e6b3':
//       highlights[3].add(r)
//   }
// })
//
// // Handle button click
// const remark = document.getElementById('tabsets.annotation.remark') as HTMLInputElement
// const color = document.getElementById('tabsets.annotation.color') as HTMLInputElement
// button.addEventListener('click', () => {
//   const selection = window.getSelection()
//   const selectedText = selection?.toString()
//
//   if (selectedText && selectedText.trim() !== '') {
//     const annotationUtils = useAnnotationUtils()
//     console.log('Selected text saved:', selectedText, annotationUtils.doSaveRange(), bridge.portList)
//
//     const range = annotationUtils.doSaveRange()
//     // console.log('got range', range)
//     // console.log('remark', remark.value)
//     const annotation: Annotation = {
//       text: selectedText,
//       range: toRangeDefinition(useAnnotationUtils().getCP2String(range)),
//       timestamp: new Date().getTime(),
//       color: toRGBDefinition(color.value),
//       remark: remark.value || 'xxx',
//     }
//     annotations.push(annotation)
//     LocalStorage.setItem('tabsets.annotations', annotations)
//
//     // console.log('sending message sidePanelOpened')
//     // chrome.runtime
//     //   .sendMessage({ action: 'sidePanelOpened' })
//     //   .then((r: any) => console.log('got result', r))
//     //   .catch((e: any) => console.warn('error', e))
//
//     // if (bridge.portList.indexOf('background') >= 0) {
//     //   bridge
//     //     .send({
//     //       event: 'new-annotation',
//     //       to: 'background',
//     //       payload: { text: selectedText, range: annotationUtils.doSaveRange() },
//     //     })
//     //     .catch((err: any) => {
//     //       console.log("[BEX-CT] Failed to send 'text.saved' message to background", err)
//     //     })
//     // }
//
//     // bridge
//     //   .send({
//     //     event: 'new-annotation',
//     //     to: 'app',
//     //     payload: { text: selectedText, range: annotationUtils.doSaveRange() },
//     //   })
//     //   .catch((err: any) => {
//     //     console.log("[BEX-CT] Failed to send 'text.saved' message to background", err)
//     //   })
//   }
//
//   // Hide overlay after action
//   overlay.style.display = 'none'
//
//   // selection?.removeAllRanges();
// })
//
// document.addEventListener('selectionchange', () => {
//   const selection = window.getSelection()
//   const selectedText = selection?.toString()
//
//   if (selectedText && selectedText.trim() !== '') {
//     //console.log('Selection changed:', selectedText)
//
//     // Get selection coordinates to position the overlay
//     if (selection && selection.rangeCount > 0) {
//       const range = selection.getRangeAt(0)
//       const rect = range.getBoundingClientRect()
//
//       // Position overlay near the end of the selection
//       overlay.style.left = `${rect.right + window.scrollX}px`
//       overlay.style.top = `${rect.top + window.scrollY - overlay.offsetHeight}px`
//
//       // Show overlay
//       overlay.style.display = 'block'
//       // console.log('style', style)
//       // iframe.style.display = 'block'
//       // style.setAttribute('display', 'block')
//     }
//   } else {
//     // Don't hide immediately to allow clicking the button
//     // We'll hide it on mousedown outside the overlay
//   }
// })
//
// // Hide overlay when clicking outside (but not when clicking the overlay itself)
// document.addEventListener('mousedown', (event) => {
//   if (!overlay.contains(event.target as Node)) {
//     overlay.style.display = 'none'
//   }
//   // if (!iframe.contains(event.target as Node)) {
//   //   iframe.style.display = 'none'
//   // }
// })
//
// // Alternative approach: use mouseup to show the overlay
// // This can be more reliable in some cases
// document.addEventListener('mouseup', () => {
//   const selection = window.getSelection()
//   const selectedText = selection?.toString()
//
//   if (selectedText && selectedText.trim() !== '') {
//     // Same positioning logic as in selectionchange
//     if (selection && selection.rangeCount > 0) {
//       const range = selection.getRangeAt(0)
//       const rect = range.getBoundingClientRect()
//
//       overlay.style.left = `${rect.right + window.scrollX}px`
//       overlay.style.top = `${rect.top + window.scrollY - overlay.offsetHeight}px`
//       overlay.style.display = 'block'
//     }
//   }
// })
