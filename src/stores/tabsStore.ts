import {defineStore} from 'pinia';
// @ts-ignore
import _ from 'lodash'
import {LocalStorage, uid} from "quasar";
import {Tabset} from "src/models/Tabset";
import {Tab, TabStatus} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";

async function queryTabs(): Promise<chrome.tabs.Tab[]> {
  return await chrome.tabs.query({currentWindow: true})
}

// async function getCurrentTab() {
//   let queryOptions = {active: true, lastFocusedWindow: true};
//   // `tab` will either be a `tabs.Tab` instance or `undefined`.
//   let [tab] = await chrome.tabs.query(queryOptions);
//   return tab;
// }


function markDuplicates(tabset: Tabset) {
  //console.log("marking duplicates in tabset", tabset.id)
  const urls = new Set<string>()
  const duplicates = new Set<string>()
  _.forEach(tabset.tabs, t => {
    if (urls.has(t.chromeTab.url || 'undefined')) {
      duplicates.add(t.chromeTab.url || 'undefined')
    } else {
      urls.add(t.chromeTab.url || 'undefined')
    }
  })
  //console.log("found duplicates", urls, duplicates)
  _.forEach(tabset.tabs, t => {
    if (duplicates.has(t.chromeTab.url || 'undefined')) {
      t.isDuplicate = true
    }
  })
}

export const useTabsStore = defineStore('tabs', {
  state: () => ({

    // current context id (one of the tabsets ids, null if not set)
    contextId: null as unknown as string,

    // chrome's current's windows tabs, reloaded on various events
    tabs: [] as unknown as chrome.tabs.Tab[],

    /**
     * a named list of tabsets managed by this extension. There's a special
     * key 'current' which references the current state of the chrome tabs (see 'tabs' above)
     */
    tabsets: new Map<string, Tabset>(),

    // which tabset should be shown in the extension?
    currentTabsetId: 'current',

    // use listeners? Might make sense to turn them off when restoring old tabset for example
    listenersOn: true,

    // extension title
    title: 'Tabset Extension',

    localStorage: undefined as unknown as LocalStorage
  }),

  getters: {
    pinnedTabs(state): Tab[] { //chrome.tabs.Tab[] {
      //console.log("state", state.currentTabsetId)
      //console.log("state", state.tabsets.get(state.currentTabsetId))
      const currentTabset: Tabset = state.tabsets.get(state.currentTabsetId) || new Tabset("", "", [])
      return _.filter(currentTabset.tabs, (t: Tab) => {
        //console.log("t", t.chromeTab, t)
        return t.chromeTab?.pinned
      })
    },
    pendingTabs(state): Tab[] {
      const currentTabset: Tabset = state.tabsets.get(state.currentTabsetId) || new Tabset("", "", [])
      return _.filter(currentTabset.tabs, (t: Tab) => {
        return t.status !== TabStatus.DEFAULT
      })
    },

    tabsCount(): number {
      return this.tabs.length
    },
    getTabs: (state) => state.tabs,
    tabsetNames: (state) => _.map([...state.tabsets.keys()], key => {
      const tabset = state.tabsets.get(key)
      return tabset?.name || 'unknown'
    }),
    getCurrentTabs: (state) => {
      //console.log("getCurrentTabs called for", state.currentTabsetId)
      //console.log("2", state.tabsets.get(state.currentTabset))
      return state.tabsets.get(state.currentTabsetId)?.tabs || []
    },
    currentTabsetName: (state) => {
      //console.log("here!", state.currentTabsetId)
      if (state.currentTabsetId !== 'current') {
        const tabset = _.head(_.filter([...state.tabsets.values()], ts => ts.id === state.currentTabsetId)) || new Tabset("", "undefined", [])
        return tabset.name
      }
      return 'current'
    },
    getNameForContext: (state): string => {
      return _.first(_.map(
        _.filter([...state.tabsets.values()],
          ts => ts.id === state.contextId),
        ts => ts.name)) || 'undefined'
    }
  },

  actions: {
    async initialize(localStorage: LocalStorage) {
      console.log("initializing tabsStore")
      this.localStorage = localStorage

      // setting current tabs
      this.tabs = await queryTabs()
      // @ts-ignore
      const tabsFromBrowser = new Tabset("current", "current",
        _.map(this.tabs, t => {
          return new Tab(t)
        }))
      this.tabsets.set("current", tabsFromBrowser)

      // setting all tabs from local storage tabsets
      const currentContext = localStorage.getItem("tabsets.context") as string
      _.forEach(
        _.filter(localStorage.getAllKeys(),
          (t: string) => t.startsWith("tabsets.tabset.")),
        key => {
          const tabsetId = key.replace("tabsets.tabset.", "")
          const tabset: Tabset | null = localStorage.getItem(key)
          if (tabset) {
            //console.log("setting tabset", key)
            this.tabsets.set(tabsetId, tabset)
            if (currentContext && currentContext === tabsetId) {
              console.log("setting current context", currentContext)
              this.contextId = tabset.id
              this.currentTabsetId = tabset.id
            }
          }
        })

      // marking duplicates (inside each tabset)
      _.forEach([...this.tabsets.values()], tabset => markDuplicates(tabset))
    },
    async loadTabs(eventName: string) {
      console.log(`${eventName}: loading tabs for tabset '${this.currentTabsetId}'`)
      const ts = await queryTabs()//.then(ts => {
      this.tabs = ts
      //if ("current" === this.currentTabsetId) {
      const current = new Tabset("current", "current",
        _.map(this.tabs, t => {
          return new Tab(t)
        }))
      markDuplicates(current)
      this.tabsets.set("current", current)
      //}
      //});
      //_.forEach([...this.tabsets.values()], tabset => markDuplicates(tabset))
    },
    initListeners() {
      chrome.tabs.onCreated.addListener((tab: chrome.tabs.Tab) => {
        if (!this.listenersOn) {
          return
        }
        //console.log(`onCreated: tab ${tab.id} created: ${JSON.stringify(tab)}`)
        console.log(`onCreated: tab ${tab.id} created: ${tab.pendingUrl}`)

        if ('current' === this.currentTabsetId) {
          this.loadTabs('onCreated');
          return
        }
        // add to current tabset if not there yet
        const currentTabset: Tabset = this.tabsets.get(this.currentTabsetId) || new Tabset("", "", [])
        const found = _.find(currentTabset.tabs, t => t.chromeTab.url === tab.url)
        if (!found) {
          const newTab = new Tab(tab)
          newTab.status = TabStatus.CREATED
          currentTabset.tabs.push(newTab)
          // reload tabs (to be sure?!)
          this.loadTabs('onCreated');
        }
      })
      chrome.tabs.onUpdated.addListener((number, info, tab) => {
        if (!this.listenersOn) {
          return
        }
        console.log(`onUpdated: tab ${number} updated: ${JSON.stringify(info)}`)
        if (!info.status || (Object.keys(info).length > 1)) {
          const currentTabset: Tabset = this.tabsets.get(this.currentTabsetId) || new Tabset("", "", [])
          var index = _.findIndex(currentTabset.tabs, t => t.chromeTab.id === tab.id);
          //console.log("found index", index)
          const updatedTab = new Tab(tab)
          updatedTab.status = TabStatus.CREATED
          currentTabset.tabs.splice(index, 1, updatedTab);
          // save tabset?
          // reload tabs (to be sure?!)
          this.loadTabs('onUpdated');
        }
      })
      chrome.tabs.onMoved.addListener((number, info) => {
        console.log(`onMoved: tab ${number} moved: ${JSON.stringify(info)}`)
        this.loadTabs('onMoved');
      })
      chrome.tabs.onRemoved.addListener((number, info) => {
        if (!this.listenersOn) {
          return
        }

        console.log(`onRemoved: tab ${number} removed: ${JSON.stringify(info)}`)
        if ("current" === this.currentTabsetId) {
          this.loadTabs('onRemoved')
          return
        }
        const currentTabset: Tabset = this.tabsets.get(this.currentTabsetId) || new Tabset("", "", [])
        var index = _.findIndex(currentTabset.tabs, t => t.chromeTab.id === number);
        //console.log("found index", index)
        const updatedTab = currentTabset.tabs.at(index)
        if (updatedTab) {
          updatedTab.status = TabStatus.DELETED
          console.log("updated tab", updatedTab)
          //currentTabset.tabs.splice(index, 1, updatedTab);
        }
        // save tabset?
        // reload tabs (to be sure?!)


        //this.loadTabs('onRemoved');
      })
      chrome.tabs.onReplaced.addListener((n1, n2) => {
        console.log(`onReplaced: tab ${n1} replaced with ${n2}`)
        this.loadTabs('onReplaced');
      })
      chrome.tabs.onActivated.addListener((info) => {
        if (!this.listenersOn) {
          return
        }

        const msg = `tab ${info.tabId} activated`
        console.log("msg", msg)

        chrome.tabs.get(info.tabId, tab => {
          //console.log("got tab", tab)
          const url = tab.url
          _.forEach([...this.tabsets.keys()], key => {
            const ts = this.tabsets.get(key) || new Tabset("", "", [])
            const hits = _.filter(ts.tabs, (t: Tab) => t.chromeTab.url === url)
            _.forEach(hits, h => {
              h.activatedCount = 1 + h.activatedCount
              h.lastActive += new Date().getTime()
            })
            TabsetService.saveTabset(ts)
          })
        })
        //new TabsetApi(this.localStorage).saveTabset(this.currentTabset)
      })
      chrome.tabs.onAttached.addListener((number, info) => {
        console.log(`onAttached: tab ${number} attached: ${JSON.stringify(info)}`)
      })
      chrome.tabs.onDetached.addListener((number, info) => {
        console.log(`onDetached: tab ${number} detached: ${JSON.stringify(info)}`)
      })
      chrome.tabs.onHighlighted.addListener((info) => {
        console.log(`onHighlighted: tab ${info.tabIds} highlighted: ${JSON.stringify(info)}`)
      })
      chrome.tabs.onZoomChange.addListener((info) => {
        //console.log(`onZoomChange: tab ${info.tabId} zoom change: ${JSON.stringify(info)}`)
      })

    },
    tabsForGroup(groupId: number): chrome.tabs.Tab[] {
      return _.filter(this.tabs, (t: chrome.tabs.Tab) => t.groupId === groupId)
    },
    unpinnedTabsWithoutGroup(): chrome.tabs.Tab[] {
      return _.filter(this.tabs, (t: chrome.tabs.Tab) => t.groupId === -1 && !t.pinned)
    },
    selectCurrentTabset(tabsetId: string): void {
      // if ("current" === name) {
      //   console.log("setting tabs from chrome")
      //   // this.currentTabset = new Tabset("current", "current",
      //   //   _.map(this.tabs, t => {
      //   //     return new Tab(t)
      //   //   }))
      //   return
      // }
      const found = _.find([...this.tabsets.values()], k => {
        const ts = k || new Tabset("", "", [])
        return ts.id === tabsetId
      })
      if (found) {
        //console.log("found", found)
        this.currentTabsetId = tabsetId //this.tabsets.get(found) || new Tabset("", "", [])
      } else {
        console.error("not found", name)
      }
    },
    removeTab(tabId: number) {
      const currentTabset: Tabset = this.tabsets.get(this.currentTabsetId) || new Tabset("", "", [])
      currentTabset.tabs = _.filter(currentTabset.tabs, (t: Tab) => t.chromeTab.id !== tabId)
      TabsetService.saveTabset(currentTabset)
    },
    saveOrCreateTabset(tabsetName: string) {
      const found = _.find([...this.tabsets.values()], ts => ts.name === tabsetName)
      let ts: Tabset = null as unknown as Tabset
      if (found) {
        console.log("found existing tabset " + found.id + ", replacing...")
        ts = new Tabset(found.id, tabsetName, _.map(this.tabs, t => new Tab(t)));
        this.tabsets.set(found.id, ts)
        TabsetService.saveTabset(ts)

      } else {
        console.log("didn't find existing tabset, creating new...")
        const useId = uid()
        ts = new Tabset(useId, tabsetName, _.map(this.tabs, t => new Tab(t)));
        this.tabsets.set(useId, ts)
      }
      this.currentTabsetId = ts.id
      this.contextId = ts.id
      TabsetService.saveTabset(ts)
      this.localStorage.set("tabsets.context", this.contextId)
    },
    deleteTabset(tabsetId: string) {

    },
    deactivateListeners() {
      console.log("setting listeners to false")
      this.listenersOn = false
    },
    activateListeners() {
      console.log("setting listeners to true")
      this.listenersOn = true
    }

  }
});
