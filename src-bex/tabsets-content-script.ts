// Hooks added here have a bridge allowing communication between the BEX Content Script and the Quasar Application.
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/content-hooks


// Hooks added here have a bridge allowing communication between the BEX Content Script and the Quasar Application.
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/content-hooks
// @ts-ignore
import {bexContent} from 'quasar/wrappers'


export default bexContent((bridge: any) => {
  console.log("bexContentBridge1", bridge)
  // console.log("bexContentBridge2", typeof document.body, document.body.toString())

  chrome.runtime.sendMessage({msg: "capture"}, function (response) {
    console.log("created thumbnail for tabsets")
  });

  function getMetas(document: Document) {
    const result: { [k: string]: string } = {}
    //const res: string[] = []
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
      // res.push((element.attributes.getNamedItem('name')?.textContent) || 'undef')
    })
    //console.log("result", result)
    return result
  }

  function getAnchors(document: Document) {
    const result: { [k: string]: number } = {}
    const linkNodes: NodeList = document.querySelectorAll('a')
    linkNodes.forEach((node: Node) => {
      const element = <Element>node
      const hrefAttr = element.attributes.getNamedItem('href')
      if (hrefAttr && hrefAttr.value.trim() != "") {
        const key: string = hrefAttr.value
        if (result[key]) {
          result[key] = result[key] + 1
        } else {
          result[key] = 1
        }
      }
    })
    return result
  }

  function getLinks(document: Document) {
    const result: object[] = []
    const linkNodes: NodeList = document.querySelectorAll('link')
    linkNodes.forEach((node: Node) => {
      const element = <Element>node
      const titleAttr = element.attributes.getNamedItem('title')
      const hrefAttr = element.attributes.getNamedItem('href')
      const typeAttr = element.attributes.getNamedItem('type')
      const relAttr = element.attributes.getNamedItem('rel')
      if (hrefAttr && hrefAttr.value.trim() != "") {
        result.push({
          title: titleAttr?.value || '',
          href: hrefAttr?.value || '',
          type: typeAttr?.value || '',
          rel: relAttr?.value || ''
        })
      }
    })
    return result
  }

  chrome.runtime.sendMessage({
    msg: "html2text",
    html: document.documentElement.outerHTML,
    metas: getMetas(document)
  }, function (response) {
    console.log("created text excerpt for tabsets")
  });

  chrome.runtime.sendMessage({
    msg: "html2links",
    anchors: getAnchors(document),
    links: getLinks(document)
  }, function (response) {
    console.log("created links excerpt for tabsets")
  });


})
