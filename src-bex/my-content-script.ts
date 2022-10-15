// Hooks added here have a bridge allowing communication between the BEX Content Script and the Quasar Application.
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/content-hooks


// Hooks added here have a bridge allowing communication between the BEX Content Script and the Quasar Application.
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/content-hooks
import {bexContent} from 'quasar/wrappers'


export default bexContent((bridge) => {
  //console.log("bexContentBridge1", bridge)
  // console.log("bexContentBridge2", typeof document.body, document.body.toString())

  chrome.runtime.sendMessage({msg: "capture"}, function (response) {
    console.log("created thumbnail for tabsets")
  });

  chrome.runtime.sendMessage({msg: "html2text", html: document.documentElement.outerHTML}, function (response) {
    console.log("created text excerpt for tabsets")
  });

  function getMetas(document: Document) {
    const result: { [k: string]: string } = {}
    const res: string[] = []
    const metaNodes: NodeList = document.querySelectorAll('meta')
    metaNodes.forEach((node: Node) => {
      const element = <Element>node
      // if (node['name' as keyof Node]) {
      //   let name: string = (node['name' as keyof Node] || 'undefinedName').toString()
      //   result[name] = (node['content' as keyof Node] || 'undefined').toString()
      // } else if (node['property' as keyof Node]) {
      //   let name: string = (node['property' as keyof Node] || 'undefinedProperty').toString()
      //   result[name] = (node['content' as keyof Node] || 'undefined').toString()
      // } else {
      // }
      console.log("node", typeof node, node.nodeType, node.nodeValue, node.TEXT_NODE)
      console.log("node", <Element>node)
      const nameAttr = element.attributes.getNamedItem('name')
      const propAttr = element.attributes.getNamedItem('property')
      const contAttr = element.attributes.getNamedItem('content')
      const key: string = nameAttr ? (nameAttr.value || 'undefName') : (propAttr?.value || 'undefProp')
      console.log("key", key, contAttr?.value || 'x')
      if (key) {
        result[key] = contAttr?.value || ''
      }
      res.push((element.attributes.getNamedItem('name')?.textContent) || 'undef')
    })
    console.log("result", result)
    return result
  }

  chrome.runtime.sendMessage({msg: "htmlmeta", metas: getMetas(document)}, function (response) {
    console.log("got htmlmeta")
  });


})
