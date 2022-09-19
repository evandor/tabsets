import {defineStore} from 'pinia';
import _ from 'lodash'
import {LocalStorage, uid} from "quasar";
import {Tabset} from "src/models/Tabset";
import {Tab, TabStatus} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import ChromeListeners from "src/services/ChromeListeners";
import ChromeApi from "src/services/ChromeApi";
import {NewOrReplacedTabset} from "src/models/NewOrReplacedTabset";
import {useTabGroupsStore} from "stores/tabGroupsStore";
import {Group} from "src/models/Group";

async function queryTabs(): Promise<chrome.tabs.Tab[]> {
  // @ts-ignore
  return await chrome.tabs.query({currentWindow: true});
}

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

    // active means: tabs(-sets) are tracked
    active: null as unknown as boolean,

    // chrome's current's windows tabs, reloaded on various events
    tabs: [] as unknown as chrome.tabs.Tab[],

    /**
     * a named list of tabsets managed by this extension. There's a special
     * key 'current' which references the current state of the chrome tabs (see 'tabs' above)
     */
    tabsets: new Map<string, Tabset>(),

    pendingTabset: null as unknown as Tabset,

    browserTabset: null as unknown as Tabset,

    // which tabset should be shown in the extension?
    currentTabsetId: 'current',

    // use listeners? Might make sense to turn them off when restoring old tabset for example
    listenersOn: true,

    localStorage: undefined as unknown as LocalStorage
  }),

  getters: {
    isLiveMode: (state) => (state.currentTabsetId === 'current'),
    isEditMode: (state) => (state.currentTabsetId !== 'current'),

    pinnedTabs(state): Tab[] { //chrome.tabs.Tab[] {
      //console.log("state", state.currentTabsetId)
      //console.log("state", state.tabsets.get(state.currentTabsetId))
      const currentTabset: Tabset = state.tabsets.get(state.currentTabsetId) || new Tabset("", "", [], [])
      return _.filter(currentTabset.tabs, (t: Tab) => {
        //console.log("t", t.chromeTab, t)
        return t.chromeTab?.pinned
      })
    },

    tabsCount(): number {
      return this.tabs.length
    },
    getChromeTabs: (state): chrome.tabs.Tab[] => state.tabs,
    tabsetNames: (state) => _.map([...state.tabsets.keys()], key => {
      const tabset = state.tabsets.get(key)
      return tabset?.name || 'unknown'
    }),
    getCurrentTabs: (state): Tab[] => {
      return state.tabsets.get(state.currentTabsetId)?.tabs || []
    },
    getCurrentTabset: (state): Tabset | undefined => {
      return state.tabsets.get(state.currentTabsetId)
    },
    getTabset: (state) => {
      return (tabsetId: string): Tabset | undefined => {
        return state.tabsets.get(tabsetId)
      }
    },
    currentTabsetName: (state) => {
      //console.log("here!", state.currentTabsetId)
      if (state.currentTabsetId !== 'current') {
        const tabset = _.head(_.filter([...state.tabsets.values()], ts => ts.id === state.currentTabsetId)) || new Tabset("", "undefined", [], [])
        return tabset.name
      }
      return 'current'
    },

    tabForUrlInSelectedTabset: (state): (url: string) => Tab | undefined => {
      const tabs: Tab[] = state.tabsets.get(state.currentTabsetId)?.tabs || []
      return (url: string) => _.find(tabs, t => t.chromeTab.url === url)
    },

    nameExistsInContextTabset: (state) => {
      return (searchName: string) => {
        const existingNames = _.map([...state.tabsets.values()], ts => ts.name)
        return _.find(existingNames, name => name === searchName.trim())
      }
    },
    getTab: (state) => {
      return (tabId: string): Tab | undefined => {

        for (const [key, value] of state.tabsets) {
          const found: Tab | undefined = _.find(value.tabs, t => t.id === tabId)
          if (found) {
            return found
          }
        }
        return undefined
      }
    },
    allTabsCount: (state) => {
      var count = 0
      for (const [key, value] of state.tabsets) {
        const nr = value.tabs.length
        count = count + nr
      }
      return count;
    }
  },

  actions: {
    async initialize(localStorage: any) {
      console.log("initializing tabsStore")
      this.localStorage = localStorage

      // --- tracking active ? ---
      const active = localStorage.getItem("active")
      this.active = active === null || active

      // --- setting current tabs
      this.tabs = await queryTabs()

      // @ts-ignore
      this.browserTabset = new Tabset("current", "current",
        _.map(this.tabs, t => new Tab(uid(), t)))

      this.pendingTabset = new Tabset("pending", "pending", [], [])


      // // marking duplicates (inside each tabset)
      // _.forEach([...this.tabsets.values()], tabset => markDuplicates(tabset))
    },
    async loadTabs(eventName: string) {
      // potentially expansive method
      // console.log(`${eventName}: -- loading tabs for tabset '${this.currentTabsetId}'`)
      //console.log(`${eventName}: -- loading tabs for tabset 'current'`)
      this.tabs = await queryTabs()
      const current = new Tabset("current", "current",
        _.map(this.tabs, t => {
          return new Tab(uid(), t)
        }), [])
      markDuplicates(current)
      //this.tabsets.set("current", current)
      this.browserTabset = current
    },
    initListeners() {
      chrome.tabs.onCreated.addListener((tab: chrome.tabs.Tab) => ChromeListeners.onCreated(tab))
      chrome.tabs.onUpdated.addListener((number, info, tab) => ChromeListeners.onUpdated(number, info, tab))
      chrome.tabs.onMoved.addListener((number, info) => ChromeListeners.onMoved(number, info))
      chrome.tabs.onRemoved.addListener((number, info) => ChromeListeners.onRemoved(number, info))
      chrome.tabs.onReplaced.addListener((n1, n2) => ChromeListeners.onReplaced(n1, n2))
      chrome.tabs.onActivated.addListener((info) => ChromeListeners.onActivated(info))
      chrome.tabs.onAttached.addListener((number, info) => ChromeListeners.onAttached(number, info))
      chrome.tabs.onDetached.addListener((number, info) => ChromeListeners.onDetached(number, info))
      chrome.tabs.onHighlighted.addListener((info) => ChromeListeners.onHighlighted(info))
      chrome.tabs.onZoomChange.addListener((info) => ChromeListeners.onZoomChange(info))

      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => ChromeListeners.onMessage(request, sender, sendResponse))

    },
    tabsForGroup(groupId: number): chrome.tabs.Tab[] {
      // @ts-ignore
      return _.filter(this.tabs, (t: chrome.tabs.Tab) => t.groupId === groupId)
    },
    unpinnedTabsWithoutGroup(): chrome.tabs.Tab[] {
      // @ts-ignore
      return _.filter(this.tabs, (t: chrome.tabs.Tab) => t.groupId === -1 && !t.pinned)
    },
    selectCurrentTabset(tabsetId: string): void {
      const found = _.find([...this.tabsets.values()], k => {
        const ts = k || new Tabset("", "", [], [])
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
      const currentTabset: Tabset = this.tabsets.get(this.currentTabsetId) || new Tabset("", "", [], [])
      currentTabset.tabs = _.filter(currentTabset.tabs, (t: Tab) => t.chromeTab.id !== tabId)
      TabsetService.saveTabset(currentTabset)
      this.pendingTabset.tabs = _.filter(this.pendingTabset.tabs, (t: Tab) => t.chromeTab.id !== tabId)
    },

    async updateOrCreateTabset(tabsetName: string, tabs: chrome.tabs.Tab[], merge: boolean = false): Promise<NewOrReplacedTabset> {
      console.log("--- saveOrCreateTabset start -------------")
      const foundTS: Tabset | undefined = _.find([...this.tabsets.values()], ts => ts.name === tabsetName)
      let ts: Tabset = null as unknown as Tabset
      const tabsetExtensionTab = await ChromeApi.getCurrentTab()
      const tabGroupsStore = useTabGroupsStore()
      if (foundTS) {
        if (merge) {
          console.log("found existing tabset " + foundTS.id + ", merging...")
          _.forEach(tabs, t => {
            const exists = _.find(foundTS.tabs, existing => existing.chromeTab.url === t.url)
            if (!exists) {
              foundTS.tabs.push(new Tab(uid(), t))
            }
          })
          ts = foundTS
          console.log("merging groups", tabGroupsStore.tabGroups)
          _.forEach(tabGroupsStore.tabGroups, tg => {
            const exists = _.find(foundTS.groups, existing => existing.chromeGroup.title === tg.title)
            if (!exists) {
              foundTS.groups.push(new Group(uid(), tg))
            }
          })
        } else {
          console.log("found existing tabset " + foundTS.id + ", replacing...")
          ts = new Tabset(foundTS.id, tabsetName, _.map(tabs, t => new Tab(uid(), t)), _.map(tabGroupsStore.tabGroups, tg => new Group(uid(), tg)))
          this.tabsets.set(foundTS.id, ts)
          //TabsetService.saveTabset(ts)
        }
      } else {
        console.log("didn't find existing tabset, creating new...")
        const useId = uid()
        ts = new Tabset(useId, tabsetName, _.map(
          _.filter(
            tabs, t => {
              //console.log("comparing", t.url, tabsetExtensionTab.url, t.url !== tabsetExtensionTab.url)
              return t.url !== tabsetExtensionTab.url
            }),
          t => new Tab(uid(), t)), _.map(tabGroupsStore.tabGroups, tg => new Group(uid(), tg)))
        console.log("got ts", ts)
        this.tabsets.set(useId, ts)
      }

      console.log("--- saveOrCreateTabset end -------------")
      return new NewOrReplacedTabset(foundTS !== undefined, ts)
    },

    deleteTabset(tabsetId: string) {
      this.tabsets.delete(tabsetId)
    },
    deactivateListeners() {
      console.log("setting listeners to false")
      this.listenersOn = false
    },
    activateListeners() {
      console.log("setting listeners to true")
      this.listenersOn = true
    },
    addTabset(ts: Tabset) {
      //console.log("adding tabset", ts)
      this.tabsets.set(ts.id, ts)
    }
  }
});
