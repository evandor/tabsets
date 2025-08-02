import { createBridge } from '#q-app/bex/content'
import { LOCAL_STORAGE_CATEGORIZATION_KEY } from 'boot/constants'
import { LocalStorage } from 'quasar'
import { PageData } from 'src/tabsets/models/PageData'

// The use of the bridge is optional.
const bridge = createBridge({ debug: false })

declare module '@quasar/app-vite' {
  interface BexEventMap {
    'some.event': [{ someProp: string }, void]
  }
}

async function getAppId(): Promise<string> {
  const appId = await chrome.storage.local.get('tabsets.ext.app.id')
  console.log('(999)', appId)
  return appId['tabsets.ext.app.id'] || '-'
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
      tabsetsInstallationId: LocalStorage.getItem('tabsets.app.id') || '',
      tabsetsCategorization: LocalStorage.getItem(LOCAL_STORAGE_CATEGORIZATION_KEY),
    },
  }
}

function sendUpdateIndicatorIconMessage(show: boolean = true) {
  if (bridge.portList.indexOf('background') >= 0) {
    let managed = false
    if (show) {
      const managedTabs: string[] | null = LocalStorage.getItem('tabsets.managed')
      const appIdFromSite: string | null = LocalStorage.getItem('tabsets.app.id')
      console.log('hier', managedTabs, window.location.href)
      if (managedTabs && managedTabs.indexOf(window.location.href) >= 0) {
        // compare installation ids - if not matching, information is not valid anymore
        chrome.storage.local.get('tabsets.ext.app.id').then((currentAppId: { [p: string]: any }) => {
          const appId = currentAppId['tabsets.ext.app.id']
          console.log('got currentAppId', appId)
          console.log('got appIdFromSite', appIdFromSite)
          if (appId !== appIdFromSite) {
            console.warn('outdated info, deleting data from local storage')
            LocalStorage.removeItem('tabsets.annotations')
            LocalStorage.removeItem('tabsets.app.id')
            LocalStorage.removeItem('tabsets.managed')
            LocalStorage.removeItem('tabsets.annotations')
          } else {
            managed = true
          }
          console.log(`update.indicator.icon: managed ${managed}`)
          bridge.send({ event: 'update.indicator.icon', to: 'background', payload: { managed } }).catch((err: any) => {
            console.log("[BEX-CT] Failed to send 'update.indicator.icon' message to background", err)
          })
        })
      }
    } else {
      console.log(`update.indicator.icon: managed ${managed}`)
      bridge.send({ event: 'update.indicator.icon', to: 'background', payload: { managed } }).catch((err: any) => {
        console.log("[BEX-CT] Failed to send 'update.indicator.icon' message to background", err)
      })
    }
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

    const responseMessage = getResponseData()
    if (bridge.portList.indexOf('app') >= 0) {
      console.log(`[BEX-CT] >>> 'tabsets.bex.tab.excerpt' to 'app'`)
      bridge.send({ event: 'tabsets.bex.tab.excerpt', to: 'app', payload: responseMessage }).catch((err: any) => {
        console.log('[BEX-CT] Failed to send message to app', err)
      })
    }

    console.log(`[BEX-CT] >>> 'tabsets.bex.tab.excerpt' to 'background'`)
    bridge
      .send({ event: 'tabsets.bex.tab.excerpt', to: 'background', payload: responseMessage })
      .then((answer: object | undefined) => {
        console.log('answer', answer)

        if (answer) {
          // const json = JSON.parse(answer.replace('```json', '').replace('```', '')) as AiCategoryAnswer
          // console.log('json', json)
          //LocalStorage.setItem(LOCAL_STORAGE_CATEGORIZATION_KEY, json)
          const current: { [k: string]: object } = LocalStorage.getItem(LOCAL_STORAGE_CATEGORIZATION_KEY) || {}
          console.log('current', current)
          // const index = current.indexOf(location.href)
          // if (Object.keys(current).indexOf(location.href) ) {
          //   current.push(location.href)
          // }
          const toStore: { [k: string]: string } = {}
          current[location.href as keyof object] = answer
          LocalStorage.setItem(LOCAL_STORAGE_CATEGORIZATION_KEY, JSON.parse(JSON.stringify(current)))
        }
      })
      .catch((err: any) => {
        console.log('[BEX-CT] Failed to send message to background', err)
      })
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
    getAppId().then((appId: string) => LocalStorage.setItem('tabsets.app.id', appId))
  } else if (request.name === 'url-deleted') {
    const current: string[] = LocalStorage.getItem('tabsets.managed') || []
    const index = current.indexOf(request.url)
    if (index !== -1) {
      current.splice(index, 1)
    }
    if (current.length === 0) {
      LocalStorage.removeItem('tabsets.managed')
      chrome.storage.local.remove('tabsets.ext.app.id')
    } else {
      LocalStorage.setItem('tabsets.managed', current)
      getAppId().then((appId: string) => LocalStorage.setItem('tabsets.app.id', appId))
    }
  } else {
    const msg = 'unknown request in tabsets-content-scripts: ' + JSON.stringify(request)
    console.log(msg)
    sendResponse({ content: msg })
  }
  return true
})
