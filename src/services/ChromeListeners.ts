import {Tabset} from "src/models/Tabset";
import {LocalStorage} from "quasar";
import TabsetService from "src/services/TabsetService";
import {useTabsStore} from "stores/tabsStore";
import _ from "lodash";
import {Tab, TabStatus} from "src/models/Tab";

class ChromeListeners {


  onCreated(tab: chrome.tabs.Tab) {
    const tabsStore = useTabsStore()
    if (!tabsStore.listenersOn) {
      return
    }
    console.log(`onCreated: tab ${tab.id} created: ${tab.pendingUrl}`)

    if ('current' === tabsStore.currentTabsetId) {
      tabsStore.loadTabs('onCreated');
      return
    }
    if (!tabsStore.contextId) {
      return
    }
    // add to current tabset if not there yet
    const currentTabset: Tabset = tabsStore.tabsets.get(tabsStore.currentTabsetId) || new Tabset("", "", [])
    const found = _.find(currentTabset.tabs, t => t.chromeTab.url === tab.url)
    if (!found) {
      const newTab = new Tab(tab)
      newTab.status = TabStatus.CREATED
      currentTabset.tabs.push(newTab)
      // reload tabs (to be sure?!)
      tabsStore.loadTabs('onCreated');
    }
  }

  onUpdated(number: number, info: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
    const tabsStore = useTabsStore()
    if (!tabsStore.listenersOn) {
      return
    }
    console.log(`onUpdated: tab ${number} updated: ${JSON.stringify(info)}`)
    if (tabsStore.contextId && (!info.status || (Object.keys(info).length > 1))) {
      const currentTabset: Tabset = tabsStore.tabsets.get(tabsStore.currentTabsetId) || new Tabset("", "", [])
      var index = _.findIndex(currentTabset.tabs, t => t.chromeTab.id === tab.id);
      //console.log("found index", index)
      const updatedTab = new Tab(tab)
      console.log("setting status CREATED")
      updatedTab.status = TabStatus.CREATED
      currentTabset.tabs.splice(index, 1, updatedTab);
      // save tabset?
      // reload tabs (to be sure?!)
      tabsStore.loadTabs('onUpdated');
    }
  }

  onRemoved(number: number, info: chrome.tabs.TabRemoveInfo) {
    const tabsStore = useTabsStore()
    if (!tabsStore.listenersOn) {
      return
    }

    console.log(`onRemoved: tab ${number} removed: ${JSON.stringify(info)}`)
    if ("current" === tabsStore.currentTabsetId) {
      tabsStore.loadTabs('onRemoved')
      return
    }
    if (tabsStore.contextId) {
      const currentTabset: Tabset = tabsStore.tabsets.get(tabsStore.currentTabsetId) || new Tabset("", "", [])
      var index = _.findIndex(currentTabset.tabs, t => t.chromeTab.id === number);
      //console.log("found index", index)
      const updatedTab = currentTabset.tabs.at(index)
      if (updatedTab) {
        updatedTab.status = TabStatus.DELETED
        console.log("setting status DELETED")
        //currentTabset.tabs.splice(index, 1, updatedTab);
      }
      // save tabset?
      // reload tabs (to be sure?!)


      //this.loadTabs('onRemoved');

    }
  }

  onReplaced(n1: number, n2: number) {
    const tabsStore = useTabsStore()
    console.log(`onReplaced: tab ${n1} replaced with ${n2}`)
    tabsStore.loadTabs('onReplaced');
  }

  onActivated(info: chrome.tabs.TabActiveInfo) {
    const tabsStore = useTabsStore()
    if (!tabsStore.listenersOn) {
      return
    }
    console.log(`onActivated: tab ${info.tabId} activated: ${JSON.stringify(info)}`)
    chrome.tabs.get(info.tabId, tab => {
      //console.log("got tab", tab)
      const url = tab.url
      _.forEach([...tabsStore.tabsets.keys()], key => {
        const ts = tabsStore.tabsets.get(key) || new Tabset("", "", [])
        const hits = _.filter(ts.tabs, (t: Tab) => t.chromeTab.url === url)
        _.forEach(hits, h => {
          h.activatedCount = 1 + h.activatedCount
          h.lastActive += new Date().getTime()
          console.log("updating hits", h)
        })
        TabsetService.saveTabset(ts)
      })
    })
    //new TabsetApi(this.localStorage).saveTabset(this.currentTabset)
  }

  onMoved(number: number, info: chrome.tabs.TabMoveInfo) {
    const tabsStore = useTabsStore()
    console.log(`onMoved: tab ${number} moved: ${JSON.stringify(info)}`)
    tabsStore.loadTabs('onMoved');
  }

  onAttached(number: number, info: chrome.tabs.TabAttachInfo) {
    console.log(`onAttached: tab ${number} attached: ${JSON.stringify(info)}`)
  }

  onDetached(number: number, info: chrome.tabs.TabDetachInfo) {
    console.log(`onDetached: tab ${number} detached: ${JSON.stringify(info)}`)
  }

  onHighlighted(info: chrome.tabs.TabHighlightInfo) {
    console.log(`onHighlighted: tab ${info.tabIds} highlighted: ${JSON.stringify(info)}`)
  }

  onZoomChange(info: chrome.tabs.ZoomChangeInfo) {
    //console.log(`onZoomChange: tab ${info.tabId} zoom change: ${JSON.stringify(info)}`)
  }
}

export default new ChromeListeners();

