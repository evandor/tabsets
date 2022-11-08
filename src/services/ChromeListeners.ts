import {Tabset} from "src/models/Tabset";
import TabsetService from "src/services/TabsetService";
import {useTabsStore} from "src/stores/tabsStore";
import _ from "lodash";
import {Tab} from "src/models/Tab";
import {uid} from "quasar";
import throttledQueue from 'throttled-queue';

// @ts-ignore
import {convert} from "html-to-text"
import ChromeApi from "src/services/ChromeApi";
import {useWindowsStore} from "src/stores/windowsStores";

class ChromeListeners {

  inProgress = false;

  thumbnailsActive = true

  throttleOnePerSecond = throttledQueue(1, 1000, true)

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
    const tabsStore = useTabsStore()
    console.log(`onCreated: tab ${tab.id}: >>> ${tab.pendingUrl}`)
    const maybeTab = tabsStore.tabForUrlInSelectedTabset(tab.pendingUrl || '')
    if (maybeTab) {
      console.log(`onCreated: tab ${tab.id}: updating existing chromeTab.id: ${maybeTab.chromeTab.id} -> ${tab.id}`)
      maybeTab.chromeTab.id = tab.id
      maybeTab.chromeTab.windowId = tab.windowId
      TabsetService.saveCurrentTabset()
      return
    }
    tabsStore.pendingTabset.tabs.push(new Tab(uid(), tab))
  }

  onUpdated(number: number, info: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
    if (!useTabsStore().listenersOn) {
      return
    }
    this.eventTriggered()
    const tabsStore = useTabsStore()

    if (!info.status || (Object.keys(info).length > 1)) {
      console.debug(`onUpdated:   tab ${number}: >>> ${JSON.stringify(info)} <<<`)
      const maybeTab = tabsStore.tabForUrlInSelectedTabset(tab.url || '')
      if (maybeTab) {
        console.debug(`onUpdated:   tab ${number}: in selected Tabset, returning`)
        return
      }
      const index = _.findIndex(tabsStore.pendingTabset?.tabs, t => t.chromeTab.id === tab.id);

      if (index >= 0) {
        if (!this.isIgnored(tab)) {
          const existingTab = tabsStore.pendingTabset.tabs[index]
          const updatedTab = new Tab(uid(), tab)
          if (existingTab.chromeTab.url !== updatedTab.chromeTab.url && existingTab.chromeTab.url !== 'chrome://newtab/') {
            console.log(`onUpdated:   tab ${number}:     updating tab url ${updatedTab.chromeTab.url}`)
            updatedTab.setHistoryFrom(existingTab)
            if (existingTab.chromeTab.url) {
              updatedTab.addToHistory(existingTab.chromeTab.url)
            }
          }
          tabsStore.pendingTabset.tabs.splice(index, 1, updatedTab);
          // reload tabs (to be sure?!)
          if (!this.inProgress) {
            tabsStore.loadTabs('onUpdated');
          }
        } else {
          tabsStore.pendingTabset.tabs.splice(index, 1)
        }
      } else {
        // realistic at all? onCreate creates the new tab, so we should be able to find it
        if (!tab.title?.startsWith("Tabset")) {
          if (!this.isIgnored(tab)) {
            const newTab = new Tab(uid(), tab)
            console.log(`onUpdated:   tab ${number}:     setting status CREATED`)
            tabsStore.pendingTabset.tabs.push(newTab)
            if (!this.inProgress) {
              tabsStore.loadTabs('onUpdated');
            }
          }
        }
      }
    }
  }

  onRemoved(number: number, info: chrome.tabs.TabRemoveInfo) {
    this.eventTriggered()
    const tabsStore = useTabsStore()
    console.log(`onRemoved: tab ${number}: >>> ${JSON.stringify(info)}`)
    const currentTabset: Tabset = tabsStore.tabsets.get(tabsStore.currentTabsetId) || new Tabset("", "", [], [])
    const index = _.findIndex(currentTabset.tabs, t => t.chromeTab.id === number);
    if (index >= 0) {
      console.log(`onRemoved: tab ${number}:     found index ${index}`)
      const updatedTab = currentTabset.tabs.at(index)
      if (updatedTab) {
        console.log(`onRemoved: tab ${number}:     setting status DELETED`)
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
          TabsetService.saveTabset(ts)
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
      // } else if (request.msg === 'htmlmeta') {
      //   this.handleMetaData(request, sender, sendResponse)
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
    const text2 = text.replace(/\[[^\]].*/g, '').replace('*','')
    //console.log("text2", text2)
    const tokens = text2
      .replaceAll("\\n", " ")
      .replaceAll("\n", " ")
      .replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>»«{}\[\]\\\/]/gi, ' ')
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
    //console.log("res", res)
    // console.log("tokenSet", tokenSet)
    // console.log("tokenSet", [...tokenSet].join(" "))
    TabsetService.saveText(sender.tab, [...tokenSet].join(" "), request.metas)
    sendResponse({html2text: 'done'});
  }

  private handleAddTabToTabset(request: any, sender: chrome.runtime.MessageSender, sendResponse: any) {
    console.log("sender", sender)
    console.log("request", request)
    if (sender.tab) {
      TabsetService.saveToTabsetId(request.tabsetId, new Tab(uid(), sender.tab))
        .then(() => {
          chrome.notifications.create(
            {
              title: "Tabset Extension Message",
              type: "basic",
              iconUrl: "chrome-extension://agphkldbejefifhmgpgmiphlnijklnol/www/favicon.ico",
              message: "the tab has been created successfully"
            }
          )
        })
        .catch((err:any) => {
          console.log("catching rejection", err)
          chrome.notifications.create(
            {
              title: "Tabset Extension Message",
              type: "basic",
              iconUrl: "chrome-extension://agphkldbejefifhmgpgmiphlnijklnol/www/favicon.ico",
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
      const selfId = localStorage.getItem("selfId")
      if (current && current.url && selfId && current.url.indexOf(selfId) >= 0) {
        return // no screenshot of extension itself
      }
      console.log("capturing tab...", current.url, selfId)
      setTimeout(() => {
        chrome.tabs.captureVisibleTab(
          windowId,
          {},
          function (dataUrl) {
            if (dataUrl === undefined) {
              return
            }
            //console.log("capturing thumbnail for ", sender.tab?.id, Math.round(dataUrl.length / 1024) + "kB")

            let img = new Image()
            img.src = dataUrl
            img.onload = () => {
              let canvas = document.createElement('canvas')
              let width = img.width
              let height = img.height
              console.log("original width/height", img.width, img.height)
              const MAX_WIDTH = 265 * 1.3
              const MAX_HEIGHT = 200 * 1.3

              if (width > height) {
                if (width > MAX_WIDTH) {
                  height *= MAX_WIDTH / width
                  height = Math.round(height)
                  width = MAX_WIDTH
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width *= MAX_HEIGHT / height
                  width = Math.round(width)
                  height = MAX_HEIGHT
                }
              }
              let ctx = canvas.getContext('2d')
              // @ts-ignore
              ctx.drawImage(img, 0, 0, width, height)
              //resolve(canvas.toDataURL()) // this will return base64 image results after resize

              console.log(`capturing ${width}x${height} thumbnail for ${sender.tab?.id}, ${Math.round(canvas.toDataURL().length / 1024)}kB`)
              TabsetService.saveThumbnailFor(sender.tab, canvas.toDataURL())
              sendResponse({imgSrc: dataUrl});

            }
          }
        );
      },1000 )

    })

  }
}

export default new ChromeListeners();

