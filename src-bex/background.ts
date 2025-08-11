import { createBridge } from '#q-app/bex/background'
import ContentUtils from 'src/core/utils/ContentUtils'
import Analytics from 'src/core/utils/google-analytics'
import { PageData } from 'src/tabsets/models/PageData'

/**
 * The background script can access chrome.storage.local, but not LocalStorage (from quasar)

 * to check: https://developer.chrome.com/docs/extensions/mv3/tut_analytics/
 */

// https://stackoverflow.com/questions/49739438/when-and-how-does-a-pwa-update-itself
const updateTrigger = 10

let session: any
let categoriesList: string = ''
let languageModelAvailablity: string
let categoriesToUseForModel: string[]

function initModel(categories: string[]) {
  console.log('[BEX-BG] initializing model:', categories)
  categoriesToUseForModel = categories
  if (languageModelAvailablity === 'downloadable') {
    console.log('[BEX-BG] languageModel is downloadable, trying to download...')
    //@ts-expect-error xxx
    LanguageModel.create({
      monitor(m: any) {
        // console.log('[BEX-BG] got monitor', m)
        m.addEventListener('downloadprogress', (e: any) => {
          if (e.loaded > 0.0 && e.loaded < 1.0) console.log(`[BEX-BG] Downloaded: ${e.loaded * 100}%`)
        })
      },
    })
    return
  }
  if (languageModelAvailablity !== 'available') {
    console.log('[BEX-BG] languageModel not available')
    return
  }
  const catList = categories.join(', ')
  const systemPrompt = `Your purpose is to categorize text, using only the following categories:
        ${catList}.
        The user will give you texts as input for you to categorize. If you do not have a good match, propose a new category.
        Please output a JSON object with the following properties:
        category, reason, score, proposedCategory.
        Score should be a value between 0 and 100, where 100 is the highest score.
        `
  //console.log('[BEX-BG] systemPrompt', systemPrompt)
  // @ts-expect-error xxx
  LanguageModel.create({
    monitor(m: any) {
      m.addEventListener('downloadprogress', (e: any) => {
        if (e.loaded > 0.0 && e.loaded < 1.0) {
          console.log(`[BEX-BG] Downloaded(2): ${e.loaded * 100}%`)
        }
      })
    },
    initialPrompts: [
      {
        role: 'system',
        content: systemPrompt,
      },
    ],
  })
    .then((s: any) => {
      console.log('[BEX-BG] === setting session ===', s)
      session = s
    })
    .catch((err: any) => console.warn('could not create AI session', err))
}

// function setActionContextMenu(label: string) {
//   const menuId = 'tabset_extension_action_bg'
//   //console.log(`deleting context menu (save in ${label})`)
//   chrome.contextMenus.remove(menuId, () => {
//     if (chrome.runtime.lastError) {
//       // menuId propably didnt exist
//     }
//     console.log(`create context menu (save in ${label})`)
//     chrome.contextMenus.create({
//       id: menuId,
//       title: 'Save in ' + label + ' collection',
//       documentUrlPatterns: ['*://*/*'],
//       contexts: ['action'],
//     })
//   })
// }

addEventListener('unhandledrejection', (event) => {
  console.log('[BEX-BG] ga: fire error event', event)
  // getting error: Service worker registration failed. Status code: 15
  Analytics.fireErrorEvent(event.reason)
})

chrome.omnibox.onInputEntered.addListener((text) => {
  const newURL = chrome.runtime.getURL('/www/index.html#/searchresult?t=' + encodeURIComponent(text))
  chrome.tabs.create({ url: newURL }).catch((err) => console.log('[BEX-BG] background.js error', err))
})

// setting openPanelOnActionClick
if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch((error: any) => console.error(error))
}

// chrome.contextMenus.onClicked.addListener((e: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab | undefined) => {
//   console.log('listening to', e, tab)
//   if (e.menuItemId === 'tabset_extension_action_bg') {
//     console.log('bridge.portList', bridge.portList)
//     // const cmd = new AddTabToTabsetCommand(new Tab(uid(), null as unknown as chrome.tabs.Tab))
//     // console.log('cmd', cmd)
//   } else {
//     console.log('unknown context menu event', e)
//   }
// })

// TODO remove listener (when?)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  function openSidePanel(tabId: number) {
    const options = {
      // tabId: tabId,
      enabled: true,
    }
    console.log('[BEX-BG] triggering', tabId, options)
    chrome.sidePanel
      .setOptions(options)
      .then((r: any) => console.log('[BEX-BG] r2', r))
      .catch((e: any) => console.log('[BEX-BG] warning', e))
  }

  ;(async function () {
    if (message.name === 'url-added') {
      console.log('[BEX-BG] got message url-added!!', message)
      chrome.action.setBadgeText({ text: '✅' })
      const currentTabs = await chrome.tabs.query({ url: message.data.url })
      console.log('[BEX-BG] currentTabs', currentTabs)
      currentTabs
        .filter((tab: chrome.tabs.Tab) => tab.id)
        .forEach((tab: chrome.tabs.Tab) => {
          chrome.tabs.sendMessage(tab.id!, { name: 'url-added', url: message.data.url }).catch((err) => {
            console.log("[BEX-BG] could not handle 'url-added'", err)
          })
        })
    } else if (message.name === 'url-deleted') {
      console.log('[BEX-BG] got message url-deleted!!', message)
      chrome.action.setBadgeText({ text: '' })
      const currentTabs = await chrome.tabs.query({ url: message.data.url })
      currentTabs
        .filter((tab: chrome.tabs.Tab) => tab.id)
        .forEach((tab: chrome.tabs.Tab) => {
          chrome.tabs.sendMessage(tab.id!, { name: 'url-deleted', url: message.data.url }).catch((err) => {
            console.log("[BEX-BG] could not handle 'url-deleted'", err)
          })
        })
    } else if (message.action === 'sidePanelOpened') {
      // if (initialActiveTabId === null) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length > 0) {
          console.log('[BEX-BG] got tab', tabs[0])
          // initialActiveTabId = tabs[0].id;
          openSidePanel(tabs[0]!.id!)
        }
      })
      // }
    } else if (message.msg === 'captureClipping') {
      // no op
    } else if (message.msg === 'tab-added') {
      // no op
    } else if (message.name === 'tabset-added') {
      // no op
    } else if (message.name === 'feature-activated') {
      // no op
    } else if (message.name === 'reload-application') {
      // no op
    } else {
      console.log(`[BEX-BG] got unknown message '${JSON.stringify(message)}' in background.ts`)
    }
  })()
  // return true to indicate we will send a response asynchronously
  // see https://stackoverflow.com/a/46628145
  return true
})

let modelPromise: any = null

chrome.action.onClicked.addListener((t: chrome.tabs.Tab) => {
  try {
    // @ts-expect-error unknown
    if (browser && browser.sidebarAction) {
      // @ts-expect-error unknown
      browser.sidebarAction.toggle()
    }
  } catch (e: any) {
    console.log('[BEX-BG] e', e)
    // opera maybe?
    // @ts-expect-error unknown
    if (opr && opr.sidebarAction) {
      // @ts-expect-error unknown
      opr.sidebarAction.setPanel({ panel: 'www/index.html' })
    }
  }
})

chrome.runtime.onInstalled.addListener((details) => {
  console.debug('[BEX-BG] onInstalled listener fired in background.ts', details)
  if (chrome.runtime.lastError) {
    console.warn('got runtime error', chrome.runtime.lastError)
  }
})

/* === bridge communication === */

const bridge = createBridge({ debug: false })

bridge.on('update.indicator.icon', (payload: object) => {
  console.log(`[BEX-BG] <<< 'update.indicator.icon': ${JSON.stringify(payload['payload' as keyof object])}`) //, bridge.portList)
  chrome.tabs.query({ active: true, lastFocusedWindow: true }).then((tabs: chrome.tabs.Tab[]) => {
    if (tabs.length > 0 && tabs[0]) {
      const msg = payload['payload' as keyof object]
      if (msg && msg['managed']) {
        chrome.action.setBadgeText({ text: '✅' })
        //chrome.action.setTitle({ title: JSON.stringify(payload['payload' as keyof object]) })
      } else {
        chrome.action.setBadgeText({ text: '' })
        //chrome.action.setTitle({ title: 'none' })
      }
    }
  })
})

bridge.on('tabsets.bex.tab.excerpt', async (payload: object) => {
  const pageData = payload['payload' as keyof object] as PageData
  console.log(
    `[BEX-BG] <<< 'tabsets.bex.tab.excerpt': #html=${pageData.html.length}, #metas:${Object.keys(pageData.metas).length}, url=${pageData.url}`,
  ) //, bridge.portList)0
  // console.log('[BEX-BG] ---payload---', typeof payload, payload)

  const metas: { [k: string]: string } = pageData.metas
  const url: string | undefined = pageData.url

  const storageCategory: object | undefined = pageData.storage
    ? pageData.storage['tabsetsCategorization' as keyof object]
    : undefined
  // console.log(`[BEX-BG] hier - ${JSON.stringify(pl['storage']['tabsetsCategorization'])}`)
  // console.log(`[BEX-BG] hier - ${JSON.stringify(storageCategory[url])}`)
  if (
    url &&
    storageCategory &&
    storageCategory[url] &&
    storageCategory[url]['timestamp'] > new Date().getTime() - 1000 * 60 * 60 * 24
  ) {
    const cacheLeft = Math.round(
      (storageCategory[url]['timestamp'] - (new Date().getTime() - 1000 * 60 * 60 * 24)) / 60_000,
    )
    console.log(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `[BEX-BG] returning early, url: ${url}, (Cache: ${cacheLeft}min left, value=${storageCategory[url]['category']})`,
    )
    return undefined
  }

  const title: string | undefined = metas['title' as keyof object]
    ? metas['title' as keyof object]
    : metas['og:title' as keyof object]
  const description: string | undefined = metas['description' as keyof object]
    ? metas['description' as keyof object]
    : metas['og:description' as keyof object]
  let promptText: string | undefined = title ? title + '. ' + description : description

  if (!promptText) {
    promptText = ContentUtils.html2text(pageData.html || '')
  }

  if (promptText) {
    //const desc = metas['description' as keyof object]
    if (!session) {
      console.log('[BEX-BG] no session!')
      if (categoriesToUseForModel) {
        setTimeout(() => {
          console.log('[BEX-BG] trying to load AI model in 5 seconds...')
          initModel(categoriesToUseForModel)
        }, 5000)
      }
      return
    }
    console.log('[BEX-BG] =======================')
    console.log('[BEX-BG] ', promptText)
    console.log('[BEX-BG] =======================')
    const r = await session.prompt(promptText)
    console.log('[BEX-BG] r', r)
    const json = JSON.parse(r.replace('```json', '').replace('```', '')) as {
      category: string
      reason: string
      score: number
      timestamp: number
    }
    json['timestamp'] = Date.now()
    json['reason'] = json['reason'].replace('"', '\\"')
    // json['reason'] = ''
    console.log('[BEX-BG] json', json)
    // setActionContextMenu(json['category'])
    return json
  }
})

bridge.on('reload-current-tabset', async ({ payload }) => {
  // const ts = useTabsetsStore().getCurrentTabset
  // const currentTabsetId = await useTabsetsStore().getCurrentTabsetId()
  console.log('[BEX-BG] reload-current-tabset', payload)
  await bridge.send({
    event: 'reload-current-tabset',
    to: 'app',
    payload: payload,
  })
  // IndexedDbTabsetsPersistence.init()
  // if (currentTabsetId) {
  //   await useTabsetsStore().reloadTabset(currentTabsetId)
  // }
  // //commentFrame?.style.setProperty('display', 'none')
  // return 'done'
})

bridge.on('new-annotation', async ({ payload }) => {
  console.log('[BEX-BG] payload', payload)

  let initialActiveTabId: number | undefined = undefined

  function openSidePanel(tabId: number) {
    console.log('[BEX-BG] opening', tabId)
    chrome.sidePanel.setOptions({
      tabId: tabId,
      path: 'popup.html',
      enabled: true,
    })
  }

  // Set the panel behavior to open on action click
  // chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).then(() => {
  // Listen for messages from the side panel when it is opened
  // chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Set the initial active tab ID when the side panel is first opened
  // if (initialActiveTabId === null) {
  // chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  //   console.log('tabs', tabs)
  //   if (tabs.length > 0) {
  //     initialActiveTabId = tabs[0]!.id
  //     openSidePanel(initialActiveTabId!)
  //   }
  // })
  // }
  // })
  // })
})

/* === once everytime the background script loads === */

try {
  // @ts-expect-error xxx
  LanguageModel.availability().then((availability: string) => {
    console.log('[BEX-BG] languageModel', availability)
    languageModelAvailablity = availability
  })
} catch (err: any) {}

chrome.storage.local.get('tabsets.ext.ai.active').then((active: object) => {
  console.log('[BEX-BG] checking AI settings', JSON.stringify(active))
  if (true === active['tabsets.ext.ai.active' as keyof object]) {
    //chrome.storage.local.set({ 'tabsets.ext.ai.categories': ['recipe', 'news', 'food', 'programming'] })
    chrome.storage.local.get('tabsets.ext.ai.categories').then((categories: { [p: string]: any }) => {
      console.log('[BEX-BG] categories', categories['tabsets.ext.ai.categories'])
      categoriesList = categories['tabsets.ext.ai.categories']
      if (!categoriesList) {
        initModel(['recipe', 'food', 'travel', 'leisure', 'news', 'unknown'])
        return
      }

      // console.log('[BEX-BG] hier:::', typeof categoriesList, categoriesList, Object.values(categoriesList).length > 0)
      if (Object.values(categoriesList).length > 0) {
        initModel(Object.values(categoriesList))
      } else {
        initModel(['recipe', 'food', 'travel', 'leisure', 'news', 'unknown'])
      }
    })
  }
})
