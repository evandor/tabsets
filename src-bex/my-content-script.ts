// Hooks added here have a bridge allowing communication between the BEX Content Script and the Quasar Application.
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/content-hooks


// Hooks added here have a bridge allowing communication between the BEX Content Script and the Quasar Application.
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/content-hooks
// @ts-ignore
import {bexContent} from 'quasar/wrappers'


export default bexContent((bridge:any) => {
  //console.log("bexContentBridge1", bridge)
  // console.log("bexContentBridge2", typeof document.body, document.body.toString())

  chrome.runtime.sendMessage({msg: "capture"}, function (response) {
    console.log("created thumbnail for tabsets")
  });



  function getMetas(document: Document) {
    const result: { [k: string]: string } = {}
    const res: string[] = []
    const metaNodes: NodeList = document.querySelectorAll('meta')
    metaNodes.forEach((node: Node) => {
      const element = <Element>node
      //console.log("node", <Element>node)
      const nameAttr = element.attributes.getNamedItem('name')
      const propAttr = element.attributes.getNamedItem('property')
      const contAttr = element.attributes.getNamedItem('content')
      const key: string = nameAttr ? (nameAttr.value || 'undefName') : (propAttr?.value || 'undefProp')
      //console.log("key", key, contAttr?.value || 'x')
      if (key) {
        result[key] = contAttr?.value || ''
      }
      res.push((element.attributes.getNamedItem('name')?.textContent) || 'undef')
    })
    //console.log("result", result)
    return result
  }

  chrome.runtime.sendMessage({msg: "html2text", html: document.documentElement.outerHTML, metas: getMetas(document)}, function (response) {
    console.log("created text excerpt for tabsets")
  });


})
