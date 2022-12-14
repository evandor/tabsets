import {Tabset, TabsetType} from "src/models/Tabset";
//import TabsetService from "src/services/TabsetService";
import {useTabsStore} from "src/stores/tabsStore";
import _ from "lodash";
import {Tab} from "src/models/Tab";
import {uid} from "quasar";
import throttledQueue from 'throttled-queue';

// @ts-ignore
import {convert} from "html-to-text"
import ChromeApi from "src/services/ChromeApi";
import {useWindowsStore} from "src/stores/windowsStores";
import {useTabsetService} from "src/services/TabsetService2";
import {useFeatureTogglesStore} from "stores/featureTogglesStore";
import {useUiStore} from "stores/uiStore";
import {useSettingsStore} from "stores/settingsStore";
import {usePermissionsStore} from "stores/permissionsStore";
import ExpiringMap from "stores/ExpiringMap";

const {
  saveCurrentTabset,
  saveTabset,
  saveText,
  saveMetaLinksFor,
  saveLinksFor,
  saveToTabsetId,
  saveThumbnailFor
} = useTabsetService()

class ChromeListeners {

  inProgress = false;

  thumbnailsActive = true

  throttleOnePerSecond = throttledQueue(1, 1000, true)

  injectedScripts = new ExpiringMap<number>(10000)

  initListeners(isNewTabPage: boolean = false) {
    if (process.env.MODE === 'bex' && !isNewTabPage) {
      console.info("initializing chrome tab listeners")

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
      return
    }
    this.eventTriggered()
    console.log(`onCreated: tab ${tab.id}: >>> ${tab.pendingUrl}`)
    if (useFeatureTogglesStore().isEnabled('newTab') && useUiStore().tabsetIdForNewTab && tab.pendingUrl === 'chrome://newtab/') {
      // @ts-ignore
      chrome.tabs.update(tab.id, {
        url: chrome.runtime.getURL("www/index.html#/newtab")
      })
      return
    }
    const tabsStore = useTabsStore()
    const maybeTab = tabsStore.tabForUrlInSelectedTabset(tab.pendingUrl || '')
    if (maybeTab) {
      console.log(`onCreated: tab ${tab.id}: updating existing chromeTab.id: ${maybeTab.chromeTab.id} -> ${tab.id}`)
      maybeTab.chromeTab.id = tab.id
      maybeTab.chromeTab.windowId = tab.windowId
      saveCurrentTabset()
      return
    }

    let foundSession = false
    _.forEach([...tabsStore.tabsets.values()], (ts: Tabset) => {
      if (ts.type === TabsetType.SESSION) {
        foundSession = true
        //console.log("pushing to", ts.id, tab)
        ts.tabs.push(new Tab(uid(), tab))
      }
    })
    if (!foundSession) {
      //console.log("pushing to pending", tab)
      tabsStore.pendingTabset.tabs.push(new Tab(uid(), tab))
    }
  }

  onUpdated(number: number, info: chrome.tabs.TabChangeInfo, chromeTab: chrome.tabs.Tab) {
    if (!useTabsStore().listenersOn) {
      return
    }
    const selfUrl = chrome.runtime.getURL("")
    if (chromeTab.url?.startsWith(selfUrl)) {
      //console.log("ignoring selfturl2", selfUrl, chromeTab.url)
      return
    }

    this.eventTriggered()
    const tabsStore = useTabsStore()

    if (!info.status || (Object.keys(info).length > 1)) {
      console.debug(`onUpdated:   tab ${number}: >>> ${JSON.stringify(info)} <<<`)

      this.handleUpdate(tabsStore.pendingTabset as Tabset, chromeTab)

      if (usePermissionsStore().hasAllOrigins() && !chromeTab.url?.startsWith("chrome") && chromeTab.id) {

        if (!this.injectedScripts.get(chromeTab.id)) {
          console.log("executing script", chromeTab.id)
          // @ts-ignore
          chrome.scripting.executeScript({
            target: {tabId: chromeTab.id, allFrames: true},
            files: ["tabsets-content-script.js"],
          }, (callback: any) => console.debug("callback", callback));
          if (chromeTab.id) {
            this.injectedScripts.put(chromeTab.id, "tabsets-content-script.js")
          }
        }
      }

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
      if (!this.isIgnored(tab)) {
        const existingPendingTab = tabset.tabs[index]
        const updatedTab = new Tab(uid(), tab)
        if (existingPendingTab.chromeTab.url !== updatedTab.chromeTab.url && existingPendingTab.chromeTab.url !== 'chrome://newtab/') {
          updatedTab.setHistoryFrom(existingPendingTab)
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
        console.log("deleting ignored tab", tab)
        tabset.tabs.splice(index, 1)
      }
    } else {
      console.log(`onUpdated: tab ${tab.id}: ignoring, pending tab cannot be found in ${tabset.name}`)
    }
  }

  onRemoved(number: number, info: chrome.tabs.TabRemoveInfo) {
    this.eventTriggered()
    const tabsStore = useTabsStore()
    //console.log(`onRemoved: tab ${number}: >>> ${JSON.stringify(info)}`)
    const currentTabset: Tabset = tabsStore.tabsets.get(tabsStore.currentTabsetId) || new Tabset("", "", [], [])
    const index = _.findIndex(currentTabset.tabs, t => t.chromeTab.id === number);
    if (index >= 0) {
      //console.log(`onRemoved: tab ${number}:     found index ${index}`)
      const updatedTab = currentTabset.tabs.at(index)
      if (updatedTab) {
        //console.log(`onRemoved: tab ${number}:     setting status DELETED`)
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

    chrome.tabs.get(info.tabId, tab => {
      //console.log("got tab", tab)
      const url = tab.url
      _.forEach([...tabsStore.tabsets.keys()], key => {
        const ts = tabsStore.tabsets.get(key)
        if (ts) {
          const hits = _.filter(ts.tabs, (t: Tab) => t.chromeTab.url === url)
          _.forEach(hits, h => {
            h.activatedCount = 1 + h.activatedCount
            h.lastActive = new Date().getTime()
            console.debug(`onActivated: tab ${info.tabId}:updating hits`, h)
          })
          saveTabset(ts)
        }
      })
    })
    //new TabsetApi(this.localStorage).saveTabset(this.currentTabset)
  }

  onMoved(number: number, info: chrome.tabs.TabMoveInfo) {
    this.eventTriggered()
    const tabsStore = useTabsStore()

    console.log(`onMoved: tab ${number} moved: ${JSON.stringify(info)}`)
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
    if (request.msg === 'capture') {
      const screenShotWindow = useWindowsStore().screenshotWindow
      this.handleCapture(sender, screenShotWindow, sendResponse)
    } else if (request.msg === 'html2text') {
      this.handleHtml2Text(request, sender, sendResponse)
    } else if (request.msg === 'html2links') {
      this.handleHtml2Links(request, sender, sendResponse)
    } else if (request.msg === 'addTabToTabset') {
      this.handleAddTabToTabset(request, sender, sendResponse)
    } else {
      console.log("got unknown message", request.msg)
    }
    return true;
  }

  private isIgnored(tab: chrome.tabs.Tab) {
    const tabsStore = useTabsStore()
    const ignoreIndex = _.findIndex(tabsStore.ignoredTabset.tabs, (ignoredTab: Tab) => {
      if (ignoredTab.chromeTab.url && tab.url) {
        if (tab.url.startsWith(ignoredTab.chromeTab.url)) {
          console.log("ignoring tab with url", tab.url)
          return true
        }
      }
      return false
    })
    return ignoreIndex >= 0
  }

  private handleHtml2Text(request: any, sender: chrome.runtime.MessageSender, sendResponse: any) {
    const text = convert(request.html, {
      wordwrap: 130
    });
    const text2 = text.replace(/\[[^\]].*/g, '').replace('*', '')
    //console.log("text2", text2)
    const tokens = text2
      .replaceAll("\\n", " ")
      .replaceAll("\n", " ")
      .replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>????{}\[\]\\\/]/gi, ' ')
      .split(" ")
    //console.log("tokens", tokens)
    let res = ""
    const tokenSet = new Set()
    tokens.forEach((t: string) => {
      if (t.length >= 4) {
        res += t + " "
        tokenSet.add(t.toLowerCase())
      }
    })
    // console.log("res", res)
    saveText(sender.tab, [...tokenSet].join(" "), request.metas)
    sendResponse({html2text: 'done'});
  }

  private handleHtml2Links(request: any, sender: chrome.runtime.MessageSender, sendResponse: any) {
    if (sender.tab) {
      saveMetaLinksFor(sender.tab, request.links)
      saveLinksFor(sender.tab, request.anchors)
    }
    sendResponse({html2links: 'done'});
  }

  private handleAddTabToTabset(request: any, sender: chrome.runtime.MessageSender, sendResponse: any) {
    if (sender.tab) {

      saveToTabsetId(request.tabsetId, new Tab(uid(), sender.tab))
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
    sendResponse({addTabToCurrent: 'done'});
  }


  private handleCapture(sender: chrome.runtime.MessageSender, windowId: number, sendResponse: any) {
    if (!this.thumbnailsActive) {
      return
    }

    this.throttleOnePerSecond(async () => {
      const current = await ChromeApi.getCurrentTab()
      // const selfId = localStorage.getItem("selfId")
      const selfUrl = chrome.runtime.getURL("www/index.html")
     // console.log("selfurl", selfUrl)
      // if (current && current.url) {// && selfId && current.url.indexOf(selfId) >= 0) {
      //   return // no screenshot of extension itself
      // }
      //console.log("capturing tab...", current.url)
      const allUrlsPermission = usePermissionsStore().hasAllOrigins()
      //chrome.permissions.getAll((res) => console.log("res", res))
      if (allUrlsPermission) {
        setTimeout(async () => {
          const ctx = this
          if (windowId != null) {
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
            chrome.tabs.captureVisibleTab(
              {},
              function (dataUrl) {
                ctx.handleCaptureCallback(dataUrl, sender, sendResponse);
              }
            );
          }
          // // @ts-ignore
          // const windowExists = windowId != null ? await chrome.windows.get(windowId, {}) : null
          //
          // console.log("got possible window", windowExists)
          // // @ts-ignore
          // const useWindowId: number = windowExists ? windowId : await chrome.windows.getCurrent().id
          // console.log("got useWindowId", useWindowId)
          // const ctx = this
          // chrome.tabs.captureVisibleTab(
          //   useWindowId,
          //   {},
          //   function (dataUrl) {
          //     ctx.handleCaptureCallback(dataUrl, sender, sendResponse);
          //   }
          // );
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
}

export default new ChromeListeners();

