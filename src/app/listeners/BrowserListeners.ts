import { uid } from 'quasar'
import BrowserApi from 'src/app/BrowserApi'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { SidePanelViews } from 'src/app/models/SidePanelViews'
import { useContentStore } from 'src/content/stores/contentStore'
import { useUtils } from 'src/core/services/Utils'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import NavigationService from 'src/services/NavigationService'
import { SuggestionState } from 'src/suggestions/models/Suggestion'
import { useSuggestionsStore } from 'src/suggestions/stores/suggestionsStore'
import { Tab } from 'src/tabsets/models/Tab'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useGroupsStore } from 'src/tabsets/stores/groupsStore'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsetsUiStore } from 'src/tabsets/stores/tabsetsUiStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useUiStore } from 'src/ui/stores/uiStore'
import { useWindowsStore } from 'src/windows/stores/windowsStore'

const { saveText, addToTabsetId } = useTabsetService()

const { sanitize, inBexMode } = useUtils()

async function setCurrentTab() {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
  if (chrome.runtime.lastError) {
    console.warn('got runtime error:' + chrome.runtime.lastError.toString())
  }
  //console.debug("setting current tab", tabs)
  if (tabs && tabs[0]) {
    useTabsStore2().setCurrentChromeTab(tabs[0] as unknown as chrome.tabs.Tab)
  } else {
    // Seems to be necessary when creating a new chrome group
    const tabs2 = await chrome.tabs.query({ active: true })
    if (chrome.runtime.lastError) {
      console.warn('got runtime error:' + chrome.runtime.lastError.toString())
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
        useSuggestionsStore().updateSuggestionState(notificationId, SuggestionState.CHECKED)
        break
      default: // ignore
        useSuggestionsStore().updateSuggestionState(notificationId, SuggestionState.IGNORED)
    }
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
  private onCommandListener = (command: string) => {
    switch (command) {
      case 'tabHistoryBack':
        NavigationService.backOneTab()
        break
      case 'tabHistoryForward':
        NavigationService.forwardOneTab()
        break
      case 'search':
        break
      default:
        console.log(`unknown Command: ${command}`)
        break
    }
  }

  async initListeners() {
    if (process.env.MODE === 'bex') {
      console.debug(' ...initializing chrome tab listeners')

      chrome.runtime.setUninstallURL('https://tabsets.web.app/#/uninstall')

      await setCurrentTab()

      //chrome.tabs.onCreated.addListener(this.onCreatedListener)
      chrome.tabs.onUpdated.addListener(this.onUpdatedListener)
      chrome.tabs.onMoved.addListener(this.onMovedListener)
      chrome.tabs.onRemoved.addListener(this.onRemovedListener)
      chrome.tabs.onReplaced.addListener(this.onReplacedListener)
      chrome.tabs.onActivated.addListener(this.onActivatedListener)

      chrome.runtime.onMessage.addListener(this.onMessageListener)

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

  async resetListeners() {
    console.log(' ...resetting listeners (after re-initialization)')
    //chrome.tabs.onCreated.removeListener(this.onCreatedListener)
    chrome.tabs.onUpdated.removeListener(this.onUpdatedListener)
    chrome.tabs.onMoved.removeListener(this.onMovedListener)
    chrome.tabs.onRemoved.removeListener(this.onRemovedListener)
    chrome.tabs.onReplaced.removeListener(this.onReplacedListener)
    chrome.tabs.onActivated.removeListener(this.onActivatedListener)
    chrome.runtime.onMessage.removeListener(this.onMessageListener)
    if (chrome.commands) {
      chrome.commands.onCommand.removeListener(this.onCommandListener)
    }
  }

  async onUpdated(number: number, info: chrome.tabs.TabChangeInfo, chromeTab: chrome.tabs.Tab) {
    // set current browser tab in tabsStore
    await setCurrentTab()

    const selfUrl = chrome.runtime.getURL('')
    if (chromeTab.url?.startsWith(selfUrl)) {
      console.debug(`onUpdated:   tab ${number}: >>> .url starts with '${selfUrl}'`)
      return
    }

    if (info.status === 'complete') {
      console.debug(`onUpdated:   tab ${number}: >>> ${JSON.stringify(info)}`)

      this.handleUpdateInjectScripts(info, chromeTab)

      // handle existing tabs
      if (useFeaturesStore().hasFeature(FeatureIdent.TAB_GROUPS)) {
        const matchingTabs = useTabsetsStore().tabsForUrl(chromeTab.url || '')
        for (const tabAndTabsetId of matchingTabs) {
          // we care only about actually setting a group, not about removal
          if (info.groupId && info.groupId >= 0) {
            console.log(' --- updating existing tabs for url: ', chromeTab.url, tabAndTabsetId, info)
            tabAndTabsetId.tab.groupId = info.groupId
            tabAndTabsetId.tab.groupName = useGroupsStore().currentGroupForId(info.groupId)?.title || '???'
            tabAndTabsetId.tab.updated = new Date().getTime()
            const tabset = useTabsetsStore().tabsetFor(tabAndTabsetId.tab.id)
            if (tabset) {
              await useTabsetService().saveTabset(tabset)
            }
          }
        }
      }

      // matching tabs for url
      if (chromeTab.url) {
        useTabsetsUiStore().setMatchingTabsFor(chromeTab.url)
      }
    }
  }

  private handleUpdateInjectScripts(info: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
    if (!tab.id || (tab.url && tab.url.startsWith('https://shared.tabsets.net'))) {
      return
    }
    if (!useUiStore().hideIndicatorIcon) {
      BrowserApi.addIndicatorIcon(tab.id, tab.url)
    }
  }

  onRemoved(number: number, info: chrome.tabs.TabRemoveInfo) {
    console.debug('onRemoved tab event: ', number, info)
    useWindowsStore().refreshTabsetWindow(info.windowId)
  }

  onReplaced(n1: number, n2: number) {
    console.log(`onReplaced: tab ${n1} replaced with ${n2}`)
    useTabsStore2().loadTabs('onReplaced')
  }

  async onActivated(info: chrome.tabs.TabActiveInfo) {
    console.debug(`onActivated: tab ${info.tabId}: >>> ${JSON.stringify(info)}`)
    await setCurrentTab()

    chrome.tabs.get(info.tabId, (tab) => {
      if (chrome.runtime.lastError) {
        console.warn('got runtime error:' + chrome.runtime.lastError.toString())
      }
      const url = tab.url
      if (url) {
        useContentStore().setCurrentTabUrl(tab.url)

        useTabsetService().urlWasActivated(url)

        // matching tabs for url
        useTabsetsUiStore().setMatchingTabsFor(url)
      }
    })
  }

  onMoved(number: number, info: chrome.tabs.TabMoveInfo) {
    console.debug(`onMoved: tab ${number} moved: ${JSON.stringify(info)}`)
    useTabsStore2().loadTabs('onMoved')
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
      console.log('blob', blob)
      const blobId = await useTabsetService().saveBlob(sender.tab, blob as unknown as Blob)

      const newTab = new Tab(uid(), sender.tab)
      newTab.image = 'blob://' + blobId
      console.log('newTab', newTab)
      this.addToTabset(currentTS.id, newTab)
    }

    sendResponse({ addTabToCurrent: 'done' })
  }

  private addToTabset(currentTSId: string, newTab: Tab) {
    console.log('addToTabset', currentTSId, newTab)
    addToTabsetId(currentTSId, newTab)
      .then(() => {
        const ts = useTabsetsStore().getTabset(currentTSId)
        if (ts) {
          useTabsetService().saveTabset(ts)
        }
      })
      .then(() => {
        chrome.notifications.create({
          title: 'Tabset Extension Message',
          type: 'basic',
          //iconUrl: "chrome-extension://" + selfId + "/www/favicon.ico",
          iconUrl: chrome.runtime.getURL('www/favicon.ico'),
          message: 'the tab has been created successfully',
        })
      })
      .catch((err: any) => {
        console.log('catching rejection', err)
        chrome.notifications.create({
          title: 'Tabset Extension Message',
          type: 'basic',
          //iconUrl: "chrome-extension://" + selfId + "/www/favicon.ico",
          iconUrl: chrome.runtime.getURL('www/favicon.ico'),
          message: 'tab could not be added: ' + err,
        })
      })
  }
}

export default new BrowserListeners()
