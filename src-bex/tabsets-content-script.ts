// Hooks added here have a bridge allowing communication between the BEX Content Script and the Quasar Application.
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/content-hooks
// @ts-ignore
import {bexContent} from 'quasar/wrappers'

export default bexContent((bridge: any) => {

  // @ts-ignore
  if (window.contentScriptAnalysisAlredyCalled) {
    // https://stackoverflow.com/questions/23208134/avoid-dynamically-injecting-the-same-script-multiple-times-when-using-chrome-tab
    //console.debug("stopping execution of tabsets-content-script as it is already setup")
    return
  }

  console.debug("tabsets: initializing content script for tab analysis...")
  // @ts-ignore
  window.contentScriptAnalysisAlredyCalled  = true


  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request === 'getExcerpt') {
      console.debug("tabsets: got request 'getExcerpt'")
      const responseMessage = {
        html: document.documentElement.outerHTML,
        metas: getMetas(document)
      }
      console.debug("tabsets: received message for content, html size:", responseMessage.html.length, responseMessage.metas)
      sendResponse(responseMessage);
    } else {
      sendResponse({content: "unknown request in tabsets-content-scripts: " + request});
    }
    return true
  })

  function getMetas(document: Document) {
    //console.debug("tabsets: getting metas for document" )
    const result: { [k: string]: string } = {}
    //const res: string[] = []
    const metaNodes: NodeList = document.querySelectorAll('meta')
    metaNodes.forEach((node: Node) => {
      const element = <Element>node
      const nameAttr = element.attributes.getNamedItem('name')
      const propAttr = element.attributes.getNamedItem('property')
      const contAttr = element.attributes.getNamedItem('content')
      const key: string = nameAttr ? (nameAttr.value.trim().toLowerCase() || 'undefName') : (propAttr?.value || 'undefProp')
      //console.debug("tabsets: key", key, contAttr?.value || 'x')
      if (key) {
        result[key] = contAttr?.value || ''
      }
      // res.push((element.attributes.getNamedItem('name')?.textContent) || 'undef')
    })
    return result
  }


})
