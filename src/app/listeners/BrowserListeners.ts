import { uid } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { SidePanelViews } from 'src/app/models/SidePanelViews'
import { useContentStore } from 'src/content/stores/contentStore'
import { useUtils } from 'src/core/services/Utils'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import NavigationService from 'src/services/NavigationService'
import { Suggestion } from 'src/suggestions/domain/models/Suggestion'
import { useSuggestionsStore } from 'src/suggestions/stores/suggestionsStore'
import { Tab } from 'src/tabsets/models/Tab'
import { TabAndTabsetId } from 'src/tabsets/models/TabAndTabsetId'
import { useSelectedTabsetService } from 'src/tabsets/services/selectedTabsetService'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsetsUiStore } from 'src/tabsets/stores/tabsetsUiStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useUiStore } from 'src/ui/stores/uiStore'

const { addToTabsetId } = useTabsetService()

const { inBexMode, addListenerOnce } = useUtils()

let timer: { time: number; start: number; url: string } = { time: 0, start: new Date().getTime(), url: '' }

async function stopTimer(url: string) {
  const duration = new Date().getTime() - timer.start
  //console.log(`stopping timer for ${url}: ${timer.time} + ${duration}`)
  const tabsForUrl: TabAndTabsetId[] = useTabsetsStore().tabsForUrl(url)
  for (const tabWithTsId of tabsForUrl) {
    //console.log('found', tabWithTsId)
    tabWithTsId.tab.readingTime += Math.min(duration, 60000)
    const ts = useTabsetsStore().getTabset(tabWithTsId.tabsetId)
    if (ts) {
      //console.log('saving', ts)
      await useTabsetService().saveTabset(ts)
    }
  }
  if (tabsForUrl.length === 0) {
    timers.set(url, timer.time + duration)
  }
  //console.log('timers', timers)
}

function startTimer(url: string | undefined) {
  if (url) {
    if (timer.url !== url) {
      stopTimer(timer.url) // stop 'old' timer
    }
    timer = { start: new Date().getTime(), url: url, time: timers.get(url) || 0 }
    //console.log('started timer', timer)
  }
}

function stopTimers() {
  timer = { time: 0, start: new Date().getTime(), url: '' }
}

const timers = new Map<string, number>()

async function setCurrentTab() {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
  if (chrome.runtime.lastError) {
    console.warn('got runtime error:' + JSON.stringify(chrome.runtime.lastError))
  }
  //console.debug("setting current tab", tabs)
  if (tabs && tabs[0]) {
    useTabsStore2().setCurrentChromeTab(tabs[0] as unknown as chrome.tabs.Tab)
  } else {
    // Seems to be necessary when creating a new chrome group
    const tabs2 = await chrome.tabs.query({ active: true })
    if (chrome.runtime.lastError) {
      console.warn('got runtime error:' + JSON.stringify(chrome.runtime.lastError))
    }
    //console.log("setting current tab II", tabs2)
    if (tabs2 && tabs2[0]) {
      useTabsStore2().setCurrentChromeTab(tabs2[0] as unknown as chrome.tabs.Tab)
    }
  }
}

function inIgnoredMessages(request: any) {
  // TODO name vs. msg!
  return (
    request.name === 'progress-indicator' ||
    request.name === 'current-tabset-id-change' ||
    request.name === 'tab-being-dragged' ||
    request.name === 'note-changed' ||
    request.name === 'tab-added' ||
    request.name === 'tab-deleted' ||
    request.name === 'tabset-added' ||
    request.name === 'tabset-renamed' ||
    request.name === 'mark-tabset-deleted' ||
    request.name === 'feature-activated' ||
    request.name === 'feature-deactivated' ||
    request.name === 'tabsets-imported' ||
    request.name === 'settings-changed' ||
    request.name === 'reload-suggestions' ||
    request.name === 'reload-tabset' ||
    request.name === 'reload-spaces' ||
    request.name === 'detail-level-perTabset-changed' ||
    request.name === 'detail-level-changed' ||
    request.name === 'reload-application' ||
    request.name === 'window-updated' ||
    request.name === 'entity-changed' ||
    request.name === 'reload-entities' ||
    request.name === 'api-changed' ||
    request.name === 'tabsets.app.change.currentTabset' ||
    request.action === 'highlight-annotation'
  )
}

function runOnNotificationClick(notificationId: string, buttonIndex: number) {
  console.log('notification button clicked', notificationId, buttonIndex)
  const notification = useSuggestionsStore().getSuggestion(notificationId)
  console.log('found notificastion', notification)
  if (notification) {
    switch (buttonIndex) {
      case 0: // show
        const url = chrome.runtime.getURL('www/index.html') + '#/mainpanel/suggestions/' + notificationId
        NavigationService.openOrCreateTab([url])
        useSuggestionsStore().updateSuggestionState(notificationId, 'CHECKED')
        break
      default: // ignore
        useSuggestionsStore().updateSuggestionState(notificationId, 'IGNORED')
    }
  }
}

async function checkSwitchTabsetSuggestion(windowId: number) {
  const suggestedTabsetAndFolder = await useTabsStore2().suggestTabsetAndFolder(0.6)
  if (suggestedTabsetAndFolder) {
    console.log('suggestedTabsetAndFolder', suggestedTabsetAndFolder)
    const suggestion = new Suggestion(
      uid(), //'SWITCH_TABSET',
      'Switch Tabset?',
      'Your currently open tabs match a different tabset: ' +
        suggestedTabsetAndFolder?.tabsetName +
        '. Do you want to switch to this tabset?',
      'tabset://' + suggestedTabsetAndFolder?.tabsetId + '/' + suggestedTabsetAndFolder?.folder,
      'SWITCH_TABSET',
    )
    //  .setImage('o_tab')
    // .setState('PRIO')
    //  .setWindowId(windowId)
    suggestion.applyLabel = 'switch'
    suggestion.windowId = windowId
    await useSuggestionsStore().addSuggestion(suggestion)
  }
}

class BrowserListeners {
  private onUpdatedListener = (number: number, info: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) =>
    this.onUpdated(number, info, tab)
  private onMovedListener = (number: number, info: chrome.tabs.TabMoveInfo) => this.onMoved(number, info)
  private onRemovedListener = (number: number, info: chrome.tabs.TabRemoveInfo) => this.onRemoved(number, info)
  private onReplacedListener = (n1: number, n2: number) => this.onReplaced(n1, n2)
  private onActivatedListener = (info: chrome.tabs.TabActiveInfo) => this.onActivated(info)
  private onMessageListener = (request: any, sender: chrome.runtime.MessageSender, sendResponse: any) =>
    this.onMessage(request, sender, sendResponse)

  private onWindowFocusChangedListener = (windowId: number) => this.onWindowFocusChanged(windowId)
  private onWindowRemovedListener = (windowId: number) => this.onWindowRemoved(windowId)

  private onCommandListener = (command: string) => {
    switch (command) {
      case 'tabHistoryBack':
        NavigationService.backOneTab()
        break
      case 'tabHistoryForward':
        NavigationService.forwardOneTab()
        break
      case 'search':
        //console.log('in command search')
        break
      default:
        console.log(`unknown Command: ${command}`)
        break
    }
  }

  async initListeners() {
    if (process.env.MODE === 'bex') {
      // console.debug(' ...initializing chrome tab listeners')

      chrome.runtime.setUninstallURL('https://tabsets.web.app/#/uninstall')

      await setCurrentTab()

      // --- tab listeners ---
      //chrome.tabs.onCreated.addListener(this.onCreatedListener)
      addListenerOnce(chrome.tabs.onUpdated, this.onUpdatedListener)
      addListenerOnce(chrome.tabs.onActivated, this.onActivatedListener)
      addListenerOnce(chrome.tabs.onMoved, this.onMovedListener)
      addListenerOnce(chrome.tabs.onRemoved, this.onRemovedListener)
      addListenerOnce(chrome.tabs.onReplaced, this.onReplacedListener)

      // --- window listeners ---
      addListenerOnce(chrome.windows.onFocusChanged, this.onWindowFocusChangedListener)
      addListenerOnce(chrome.windows.onRemoved, this.onWindowRemovedListener)

      // --- other listeners ---
      addListenerOnce(chrome.runtime.onMessage, this.onMessageListener)

      if (chrome.commands) {
        chrome.commands.onCommand.addListener(this.onCommandListener)
      }

      // TODO removed listeners as well?
      if (useFeaturesStore().hasFeature(FeatureIdent.NOTIFICATIONS)) {
        chrome.notifications?.onButtonClicked.addListener((notificationId, buttonIndex) => {
          runOnNotificationClick(notificationId, buttonIndex)
        })
        chrome.notifications?.onClicked.addListener((notificationId) => {
          runOnNotificationClick(notificationId, 0)
        })
      }
    }

    // https://stackoverflow.com/questions/77089404/chrom-extension-close-event-not-available-on-sidepanel-closure
    if (inBexMode() && chrome && chrome.runtime) {
      chrome.runtime.connect({ name: 'tabsetsSidepanel' })
    }
  }

  // #region snippet
  async onUpdated(number: number, info: chrome.tabs.TabChangeInfo, chromeTab: chrome.tabs.Tab) {
    await setCurrentTab()
    if (this.ignoreUrl(chromeTab.url) || info.status !== 'complete') {
      return
    }
    console.debug(`==> tabUpdate: ${chromeTab.url?.substring(0, 30)}`)
    useTabsetsUiStore().setMatchingTabsFor(chromeTab.url)
    useTabsetService().urlWasActivated(chromeTab.url)
    useTabsetsUiStore().updateExtensionIcon(chromeTab.id)

    await checkSwitchTabsetSuggestion(chromeTab.windowId)
  }

  // #endregion snippet

  // handle existing tabs - contained in onTabUpdate before
  // if (useFeaturesStore().hasFeature(FeatureIdent.TAB_GROUPS)) {
  //   const matchingTabs = useTabsetsStore().tabsForUrl(chromeTab.url || '')
  //   for (const tabAndTabsetId of matchingTabs) {
  //     // we care only about actually setting a group, not about removal
  //     if (info.groupId && info.groupId >= 0) {
  //       console.log(' --- updating existing tabs for url: ', chromeTab.url, tabAndTabsetId, info)
  //       tabAndTabsetId.tab.groupId = info.groupId
  //       tabAndTabsetId.tab.groupName = useGroupsStore().currentGroupForId(info.groupId)?.title || '???'
  //       tabAndTabsetId.tab.updated = new Date().getTime()
  //       const tabset = useTabsetsStore().tabsetFor(tabAndTabsetId.tab.id)
  //       if (tabset) {
  //         await useTabsetService().saveTabset(tabset)
  //       }
  //     }
  //   }
  // }

  async onRemoved(number: number, info: chrome.tabs.TabRemoveInfo) {
    if (info.isWindowClosing) {
      // ignore single closing of tab if the whole window is about to be closed.
      return
    }
    console.debug(`==> tabRemoved: window ${info.windowId}`)
    // await checkSwitchTabsetSuggestion(info.windowId)
  }

  onReplaced(n1: number, n2: number) {
    console.log(`onTabReplaced: tab ${n1} replaced with ${n2}`)
    // useTabsStore2().loadTabs('onReplaced')
  }

  // #region snippet2
  async onActivated(info: chrome.tabs.TabActiveInfo) {
    console.debug(`==> tabActivated: ${JSON.stringify(info)}`)
    await setCurrentTab()
    useTabsetsUiStore().updateExtensionIcon(info.tabId)
    chrome.tabs.get(info.tabId, (tab) => {
      if (chrome.runtime.lastError) {
        console.warn('got runtime error:', chrome.runtime.lastError)
      }
      useContentStore().setCurrentTabUrl(tab.url)
      useTabsetService().urlWasActivated(tab.url)
      useTabsetsUiStore().setMatchingTabsFor(tab.url)

      startTimer(tab.url)
    })
  }

  onWindowFocusChanged(windowId: number) {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      stopTimers()
    }
  }

  onWindowRemoved(windowId: number) {
    useSelectedTabsetService().clearWindow(windowId)
  }

  // #endregion snippet2

  onMoved(number: number, info: chrome.tabs.TabMoveInfo) {
    console.debug(`onTabMoved: tab ${number} moved: ${JSON.stringify(info)}`)
    // useTabsStore2().loadTabs('onMoved')
  }

  onMessage(request: any, sender: chrome.runtime.MessageSender, sendResponse: any) {
    if (inIgnoredMessages(request)) {
      return true
    }
    console.debug(` <<< got message '${request.msg}'`, request)
    if (request.msg === 'addTabToTabset') {
      this.handleAddTabToTabset(request, sender, sendResponse)
    } else if (request.msg === 'captureClipping') {
      this.handleCaptureClipping(request, sender, sendResponse)
    } else if (request.name === 'sidepanel-switch-view') {
      useUiStore().sidePanelSetActiveView(SidePanelViews.MAIN)
    } else if (request.name === 'show-ignored') {
      useUiStore().sidePanelSetActiveView(SidePanelViews.MAIN)
    } else {
      console.log('got unknown message', request)
    }
    return true
  }

  private handleAddTabToTabset(request: any, sender: chrome.runtime.MessageSender, sendResponse: any) {
    console.log('handleAddTabToTabset', request, sender)
    if (sender.tab) {
      this.addToTabset(request.tabsetId, new Tab(uid(), sender.tab))
    }
    sendResponse({ addTabToCurrent: 'done' })
  }

  private capture(request: any) {
    return new Promise((resolve, reject) => {
      // @ts-expect-error TODO
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
        const lastError = chrome.runtime.lastError
        if (lastError) {
          return reject(lastError)
        }

        if (!request) {
          return fetch(dataUrl)
            .then((r) => r.blob())
            .then(resolve, reject)
        }

        const left = request.left * request.dpr
        const top = request.top * request.dpr
        const width = request.width * request.dpr
        const height = request.height * request.dpr

        const canvas = new OffscreenCanvas(width, height)
        const ctx = canvas.getContext('2d')

        fetch(dataUrl)
          .then((r) => r.blob())
          .then(async (blob) => {
            // const prefs = await new Promise(resolve => chrome.storage.local.get({
            //   quality: 0.95
            // }, resolve));

            const img = await createImageBitmap(blob)

            if (width && height) {
              // @ts-expect-error TODO
              ctx.drawImage(img, left, top, width, height, 0, 0, width, height)
            } else {
              // @ts-expect-error TODO
              ctx.drawImage(img, 0, 0)
            }
            resolve(
              await canvas.convertToBlob({
                type: 'image/png',
                quality: 0.95, //prefs.quality
              }),
            )
          })
          .catch(reject)
      })
    })
  }

  private async handleCaptureClipping(request: any, sender: chrome.runtime.MessageSender, sendResponse: any) {
    console.log('handleCaptureClipping', request, sender, request.tabsetId)

    const blob = await this.capture(request)
    const currentTS = useTabsetsStore().getCurrentTabset

    if (sender.tab && currentTS) {
      //console.log('blob', blob)
      const blobId = await useTabsetService().saveBlob(sender.tab, blob as unknown as Blob)

      const newTab = new Tab(uid(), sender.tab)
      newTab.image = 'blob://' + blobId
      //console.log('newTab', newTab)
      this.addToTabset(currentTS.id, newTab)
    }

    sendResponse({ addTabToCurrent: 'done' })
  }

  private addToTabset(currentTSId: string, newTab: Tab) {
    //console.log('addToTabset', currentTSId, newTab)
    addToTabsetId(currentTSId, newTab)
      .then(() => {
        const ts = useTabsetsStore().getTabset(currentTSId)
        if (ts) {
          useTabsetService().saveTabset(ts)
        }
      })
      .then(() => {
        chrome.notifications?.create({
          title: 'Tabset Extension Message',
          type: 'basic',
          //iconUrl: "chrome-extension://" + selfId + "/www/favicon.ico",
          iconUrl: chrome.runtime.getURL('www/favicon.ico'),
          message: 'the tab has been created successfully',
        })
      })
      .catch((err: any) => {
        console.log('catching rejection', err)
        chrome.notifications?.create({
          title: 'Tabset Extension Message',
          type: 'basic',
          //iconUrl: "chrome-extension://" + selfId + "/www/favicon.ico",
          iconUrl: chrome.runtime.getURL('www/favicon.ico'),
          message: 'tab could not be added: ' + err,
        })
      })
  }

  private ignoreUrl(url: string | undefined) {
    const selfUrl = chrome.runtime.getURL('')
    if (url?.startsWith(selfUrl)) {
      //console.debug(`onTabUpdated: >>> .url starts with '${selfUrl}'`)
      return true
    }
  }
}

export default new BrowserListeners()
