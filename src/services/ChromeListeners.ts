import {Tabset} from "src/models/Tabset";
import TabsetService from "src/services/TabsetService";
import {useTabsStore} from "src/stores/tabsStore";
import _ from "lodash";
import {Tab, TabStatus} from "src/models/Tab";
import {uid} from "quasar";


class ChromeListeners {

  inProgress = false;

  clearWorking() {
    if (this.inProgress) {
      //console.log("resetting 'inProgress' to false")
      const tabsStore = useTabsStore()
      tabsStore.loadTabs('onProgressStopped')
    }
    this.inProgress = false
  }

  intervalID = setInterval(() => this.clearWorking(), 5000);

  eventTriggered() {
    this.inProgress = true
  }

  onCreated(tab: chrome.tabs.Tab) {
    this.eventTriggered()
    const tabsStore = useTabsStore()
    if (!tabsStore.active) {
      return
    }

    console.log(`onCreated: tab ${tab.id}: >>> ${tab.pendingUrl}`)
    const maybeTab = tabsStore.tabForUrlInContextTabset(tab.pendingUrl || '')
    if (maybeTab) {
      console.log(`onCreated: tab ${tab.id}: updating existing chromeTab.id: ${maybeTab.chromeTab.id} -> ${tab.id}`)
      maybeTab.chromeTab.id = tab.id
      return
    }
    // add to current tabset if not there yet
    // const currentTabset: Tabset = tabsStore.tabsets.get(tabsStore.currentTabsetId) || new Tabset("", "", [])
    // const found = _.find(currentTabset.tabs, t => t.chromeTab.url === tab.url)
    // if (!found) {
    //   const newTab = new Tab(uid(), tab)
    //   newTab.status = TabStatus.CREATED
    //   currentTabset.tabs.push(newTab)
    //   if (!this.inProgress) {
    //     tabsStore.loadTabs('onCreated');
    //   }
    // }
    tabsStore.pendingTabset.tabs.push(new Tab(uid(), tab))
  }

  onUpdated(number: number, info: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
    this.eventTriggered()
    const tabsStore = useTabsStore()
    if (!tabsStore.active) {
      return
    }
    if (!info.status || (Object.keys(info).length > 1)) {
      console.log(`onUpdated:   tab ${number}: >>> ${JSON.stringify(info)} <<<`)
      const currentTabset = tabsStore.tabsets.get(tabsStore.currentTabsetId)
      //if (currentTabset) {
      //if (tabsStore.isContextMode) {
      // console.log(`onUpdated: tab ${number}:     context mode`)
      // console.log(`onUpdated: tab ${number}:     found current tabset ${currentTabset.id}`)
      const maybeTab = tabsStore.tabForUrlInContextTabset(tab.url || '')
      if (maybeTab) {
        return
      }
      const index = _.findIndex(tabsStore.pendingTabset.tabs, t => t.chromeTab.id === tab.id);
      console.log(`onUpdated:   tab ${number}:     got index ${index}`)
      if (index >= 0) {
        const existingTab = tabsStore.pendingTabset.tabs[index]
        const updatedTab = new Tab(uid(), tab)
        if (existingTab.chromeTab.url !== updatedTab.chromeTab.url && existingTab.chromeTab.url !== 'chrome://newtab/') {
          console.log(`onUpdated:   tab ${number}:     updating tab url ${updatedTab.chromeTab.url}`, existingTab, updatedTab)
          updatedTab.setHistoryFrom(existingTab)
          if (existingTab.chromeTab.url) {
            updatedTab.addToHistory(existingTab.chromeTab.url)
          }
        }
        if (!tab.title?.startsWith("Tabset")) {
          console.log(`onUpdated:   tab ${number}:     setting status CREATED`)
          updatedTab.status = TabStatus.CREATED
        }
        tabsStore.pendingTabset.tabs.splice(index, 1, updatedTab);
        //console.log(`onUpdated: tab ${number}:     tabs`, currentTabset.tabs)
        // reload tabs (to be sure?!)
        if (!this.inProgress) {
          tabsStore.loadTabs('onUpdated');
        }
      } else {
        if (!tab.title?.startsWith("Tabset")) {
          const newTab = new Tab(uid(), tab)
          console.log(`onUpdated:   tab ${number}:     setting status CREATED`)
          newTab.status = TabStatus.CREATED
          tabsStore.pendingTabset.tabs.push(newTab)
          if (!this.inProgress) {
            tabsStore.loadTabs('onUpdated');
          }
        }
      }
      // TabsetService.saveTabset(currentTabset)
    }
  }

  onRemoved(number: number, info: chrome.tabs.TabRemoveInfo) {
    this.eventTriggered()
    const tabsStore = useTabsStore()
    if (!tabsStore.listenersOn) {
      return
    }

    console.log(`onRemoved: tab ${number}: >>> ${JSON.stringify(info)}`)

    if (tabsStore.tabIdExistsInContextTabset(number)) {
      return
    }

    if ("current" === tabsStore.currentTabsetId && !this.inProgress) {
      tabsStore.loadTabs('onRemoved')
      return
    }
    if (tabsStore.isContextMode) {
      const currentTabset: Tabset = tabsStore.tabsets.get(tabsStore.currentTabsetId) || new Tabset("", "", [])
      var index = _.findIndex(currentTabset.tabs, t => t.chromeTab.id === number);
      if (index >= 0) {
        console.log(`onRemoved: tab ${number}:     found index ${index}`)
        const updatedTab = currentTabset.tabs.at(index)
        if (updatedTab) {
          updatedTab.status = TabStatus.DELETED
          console.log(`onRemoved: tab ${number}:     setting status DELETED`)
          //currentTabset.tabs.splice(index, 1, updatedTab);
        }

      } else {

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
    if (!tabsStore.listenersOn) {
      return
    }
    console.log(`onActivated: tab ${info.tabId} activated: >>> ${JSON.stringify(info)}`)
    // chrome.tabs.captureVisibleTab( function (stream) {
    //   console.log("stream onActivated", stream)
    // })
    // chrome.tabs.get(info.tabId, tab => {
    //   //console.log("got tab", tab)
    //   const url = tab.url
    //   _.forEach([...tabsStore.tabsets.keys()], key => {
    //     const ts = tabsStore.tabsets.get(key) || new Tabset("", "", [])
    //     const hits = _.filter(ts.tabs, (t: Tab) => t.chromeTab.url === url)
    //     _.forEach(hits, h => {
    //       h.activatedCount = 1 + h.activatedCount
    //       h.lastActive += new Date().getTime()
    //       console.log(`onActivated: tab ${info.tabId} removed:updating hits`, h)
    //     })
    //     TabsetService.saveTabset(ts)
    //   })
    // })
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
    // Variant One (hmtl2canvas)
    /*console.log("got message", sender.tab)
    console.log("got message", request)
    console.log(sender.tab ?
      "from a content script:" + sender.tab.url :
      "from the extension");
    //if (request.greeting === "hello")
    TabsetService.saveThumbnailFor(sender.tab, request.thumbnail)
    sendResponse({farewell: "cheers"});*/

    // Variant Two
    chrome.tabs.captureVisibleTab(
      {},
      function (dataUrl) {
        console.log("capturing thumbnail for ", sender.tab?.id, Math.round(dataUrl.length / 1024) + "kB")

        let img = new Image()
        img.src = dataUrl
        img.onload = () => {
          let canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          const MAX_WIDTH = 300
          const MAX_HEIGHT = 200

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }
          let ctx = canvas.getContext('2d')
          // @ts-ignore
          ctx.drawImage(img, 0, 0, width, height)
          //resolve(canvas.toDataURL()) // this will return base64 image results after resize

          console.log("capturing thumbnail for ", sender.tab?.id, Math.round(canvas.toDataURL().length / 1024) + "kB")
          TabsetService.saveThumbnailFor(sender.tab, canvas.toDataURL())
          sendResponse({imgSrc: dataUrl});

        }


      }
    );

    return true;
  }
}

export default new ChromeListeners();

