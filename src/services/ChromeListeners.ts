import {Tabset} from "src/models/Tabset";
import TabsetService from "src/services/TabsetService";
import {useTabsStore} from "stores/tabsStore";
import _ from "lodash";
import {Tab, TabStatus} from "src/models/Tab";


class ChromeListeners {

  inProgress = false;

  clearWorking() {
    if (this.inProgress) {
      console.log("resetting 'inProgress' to false")
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
      if (!this.inProgress) {
        tabsStore.loadTabs('onCreated');
      }
    }
  }

  onUpdated(number: number, info: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
    this.eventTriggered()
    const tabsStore = useTabsStore()
    if (!tabsStore.listenersOn) {
      return
    }
    if (tabsStore.contextId && (!info.status || (Object.keys(info).length > 1))) {
      console.log(`onUpdated: tab ${number} updated: ${JSON.stringify(info)}`)
      const currentTabset = tabsStore.tabsets.get(tabsStore.currentTabsetId) //|| new Tabset("", "", [])
      if (currentTabset) {
        console.log(`onUpdated: tab ${number}: found current tabset`)
        const index = _.findIndex(currentTabset.tabs, t => t.chromeTab.id === tab.id);
        //console.log(`onUpdated: tab ${number}: got index ${index}`)
        //if (index < 0) {
        const updatedTab = new Tab(tab)
        if (!tab.title?.startsWith("Tabset")) {
          console.log(`onUpdated: tab ${number} updated: setting status CREATED`)
          updatedTab.status = TabStatus.CREATED
        }
        currentTabset.tabs.splice(index, 1, updatedTab);
        console.log(`onUpdated: tab ${number} updated: tabs`, currentTabset.tabs)
        // save tabset?
        // reload tabs (to be sure?!)
        if (!this.inProgress) {
          tabsStore.loadTabs('onUpdated');
        }
        //}
      }
    }
  }

  onRemoved(number: number, info: chrome.tabs.TabRemoveInfo) {
    this.eventTriggered()
    const tabsStore = useTabsStore()
    if (!tabsStore.listenersOn) {
      return
    }

    console.log(`onRemoved: tab ${number} removed: ${JSON.stringify(info)}`)
    if ("current" === tabsStore.currentTabsetId && !this.inProgress) {
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
        console.log(`onRemoved: tab ${number} updated: setting status DELETED`)
        //currentTabset.tabs.splice(index, 1, updatedTab);
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
          console.log(`onActivated: tab ${info.tabId} removed:updating hits`, h)
        })
        TabsetService.saveTabset(ts)
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

