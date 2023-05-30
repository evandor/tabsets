import {Tabset, TabsetType} from "src/models/Tabset";
import {useTabsStore} from "src/stores/tabsStore";
import _ from "lodash";
import {Tab} from "src/models/Tab";
import {uid} from "quasar";
import throttledQueue from 'throttled-queue';
// @ts-ignore
import {convert} from "html-to-text"
import {useWindowsStore} from "src/stores/windowsStores";
import {useTabsetService} from "src/services/TabsetService2";
import {useSettingsStore} from "src/stores/settingsStore";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {MetaLink} from "src/models/MetaLink";
import {Suggestion, SuggestionType} from "src/models/Suggestion";
import {useSuggestionsStore} from "src/stores/suggestionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {Extractor, Extractors, ExtractorType} from "src/config/Extractors";
import {useUtils} from "src/services/Utils";

const {
  saveCurrentTabset,
  saveTabset,
  saveText,
  saveMetaLinksFor,
  saveLinksFor,
  addToTabsetId,
  saveThumbnailFor
} = useTabsetService()

const {sanitize} = useUtils()

function setCurrentTab() {
  chrome.tabs.query({active: true, lastFocusedWindow: true}, (tabs) => {
    if (tabs && tabs[0]) {
      useTabsStore().setCurrentChromeTab(tabs[0] as unknown as chrome.tabs.Tab)
    }
  });
}

class ChromeListeners {

  inProgress = false;

  thumbnailsActive = true

  throttleOnePerSecond = throttledQueue(1, 1000, true)

  injectedScripts: Map<number, string[]> = new Map()

  initListeners(isNewTabPage: boolean = false) {

    if (process.env.MODE === 'bex') {
      chrome.runtime.setUninstallURL("https://tabsets.web.app/#/uninstall")
    }
    if (process.env.MODE === 'bex' && !isNewTabPage) {
      console.debug("initializing chrome tab listeners")

      chrome.tabs.onCreated.addListener((tab: chrome.tabs.Tab) => this.onCreated(tab))
      chrome.tabs.onUpdated.addListener((number, info, tab) => this.onUpdated(number, info, tab))
      chrome.tabs.onMoved.addListener((number, info) => this.onMoved(number, info))
      chrome.tabs.onRemoved.addListener((number, info) => this.onRemoved(number, info))
      chrome.tabs.onReplaced.addListener((n1, n2) => this.onReplaced(n1, n2))
      chrome.tabs.onActivated.addListener((info) => this.onActivated(info))
      chrome.tabs.onAttached.addListener((number, info) => this.onAttached(number, info))
      chrome.tabs.onDetached.addListener((number, info) => this.onDetached(number, info))
      chrome.tabs.onHighlighted.addListener((info) => this.onHighlighted(info))
      chrome.tabs.onZoomChange.addListener((info) => this.onZoomChange(info))

      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => this.onMessage(request, sender, sendResponse))

      // @ts-ignore
      if (chrome.sidePanel) {
        // @ts-ignore
        chrome.sidePanel
          .setPanelBehavior({openPanelOnActionClick: true})
          .catch((error: any) => console.error(error));
      }
    }

  }

  clearWorking() {
    if (this.inProgress) {
      const tabsStore = useTabsStore()
      tabsStore.loadTabs('onProgressStopped')
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
    if (!useTabsStore().listenersOn) {
      console.debug(`onCreated: tab ${tab.id}: >>> listeners off, returning <<<`)
      return
    }
    this.eventTriggered()
    console.log(`onCreated: tab ${tab.id}: >>> ${tab.pendingUrl}`)
    const tabsStore = useTabsStore()

    let foundSession = false
    _.forEach([...tabsStore.tabsets.values()], (ts: Tabset) => {
      if (ts.type === TabsetType.SESSION) {
        foundSession = true
        console.debug("pushing to", ts.id, tab)
        ts.tabs.push(new Tab(uid(), tab))
      }
    })
    if (!foundSession) {
      console.debug("pushing to pending", tab)
      tabsStore.pendingTabset.tabs.push(new Tab(uid(), tab))
    }
  }

  onUpdated(number: number, info: chrome.tabs.TabChangeInfo, chromeTab: chrome.tabs.Tab) {
    if (!useTabsStore().listenersOn) {
      console.debug(`onUpdated:   tab ${number}: >>> listeners off, returning <<<`)
      return
    }

    // get current tab
    setCurrentTab()

    const selfUrl = chrome.runtime.getURL("")
    if (chromeTab.url?.startsWith(selfUrl)) {
      console.debug(`onUpdated:   tab ${number}: >>> chromeTab.url starts with '${selfUrl}' <<<`)
      return
    }

    this.eventTriggered()
    const tabsStore = useTabsStore()

    if (!info.status || (Object.keys(info).length > 1)) {
      console.debug(`onUpdated:   tab ${number}: >>> ${JSON.stringify(info)} <<<`)
      this.handleUpdate(tabsStore.pendingTabset as Tabset, chromeTab)
      this.handleUpdateInjectScripts(tabsStore.pendingTabset as Tabset, info, chromeTab)
      let foundSession = false
      _.forEach([...tabsStore.tabsets.values()], (ts: Tabset) => {
        if (ts.type === TabsetType.SESSION) {
          foundSession = true
          this.handleUpdate(ts, chromeTab)
        }
      })
    }
  }

  private handleUpdate(tabset: Tabset, tab: chrome.tabs.Tab) {
    // find tab which was created by "onCreate" moments ago
    const index = _.findIndex(tabset?.tabs, t => t.chromeTab.id === tab.id);
    if (index >= 0) {
      const existingPendingTab = tabset.tabs[index]
      const updatedTab = new Tab(uid(), tab)
      updatedTab.setHistoryFrom(existingPendingTab)
      if (existingPendingTab.chromeTab.url !== updatedTab.chromeTab.url && existingPendingTab.chromeTab.url !== 'chrome://newtab/') {
        if (existingPendingTab.chromeTab.url) {
          updatedTab.addToHistory(existingPendingTab.chromeTab.url)
        }
      }
      const urlExistsAlready = _.filter(tabset.tabs, pT => pT.chromeTab.url === tab.url).length >= 2
      if (urlExistsAlready) {
        tabset.tabs.splice(index, 1);
      } else {
        tabset.tabs.splice(index, 1, updatedTab);
      }

    } else {
      console.log(`onUpdated: tab ${tab.id}: pending tab cannot be found in ${tabset.name}`)
      if (tab.url !== undefined) {
        console.log(`onUpdated: tab ${tab.id}: missing tab added for url ${tab.url}`)
        tabset.tabs.push(new Tab(uid(), tab))
      }
    }
  }

  private handleUpdateInjectScripts(tabset: Tabset, info: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
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

    const scripts: string[] = []

    if (usePermissionsStore().hasFeature(FeatureIdent.THUMBNAILS)) {
      scripts.push("content-script-thumbnails.js")
    }
    scripts.push("content-script.js")
    scripts.push("tabsets-content-script.js")
    if (scripts.length > 0 && tab.id !== null) { // && !this.injectedScripts.get(chromeTab.id)) {

      chrome.tabs.get(tab.id, (chromeTab: chrome.tabs.Tab) => {
        console.log("got tab", tab)
        if (!tab.url?.startsWith("chrome")) {
          scripts.forEach((script: string) => {
            console.debug("executing scripts", tab.id, script)
            // @ts-ignore
            chrome.scripting.executeScript({
              target: {tabId: tab.id, allFrames: false},
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
    const tabsStore = useTabsStore()
    const currentTabset: Tabset = tabsStore.tabsets.get(tabsStore.currentTabsetId) || new Tabset("", "", [], [])
    const index = _.findIndex(currentTabset.tabs, t => t.chromeTab.id === number);
    if (index >= 0) {
      const updatedTab = currentTabset.tabs.at(index)
      if (updatedTab) {
      }
    }
  }

  onReplaced(n1: number, n2: number) {
    const tabsStore = useTabsStore()
    console.log(`onReplaced: tab ${n1} replaced with ${n2}`)
    tabsStore.loadTabs('onReplaced');
  }

  onActivated(info: chrome.tabs.TabActiveInfo) {
    this.eventTriggered()
    const tabsStore = useTabsStore()
    console.debug(`onActivated: tab ${info.tabId} activated: >>> ${JSON.stringify(info)}`)

    setCurrentTab()

    chrome.tabs.get(info.tabId, tab => {
      const url = tab.url
      _.forEach([...tabsStore.tabsets.keys()], key => {
        const ts = tabsStore.tabsets.get(key)
        if (ts) {
          const hits = _.filter(ts.tabs, (t: Tab) => t.chromeTab.url === url)
          let hit = false
          _.forEach(hits, h => {
            h.activatedCount = 1 + h.activatedCount
            h.lastActive = new Date().getTime()
            console.debug(`onActivated: tab ${info.tabId}:updating hits`, h)
            hit = true
          })
          if (hit) {
            console.debug("saving tabset on activated", ts.name)
            saveTabset(ts)
          }
        }
      })
    })
  }

  onMoved(number: number, info: chrome.tabs.TabMoveInfo) {
    this.eventTriggered()
    const tabsStore = useTabsStore()
    console.debug(`onMoved: tab ${number} moved: ${JSON.stringify(info)}`)
    tabsStore.loadTabs('onMoved');
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
    //console.log("handling request", request.msg)
    if (request.msg === 'captureThumbnail') {
      const screenShotWindow = useWindowsStore().screenshotWindow
      this.handleCapture(sender, screenShotWindow, sendResponse)
    } else if (request.msg === 'html2text') {
      this.handleHtml2Text(request, sender, sendResponse)
    } else if (request.msg === 'html2links') {
      this.handleHtml2Links(request, sender, sendResponse)
    } else if (request.msg === 'addTabToTabset') {
      this.handleAddTabToTabset(request, sender, sendResponse)
    } else if (request.msg === 'captureClipping') {
      this.handleCaptureClipping(request, sender, sendResponse)
    } else if (request.msg === 'websiteQuote') {
      this.handleMessageWebsiteQuote(request, sender, sendResponse)
    } else if (request.msg === 'websiteImg') {
      this.handleMessageWebsiteImage(request, sender, sendResponse)
    } else {
      console.log("got unknown message", request.msg)
    }
    return true;
  }

  private handleHtml2Text(request: any, sender: chrome.runtime.MessageSender, sendResponse: any) {

    console.log("handleHtml2Text")

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

    const text = convert(request.html, {
      wordwrap: 130
    });
    const text2 = text.replace(/\[[^\]].*/g, '').replaceAll('*', '')
    const tokens = text2
      .replaceAll("\\n", " ")
      .replaceAll("[0-9a-fA-F]{8}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{12}", " ")
      .replaceAll("[\u00AD\u002D\u2011]", ' ')
      .replaceAll("\n", " ")
      .replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>»«{}\[\]\\\/]/gi, ' ')
      .split(" ")
    let res = ""
    const tokenSet = new Set()
    tokens.forEach((t: string) => {
      if (t.length >= 4 && t.length <= 24) {
        res += t + " "
        tokenSet.add(t.toLowerCase())
      }
    })
    saveText(sender.tab, [...tokenSet].join(" "), request.metas)
    sendResponse({html2text: 'done'});
  }

  private handleHtml2Links(request: any, sender: chrome.runtime.MessageSender, sendResponse: any) {
    if (sender.tab) {
      saveMetaLinksFor(sender.tab, request.links)
      saveLinksFor(sender.tab, request.anchors)

      if (usePermissionsStore().hasFeature(FeatureIdent.RSS)) {
        request.links.forEach((metaLink: MetaLink) => {
          if ("application/rss+xml" === metaLink.type) {
            //console.log("hier!!!", metaLink)
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
    return (tab.chromeTab && tab.chromeTab.url?.startsWith("chrome")) ||
      (tab.chromeTab && tab.chromeTab?.url?.startsWith("about")) ||
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
    const currentTS = useTabsetService().getCurrentTabset()

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

  private async handleMessageWebsiteQuote(request: any, sender: chrome.runtime.MessageSender, sendResponse: any) {
    const currentTS = useTabsetService().getCurrentTabset()
    if (sender.tab && currentTS) {
      console.log("request", request.selection)
      const serialTx = request.selection
      // https://stackoverflow.com/questions/965968/serialize-internal-javascript-objects-like-range

      const newTab = new Tab(uid(), sender.tab)
      newTab.selection = serialTx
      console.log("newTab with selection", newTab)
      this.addToTabset(currentTS.id, newTab)
    }
    sendResponse({websiteQuote: 'done'});
  }

  private async handleMessageWebsiteImage(request: any, sender: chrome.runtime.MessageSender, sendResponse: any) {
    const currentTS = useTabsetService().getCurrentTabset()
    if (sender.tab && currentTS) {
      console.log("request", request)
      const newTab = new Tab(uid(), sender.tab)
      newTab.image = request.img
      console.log("newTab with selection", newTab)
      this.addToTabset(currentTS.id, newTab)
    }
    sendResponse({websiteImg: 'done'});
  }

  private handleCapture(sender: chrome.runtime.MessageSender, windowId: number, sendResponse: any) {

    if (!this.thumbnailsActive) {
      console.log("capturing thumbnail: not active")
      return
    }

    this.throttleOnePerSecond(async () => {
      console.log("capturing tab...")
      const allUrlsPermission = usePermissionsStore().hasAllOrigins()
      //chrome.permissions.getAll((res) => console.log("res", res))
      if (allUrlsPermission) {
        setTimeout(async () => {
          const ctx = this
          if (windowId != null) {
            console.log("capturing thumbnail", windowId)
            chrome.windows.get(windowId, {}, (w: chrome.windows.Window) => {
              if (chrome.runtime.lastError) {
                console.log("got error", chrome.runtime.lastError)
                useWindowsStore().screenshotWindow = null as unknown as number
                chrome.tabs.captureVisibleTab(
                  {},
                  function (dataUrl) {
                    ctx.handleCaptureCallback(dataUrl, sender, sendResponse);
                  }
                );
              } else {
                chrome.tabs.captureVisibleTab(
                  windowId,
                  {},
                  function (dataUrl) {
                    ctx.handleCaptureCallback(dataUrl, sender, sendResponse);
                  }
                );
              }
            })
          } else {
            console.log("capturing thumbnail for window", windowId)
            chrome.tabs.captureVisibleTab(
              {},
              function (dataUrl) {
                ctx.handleCaptureCallback(dataUrl, sender, sendResponse);
              }
            );
          }
        }, 1000)
      }

    })

  }

  private handleCaptureCallback(dataUrl: string, sender: chrome.runtime.MessageSender, sendResponse: any) {
    if (chrome.runtime.lastError) {
      console.log("got error", chrome.runtime.lastError)
      return
    }
    if (dataUrl === undefined) {
      return
    }
    //console.log("capturing thumbnail for ", sender.tab?.id, Math.round(dataUrl.length / 1024) + "kB")

    var img = new Image();

    // https://stackoverflow.com/questions/19262141/resize-image-with-javascript-canvas-smoothly
    img.onload = function () {

      // set size proportional to image
      //canvas.height = canvas.width * (img.height / img.width);

      var oc = document.createElement('canvas')
      var octx = oc.getContext('2d')

      let quality = useSettingsStore().thumbnailQuality as number
      oc.width = Math.round(img.width * 0.5 * quality / 100)
      oc.height = Math.round(img.height * 0.5 * quality / 100)
      // @ts-ignore
      octx.drawImage(img, 0, 0, oc.width, oc.height);

      //console.log(`capturing ${oc.width}x${oc.height} thumbnail for ${sender.tab?.id}, ${Math.round(oc.toDataURL().length / 1024)}kB`)
      saveThumbnailFor(sender.tab, oc.toDataURL())
      sendResponse({imgSrc: dataUrl});
    }
    img.src = dataUrl//"https://i.imgur.com/SHo6Fub.jpg";
  }

  private addToTabset(currentTSId: string, newTab: Tab) {
    addToTabsetId(currentTSId, newTab)
      .then(() => {
        const ts = useTabsetService().getTabset(currentTSId)
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
}

export default new ChromeListeners();

