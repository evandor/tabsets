import {Tabset, TabsetStatus, TabsetType} from "src/tabsets/models/Tabset";
import _ from "lodash";
import {HTMLSelection, Tab} from "src/tabsets/models/Tab";
import {uid, useQuasar} from "quasar";
import throttledQueue from 'throttled-queue';
import {useWindowsStore} from "src/windows/stores/windowsStore";
import {useTabsetService} from "src/services/TabsetService2";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {MetaLink} from "src/models/MetaLink";
import {Suggestion, SuggestionState, SuggestionType} from "src/suggestions/models/Suggestion";
import {useSuggestionsStore} from "src/suggestions/stores/suggestionsStore";
import {FeatureIdent} from "src/models/FeatureIdent";
import {Extractor, Extractors, ExtractorType} from "src/config/Extractors";
import {useUtils} from "src/services/Utils";
import {useGroupsStore} from "stores/groupsStore";
import NavigationService from "src/services/NavigationService";
import ContentUtils from "src/utils/ContentUtils";
import "rangy/lib/rangy-serializer";
import {useAuthStore} from "stores/authStore";
import {EMAIL_LINK_REDIRECT_DOMAIN} from "boot/constants";
import {SidePanelView, useUiStore} from "stores/uiStore";
import {useThumbnailsService} from "src/thumbnails/services/ThumbnailsService";
import {useTabsStore2} from "src/tabsets/stores/tabsStore2";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {useTabsStore} from "src/bookmarks/stores/tabsStore";
import {useFeaturesStore} from "src/features/stores/featuresStore";

const {
  saveTabset,
  saveText,
  saveMetaLinksFor,
  saveLinksFor,
  addToTabsetId
} = useTabsetService()

const {sanitize, sendMsg, inBexMode} = useUtils()

async function setCurrentTab() {
  const tabs = await chrome.tabs.query({active: true, lastFocusedWindow: true})

  //console.debug("setting current tab", tabs)
  if (tabs && tabs[0]) {
    useTabsStore2().setCurrentChromeTab(tabs[0] as unknown as chrome.tabs.Tab)
  } else {
    // Seems to be necessary when creating a new chrome group
    const tabs2 = await chrome.tabs.query({active: true})
    //console.log("setting current tab II", tabs2)
    if (tabs2 && tabs2[0]) {
      useTabsStore2().setCurrentChromeTab(tabs2[0] as unknown as chrome.tabs.Tab)
    }
  }
}

function annotationScript(tabId: string, annotations: any[]) {
  console.log("!!! here in annotation script", tabId, annotations)

  var l: HTMLLinkElement = document.createElement('link');
  l.setAttribute("href", chrome.runtime.getURL('www/css/ts-content-script.css'))
  l.setAttribute("rel", "stylesheet")
  document.head.appendChild(l)

  var s = document.createElement('script');
  //s.type = "module"
  s.src = chrome.runtime.getURL('www/js/rangy/rangy.js');
  s.setAttribute("type", 'text/javascript');
  //s.src = "https://cdn.jsdelivr.net/npm/rangy@1.3.1/lib/rangy-core.min.js";
  document.body.appendChild(s);

  // var s3 = document.createElement('script');
  // s3.dataset.id = 'tabsets-rangy-annotation-data';
  // s3.dataset.annotations = JSON.stringify(annotations);
  // (document.head || document.documentElement).appendChild(s3);

}

function inIgnoredMessages(request: any) {
  // TODO name vs. msg!
  return request.name === 'progress-indicator' ||
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
    request.name === 'fullUrls-changed' ||
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
    request.action === 'highlight-annotation'
  //request.name === 'recogito-annotation-created'

}

function runOnNotificationClick(notificationId: string, buttonIndex: number) {
  console.log("notification button clicked", notificationId, buttonIndex)
  const notification = useSuggestionsStore().getSuggestion(notificationId)
  console.log("found notificastion", notification)
  if (notification) {
    switch (buttonIndex) {
      case 0: // show
        const url = chrome.runtime.getURL('www/index.html') + "#/mainpanel/suggestions/" + notificationId
        NavigationService.openOrCreateTab([url])
        useSuggestionsStore().updateSuggestionState(notificationId, SuggestionState.CHECKED)
        break;
      default: // ignore
        useSuggestionsStore().updateSuggestionState(notificationId, SuggestionState.IGNORED)
    }
  }
}

class ChromeListeners {

  inProgress = false;

  thumbnailsActive = true

  throttleOnePerSecond = throttledQueue(1, 1000, true)

  private onCreatedListener = (tab: chrome.tabs.Tab) => this.onCreated(tab)
  private onUpdatedListener = (number: number, info: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => this.onUpdated(number, info, tab)
  private onMovedListener = (number: number, info: chrome.tabs.TabMoveInfo) => this.onMoved(number, info)
  private onRemovedListener = (number: number, info: chrome.tabs.TabRemoveInfo) => this.onRemoved(number, info)
  private onReplacedListener = (n1: number, n2: number) => this.onReplaced(n1, n2)
  private onActivatedListener = (info: chrome.tabs.TabActiveInfo) => this.onActivated(info)
  private onAttachedListener = (number: number, info: chrome.tabs.TabAttachInfo) => this.onAttached(number, info)
  private onDetachedListener = (number: number, info: chrome.tabs.TabDetachInfo) => this.onDetached(number, info)
  private onHighlightedListener = (info: chrome.tabs.TabHighlightInfo) => this.onHighlighted(info)
  private onMessageListener = (request: any, sender: chrome.runtime.MessageSender, sendResponse: any) => this.onMessage(request, sender, sendResponse)
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
        console.log(`unknown Command: ${command}`);
        break
    }
  }

  async initListeners() {

    if (process.env.MODE === 'bex') {

      console.debug(" ...initializing chrome tab listeners")

      chrome.runtime.setUninstallURL("https://tabsets.web.app/#/uninstall")

      await setCurrentTab()

      chrome.tabs.onCreated.addListener(this.onCreatedListener)
      chrome.tabs.onUpdated.addListener(this.onUpdatedListener)
      chrome.tabs.onMoved.addListener(this.onMovedListener)
      chrome.tabs.onRemoved.addListener(this.onRemovedListener)
      chrome.tabs.onReplaced.addListener(this.onReplacedListener)
      chrome.tabs.onActivated.addListener(this.onActivatedListener)
      chrome.tabs.onAttached.addListener(this.onAttachedListener)
      chrome.tabs.onDetached.addListener(this.onDetachedListener)
      chrome.tabs.onHighlighted.addListener(this.onHighlightedListener)
      //chrome.tabs.onZoomChange.addListener((info) => this.onZoomChange(info))

      chrome.runtime.onMessage.addListener(this.onMessageListener)

      // seems to belong in background.ts
      // chrome.runtime.onInstalled.addListener((callback) => {
      //   console.log("ga: fire event install", callback.previousVersion, callback.reason)
      //   Analytics.fireEvent('install-' + callback.reason);
      //   if (callback.reason == OnInstalledReason.INSTALL) {
      //     chrome.tabs.create({
      //       active: true,
      //       url: "https://tabsets.web.app/#/updatedTo/" + callback.previousVersion
      //     })
      //   }
      // });

      chrome.commands.onCommand.addListener(this.onCommandListener);

      // TODO removed listeners as well?
      if (useFeaturesStore().hasFeature(FeatureIdent.NOTIFICATIONS)) {
        chrome.notifications.onButtonClicked.addListener(
          (notificationId, buttonIndex) => {
            runOnNotificationClick(notificationId, buttonIndex);
          })
        chrome.notifications.onClicked.addListener(
          (notificationId) => {
            runOnNotificationClick(notificationId, 0);
          })
      }
    }

    // https://stackoverflow.com/questions/77089404/chrom-extension-close-event-not-available-on-sidepanel-closure
    if (inBexMode() && chrome && chrome.runtime) {
      chrome.runtime.connect({name: 'tabsetsSidepanel'});
    }

  }

  async resetListeners() {
    console.log(" ...resetting listeners (after re-initialization)")
    chrome.tabs.onCreated.removeListener(this.onCreatedListener)
    chrome.tabs.onUpdated.removeListener(this.onUpdatedListener)
    chrome.tabs.onMoved.removeListener(this.onMovedListener)
    chrome.tabs.onRemoved.removeListener(this.onRemovedListener)
    chrome.tabs.onReplaced.removeListener(this.onReplacedListener)
    chrome.tabs.onActivated.removeListener(this.onActivatedListener)
    chrome.tabs.onAttached.removeListener(this.onAttachedListener)
    chrome.tabs.onDetached.removeListener(this.onDetachedListener)
    chrome.tabs.onHighlighted.removeListener(this.onHighlightedListener)
    chrome.runtime.onMessage.removeListener(this.onMessageListener)
    chrome.commands.onCommand.removeListener(this.onCommandListener);
  }

  clearWorking() {
    if (this.inProgress) {
      useTabsStore2().loadTabs('onProgressStopped')
    }
    this.inProgress = false
  }

  intervalID = setInterval(() => this.clearWorking(), 5000);

  eventTriggered() {
    this.inProgress = true
  }

  createThumbnails(b: boolean) {
    console.log("thumbnails active set to ", b)
    this.thumbnailsActive = b
  }

  onCreated(tab: chrome.tabs.Tab) {
    // if (!useTabsStore().listenersOn) {
    //   console.debug(`onCreated: tab ${tab.id}: >>> listeners off, returning <<<`)
    //   return
    // }
    this.eventTriggered()
    console.debug(`onCreated: tab ${tab.id}: >>> ${tab.pendingUrl}`, tab)
    //sendMsg('window-updated', {initiated: "ChromeListeners#onCreated"})

    let foundSession = false
    _.forEach([...useTabsetsStore().tabsets.values()] as Tabset[], (ts: Tabset) => {
      if (ts.type === TabsetType.SESSION) {
        foundSession = true
        console.debug("pushing to", ts.id, tab)
        ts.tabs.push(new Tab(uid(), tab))
      }
    })
    if (!foundSession) {
      console.debug("pushing to pending", tab)
      //tabsStore.pendingTabset.tabs.push(new Tab(uid(), tab))
    }
  }

  async onUpdated(number: number, info: chrome.tabs.TabChangeInfo, chromeTab: chrome.tabs.Tab) {
    if (info.url) {
      if (this.checkOriginForEmailLink(info.url)) {
        const split = info.url.split("?")
        const authRequest = split[1]
        console.log("authRequest received on", window.location.href)
        //const newLocation = window.location + "?" + authRequest
        //console.log("%cnewLocation", "color:green",newLocation)
        //window.location.href = newLocation
        useAuthStore().setAuthRequest(authRequest)
      }
    }


    // if (!useTabsStore().listenersOn) {
    //   console.debug(`onUpdated:   tab ${number}: >>> listeners off, returning <<<`)
    //   return
    // }

    // set current chrome tab in tabsStore
    await setCurrentTab()

    const selfUrl = chrome.runtime.getURL("")
    if (chromeTab.url?.startsWith(selfUrl)) {
      console.debug(`onUpdated:   tab ${number}: >>> .url starts with '${selfUrl}' <<<`)
      return
    }

    this.eventTriggered()

    if (!info.status || (Object.keys(info).length > 1)) {
      console.debug(`onUpdated:   tab ${number}: >>> ${JSON.stringify(info)} <<<`)

      // handle pending Tabset
      //this.handleUpdate(tabsStore.pendingTabset as Tabset, chromeTab)
      this.handleUpdateInjectScripts(info, chromeTab)

      // handle existing tabs
      if (useFeaturesStore().hasFeature(FeatureIdent.TAB_GROUPS)) {
        const matchingTabs = useTabsetsStore().tabsForUrl(chromeTab.url || '')
        for (const t of matchingTabs) {
          // we care only about actually setting a group, not about removal
          if (info.groupId && info.groupId >= 0) {
            console.log(" --- updating existing tabs for url: ", chromeTab.url, t, info)
            t.groupId = info.groupId
            t.groupName = useGroupsStore().currentGroupForId(info.groupId)?.title || '???'
            t.updated = new Date().getTime()
            const tabset = useTabsetsStore().tabsetFor(t.id)
            if (tabset) {
              await useTabsetService().saveTabset(tabset)
            }
          }
        }
      }

      // handle sessions
      let foundSession = false
      _.forEach([...useTabsetsStore().tabsets.values()] as Tabset[], (ts: Tabset) => {
        if (ts.type === TabsetType.SESSION) {
          foundSession = true
          this.handleUpdate(ts, chromeTab)
        }
      })

      // handle windowsStore related pages
      //sendMsg('window-updated', {initiated: "ChromeListeners#onUpdated"})
    }
  }

  /**
   *
   * @param tabset: usually the "pendingTabset", or any one which is a session
   * @param tab
   * @private
   */
  private handleUpdate(tabset: Tabset, tab: chrome.tabs.Tab) {
    // find tab which was created by "onCreate" moments ago
    const index = _.findIndex(tabset?.tabs, t => t.chromeTabId === tab.id);
    if (index >= 0) {
      const existingPendingTab = tabset.tabs[index]
      const updatedTab = new Tab(uid(), tab)

      //console.log("updatedTab A", updatedTab)

      // (chrome) Group
      //console.log("updating updatedTab group for group id", updatedTab.groupId)
      updatedTab.groupName = useGroupsStore().currentGroupForId(updatedTab.groupId)?.title || '?' + updatedTab.groupId + '?'
      //console.log("group set to", updatedTab.groupName)

      updatedTab.setHistoryFrom(existingPendingTab)
      if (existingPendingTab.url !== updatedTab.url && existingPendingTab.url !== 'chrome://newtab/') {
        if (existingPendingTab.url) {
          updatedTab.addToHistory(existingPendingTab.url)
        }
      }
      const urlExistsAlready = _.filter(tabset.tabs, pT => pT.url === tab.url).length >= 2
      if (urlExistsAlready) {
        tabset.tabs.splice(index, 1);
        //console.log("Tabset spliced", tabset.tabs)
      } else {
        tabset.tabs.splice(index, 1, updatedTab);
        //console.log("Tabset spliced and deleted", tabset.tabs)
      }

    } else {
      console.debug(`onUpdated: tab ${tab.id}: pending tab cannot be found in ${tabset.name}`)
      if (tab.url !== undefined) {

        const newTab = new Tab(uid(), tab)

        // (chrome) Group
        if (tab.groupId >= 0) {
          console.log("updating updatedTab group for group id", tab.groupId)
          //newTab.group = useGroupsStore().groupForId(tab.groupId)
          //const g = await browser.tabGroups.get(tab.groupId)

          newTab.groupName = useGroupsStore().currentGroupForId(tab.groupId)?.title || '???'
        }

        console.debug(`onUpdated: tab ${tab.id}: missing tab added for url ${tab.url}`)
        tabset.tabs.push(newTab)
      }
    }
  }

  private handleUpdateInjectScripts(info: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
    // TODO ignoring urls !?
    // if (this.ignoreUrl(tab, info)) {
    //   return
    // }
    if (info.status !== "loading") {
      return
    }
    if (!tab.id) {
      return
    }

    if (tab.url && tab.url.startsWith("https://shared.tabsets.net")) {
      return
    }

    if (useFeaturesStore().hasFeature(FeatureIdent.ANNOTATIONS)) {
      const tabForUrl = useTabsetsStore().tabForUrlInSelectedTabset(tab.url || '')
      console.log("about to run annotationScript...", tabForUrl)
      if (tabForUrl) {
        chrome.scripting.executeScript({
          target: {tabId: (tab.id || 0)},
          func: annotationScript,
          args: [tabForUrl.id, tabForUrl.annotations],
        })
          .then(() => console.log("injected a function"));
      }
    }

    const scripts: string[] = []

    //if (useFeaturesStore().hasFeature(FeatureIdent.THUMBNAILS)) {
    scripts.push("content-script-thumbnails.js")
    //}
    if (useFeaturesStore().hasFeature(FeatureIdent.TAB_HELPER)) {
      scripts.push("content-script-tab-helper.js")
    }
    if (useFeaturesStore().hasFeature(FeatureIdent.ANNOTATIONS)) {
      scripts.push("highlight-annotations.js")
    }
    scripts.push("content-script.js")
    //scripts.push("recogito2.js")
    scripts.push("tabsets-content-script.js")
    if (scripts.length > 0 && tab.id !== null) { // && !this.injectedScripts.get(.chromeTabId)) {

      chrome.tabs.get(tab.id, (chromeTab: chrome.tabs.Tab) => {
        if (chrome.runtime.lastError) {
          console.warn("got runtime error:" + chrome.runtime.lastError);
        }
        if (!tab.url?.startsWith("chrome")) {
          scripts.forEach((script: string) => {
            //console.debug("executing scripts", tab.id, script)


            // @ts-ignore
            chrome.scripting.executeScript({
              target: {tabId: tab.id || 0, allFrames: false},
              files: [script] //["tabsets-content-script.js","content-script-thumbnails.js"],
            }, (callback: any) => {
              if (chrome.runtime.lastError) {
                console.warn("could not execute script: " + chrome.runtime.lastError.message, info.url);
              }
            });
          })
        }
      })
    }
  }

  onRemoved(number: number, info: chrome.tabs.TabRemoveInfo) {
    this.eventTriggered()
    console.debug("onRemoved tab event: ", number, info)
    //useWindowsStore().refreshCurrentWindows()
    useWindowsStore().refreshTabsetWindow(info.windowId)
    //sendMsg('window-updated', {initiated: "ChromeListeners#onRemoved"})
  }

  onReplaced(n1: number, n2: number) {
    console.log(`onReplaced: tab ${n1} replaced with ${n2}`)
    useTabsStore2().loadTabs('onReplaced');
  }

  async onActivated(info: chrome.tabs.TabActiveInfo) {
    this.eventTriggered()
    console.debug(`onActivated: tab ${info.tabId} activated: >>> ${JSON.stringify(info)}`)

    await setCurrentTab()

    chrome.tabs.get(info.tabId, tab => {
      if (chrome.runtime.lastError) {
        console.warn("got runtime error:" + chrome.runtime.lastError);
      }
      const url = tab.url
      _.forEach([...useTabsetsStore().tabsets.keys()], key => {
        const ts = useTabsetsStore().tabsets.get(key)
        if (ts && ts.status !== TabsetStatus.DELETED) {
          // increasing hit count
          const hits = _.filter(ts.tabs, (t: Tab) => t.url === url) as Tab[]
          let hit = false
          _.forEach(hits, h => {
            h.activatedCount = 1 + h.activatedCount
            h.lastActive = new Date().getTime()
            hit = true
          })
          if (hit) {
            console.debug("saving tabset on activated", ts.name)
            saveTabset(ts as Tabset)
          }
        }
      })
    })
  }

  onMoved(number: number, info: chrome.tabs.TabMoveInfo) {
    this.eventTriggered()
    console.debug(`onMoved: tab ${number} moved: ${JSON.stringify(info)}`)
    useTabsStore2().loadTabs('onMoved');
  }

  onAttached(number: number, info: chrome.tabs.TabAttachInfo) {
    console.debug(`onAttached: tab ${number} attached: ${JSON.stringify(info)}`)
  }

  onDetached(number: number, info: chrome.tabs.TabDetachInfo) {
    console.debug(`onDetached: tab ${number} detached: ${JSON.stringify(info)}`)
  }

  onHighlighted(info: chrome.tabs.TabHighlightInfo) {
    console.debug(`onHighlighted: tab ${info.tabIds} highlighted: ${JSON.stringify(info)}`)
  }

  onZoomChange(info: chrome.tabs.ZoomChangeInfo) {
    //console.log(`onZoomChange: tab ${info.tabId} zoom change: ${JSON.stringify(info)}`)
  }

  onMessage(request: any, sender: chrome.runtime.MessageSender, sendResponse: any) {
    if (inIgnoredMessages(request)) {
      return true
    }
    console.debug(" <<< got message in ChromeListeners", request)
    if (request.msg === 'captureThumbnail') {
      // moved to thumbnailsService
    } else if (request.msg === 'html2text') {
      this.handleHtml2Text(request, sender, sendResponse)
    } else if (request.msg === 'html2links') {
      this.handleHtml2Links(request, sender, sendResponse)
    } else if (request.msg === 'addTabToTabset') {
      this.handleAddTabToTabset(request, sender, sendResponse)
    } else if (request.msg === 'captureClipping') {
      this.handleCaptureClipping(request, sender, sendResponse)
    } else if (request.msg === 'capture-annotation') {
      this.handleCaptureAnnotation(request, sender, sendResponse)
      // } else if (request.msg === 'websiteQuote') {
      //   this.handleMessageWebsiteQuote(request, sender, sendResponse)
    } else if (request.msg === 'websiteImg') {
      this.handleMessageWebsiteImage(request, sender, sendResponse)
      // } else if (request.name === 'recogito-annotation-created') {
      //   //this.handleMessageWebsiteImage(request, sender, sendResponse)
      //   useTabsetService().handleAnnotationMessage(request)
    } else if (request.name === 'sidepanel-switch-view') {
      useUiStore().sidePanelSetActiveView(SidePanelView.MAIN)
    } else {
      console.log("got unknown message", request)
    }
    return true;
  }

  private handleHtml2Text(request: any, sender: chrome.runtime.MessageSender, sendResponse: any) {

    console.debug("handleHtml2Text", request.html?.length)

    if (sender && sender.url && request.html) {
      try {
        const hostname = new URL(sender.url).hostname
        new Extractors().getExtractors().forEach((e: Extractor) => {
          if (hostname.indexOf(e.hostnameMatch) >= 0) {
            console.log("matched", hostname, e.hostnameMatch)
            let candidate = ""
            switch (e.type) {
              case ExtractorType.REGEX:
                const matches = request.html.matchAll(e.regex)
                for (const match of matches) {
                  //console.log("found desc", match[1])
                  candidate = match[1].replace("\n", "<br>")
                }
                break;
              case ExtractorType.HTML_SELECTOR:
                // const doc = request.html
                const domParser = new DOMParser()
                const doc = domParser.parseFromString(request.html, "text/html")
                console.log("doc", typeof doc)
                if (e.selector) {
                  const selection =
                    doc.querySelector(e.selector)
                  console.log("selection", e.target.toString(), selection?.outerHTML)
                  candidate = selection?.outerHTML || ''
                } else {
                  console.log("could not find ", e.selector)
                }
                break;
              default:
                break;
            }
            if (candidate.length > 0) {
              request.metas[e.target.toString()] = sanitize(candidate)
            }
          }
        })
      } catch (err) {
        console.log("error", err)
      }
    }

    if (sender.tab) {
      const tokens = ContentUtils.html2tokens(request.html)
      const tab = new Tab(uid(), sender.tab)
      saveText(tab, [...tokens].join(" "), request.metas)
    }
    sendResponse({html2text: 'done'});
  }

  private handleHtml2Links(request: any, sender: chrome.runtime.MessageSender, sendResponse: any) {
    if (sender.tab) {
      console.debug("handleHtml2Links")
      saveMetaLinksFor(sender.tab, request.links)
      saveLinksFor(sender.tab, request.anchors)

      if (useFeaturesStore().hasFeature(FeatureIdent.RSS)) {
        request.links.forEach((metaLink: MetaLink) => {
          if ("application/rss+xml" === metaLink.type) {
            console.log("hier!!!", metaLink)
            useSuggestionsStore().addSuggestion(new Suggestion(uid(), metaLink.title || 'Found RSS Feed', "An RSS Link was found in one of your tabs", metaLink.href, SuggestionType.RSS))
          }
        })
      }
    }
    sendResponse({html2links: 'done'});
  }

  private handleAddTabToTabset(request: any, sender: chrome.runtime.MessageSender, sendResponse: any) {
    console.log("handleAddTabToTabset", request, sender)
    if (sender.tab) {
      this.addToTabset(request.tabsetId, new Tab(uid(), sender.tab))
    }
    sendResponse({addTabToCurrent: 'done'});
  }

  private ignoreUrl(tab: Tab, info: chrome.tabs.TabChangeInfo) {
    return (tab.url?.startsWith("chrome")) ||
      (tab.url?.startsWith("about")) ||
      info.url?.startsWith("chrome") ||
      info.url?.startsWith("about") ||
      info.url?.startsWith("https://skysail.eu.auth0.com/")
  }

  private capture(request: any) {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      chrome.tabs.captureVisibleTab(null, {format: 'png'}, dataUrl => {
        const lastError = chrome.runtime.lastError;
        if (lastError) {
          return reject(lastError);
        }

        if (!request) {
          return fetch(dataUrl).then(r => r.blob()).then(resolve, reject);
        }

        const left = request.left * request.dpr;
        const top = request.top * request.dpr;
        const width = request.width * request.dpr;
        const height = request.height * request.dpr;

        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d');

        fetch(dataUrl).then(r => r.blob()).then(async blob => {
          // const prefs = await new Promise(resolve => chrome.storage.local.get({
          //   quality: 0.95
          // }, resolve));

          const img = await createImageBitmap(blob);

          if (width && height) {
            // @ts-ignore
            ctx.drawImage(img, left, top, width, height, 0, 0, width, height);
          } else {
            // @ts-ignore
            ctx.drawImage(img, 0, 0);
          }
          // @ts-ignore
          resolve(await canvas.convertToBlob({
            type: 'image/png',
            quality: 0.95 //prefs.quality
          }));
        }).catch(reject);
      });
    });
  }

  private async handleCaptureClipping(request: any, sender: chrome.runtime.MessageSender, sendResponse: any) {
    console.log("handleCaptureClipping", request, sender, request.tabsetId)

    const blob = await this.capture(request)
    const currentTS = useTabsetsStore().getCurrentTabset

    if (sender.tab && currentTS) {
      console.log("blob", blob)
      const blobId = await useTabsetService().saveBlob(sender.tab, blob as unknown as Blob)

      const newTab = new Tab(uid(), sender.tab)
      newTab.image = "blob://" + blobId
      console.log("newTab", newTab)
      this.addToTabset(currentTS.id, newTab)
    }

    sendResponse({addTabToCurrent: 'done'});
  }

  private async handleCaptureAnnotation(request: any, sender: chrome.runtime.MessageSender, sendResponse: any) {
    console.log("handleCaptureAnnotation", request, sender, request.tabsetId)
    const currentTS = useTabsetsStore().getCurrentTabset
    if (sender.tab && currentTS) {
      const url = sender.tab.url || ''
      const t = _.find(currentTS.tabs, t => t.url === url)
      if (!t) {
        sendResponse({error: 'could not find tab for url ' + url})
        return
      }
      if (!t.annotations) {
        t.annotations = []
      }
      t.annotations.push(new HTMLSelection(request.text, request.range))
      useTabsetService().saveCurrentTabset()
      sendResponse({capturedAnnotation: 'done'});
      return
    }
    sendResponse({error: 'no tab or current tabset provided'})
  }

  private async handleMessageWebsiteImage(request: any, sender: chrome.runtime.MessageSender, sendResponse: any) {
    const currentTS = useTabsetsStore().getCurrentTabset
    if (sender.tab && currentTS) {
      console.log("request", request)
      const newTab = new Tab(uid(), sender.tab)
      newTab.image = request.img
      console.log("newTab with image", newTab)
      this.addToTabset(currentTS.id, newTab)
    }
    sendResponse({websiteImg: 'done'});
  }

  private addToTabset(currentTSId: string, newTab: Tab) {
    console.log("addToTabset", currentTSId, newTab)
    addToTabsetId(currentTSId, newTab)
      .then(() => {
        const ts = useTabsetsStore().getTabset(currentTSId)
        if (ts) {
          useTabsetService().saveTabset(ts)
        }
      })
      .then(() => {
        chrome.notifications.create(
          {
            title: "Tabset Extension Message",
            type: "basic",
            //iconUrl: "chrome-extension://" + selfId + "/www/favicon.ico",
            iconUrl: chrome.runtime.getURL("www/favicon.ico"),
            message: "the tab has been created successfully"
          }
        )
      })
      .catch((err: any) => {
        console.log("catching rejection", err)
        chrome.notifications.create(
          {
            title: "Tabset Extension Message",
            type: "basic",
            //iconUrl: "chrome-extension://" + selfId + "/www/favicon.ico",
            iconUrl: chrome.runtime.getURL("www/favicon.ico"),
            message: "tab could not be added: " + err
          }
        )

      })
  }

  private checkOriginForEmailLink(url: string) {
    try {
      const theUrl = new URL(url)
      const urlOrigin = theUrl.origin;
      //console.log("theURL", theUrl)
      const res = urlOrigin === EMAIL_LINK_REDIRECT_DOMAIN || urlOrigin === "http://localhost:9000"
      if (res) {
        //console.log("checking: origin ok")
        const params = theUrl.searchParams
        if (!params.has("apiKey") || !params.has("oobCode") || !params.has("mode")) {
          //console.log("checking: missing key", params)
          return false
        }
        if (!params.get("apiKey")?.startsWith("AIzaS") || params.get("mode") !== "signIn") {
          //console.log("checking: wrong key", params.get("apiKey"))
          //console.log("checking: wrong key", params.get("mode"))
          return false
        }
        console.log("%cfound email authorization link @", "border:1px solid green", url)
        return true
      }
      return false
    } catch (err) {
      console.log("could not check url for auth link", url)
    }
  }
}

export default new ChromeListeners();

