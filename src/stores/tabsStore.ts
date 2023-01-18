import {defineStore} from 'pinia';
import _ from 'lodash'
import {LocalStorage, uid} from "quasar";
import {Tabset, TabsetStatus, TabsetType} from "src/models/Tabset";
import {Tab, UrlExtension} from "src/models/Tab";
import ChromeApi from "src/services/ChromeApi";
import {NewOrReplacedTabset} from "src/models/NewOrReplacedTabset";
import {useTabGroupsStore} from "src/stores/tabGroupsStore";
import {Group} from "src/models/Group";
import {useSpacesStore} from "stores/spacesStore";
import LoggingService from "src/services/LoggingService";

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
    t.isDuplicate = duplicates.has(t.chromeTab.url || 'undefined');
  })
}

export const useTabsStore = defineStore('tabs', {
  state: () => ({

    // tabset extension id, set at init
    ownTabId: null as unknown as number,

    // chrome's current's windows tabs, reloaded on various events
    tabs: [] as unknown as chrome.tabs.Tab[],

    /**
     * a named list of tabsets managed by this extension.
     */
    tabsets: new Map<string, Tabset>(),

    /**
     * if the user opens a new tab, this will be stored here
     */
    pendingTabset: null as unknown as Tabset,

    /**
     * the browsers tabs as a tabset
     */
    browserTabset: null as unknown as Tabset,

    /**
     * tabs the extension should ignore
     */
    ignoredTabset: null as unknown as Tabset,

    // which tabset should be shown in the extension?
    currentTabsetId: null as unknown as string,

    // use listeners? Might make sense to turn them off when restoring old tabset for example
    listenersOn: true,

    localStorage: undefined as unknown as LocalStorage
  }),

  getters: {

    pinnedTabs(state): Tab[] {
      const currentTabset: Tabset = state.tabsets.get(state.currentTabsetId) || new Tabset("", "", [])
      return _.filter(currentTabset.tabs, (t: Tab) => {
        //console.log("t", t.chromeTab, t)
        return t?.chromeTab?.pinned
      })
    },

    mostAccessedTabs(state): Tab[] {
      const allTabs: Tab[] =
        _.orderBy(
          _.filter(
            _.flatMap(
              _.filter(
                _.map([...this.tabsets.values()], (ts: Tabset) => ts),
                (ts: Tabset) => ts.status === TabsetStatus.DEFAULT || ts.status === TabsetStatus.FAVORITE),
              (ts: Tabset) => ts.tabs), (t: Tab) => t.activatedCount > 1),
          (t: Tab) => t.activatedCount, ['desc'])
      return allTabs.slice(0, 12)
    },

    audibleTabs(state): chrome.tabs.Tab[] {
      const openTabs: chrome.tabs.Tab[] = state.tabs
      // @ts-ignore
      return _.filter(openTabs, (t: chrome.tabs.Tab) => t && t.audible)
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
        return _.find(existingNames, name => name === searchName?.trim())
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
        const nr = value.tabs?.length
        count = count + nr
      }
      return count;
    },
    localTabsCount: (state) => {
      var count = 0
      for (const val of [...state.tabsets.values()]) {
        const nr = val.tabs.length
        count = count + nr
      }
      return count;
    },
    rssTabs: (state) => {
      const res: Tab[] = []
      _.forEach([...state.tabsets.values()], (ts: Tabset) => {
        if (ts.status === TabsetStatus.DEFAULT || ts.status === TabsetStatus.FAVORITE) {
          _.forEach(ts.tabs, (t: Tab) => {
            if (t.extension === UrlExtension.RSS) {
              res.push(t)
            }
          })
        }
      })
      return res
    },
    scheduledTabs: (state) => {
      const res: Tab[] = []
      _.forEach([...state.tabsets.values()], (ts: Tabset) => {
        //if (ts.status === TabsetStatus.DEFAULT || ts.status === TabsetStatus.FAVORITE) {
        _.forEach(ts.tabs, (t: Tab) => {
          if (t.scheduledFor) {
            res.push(t)
          }
        })
        // }
      })
      return res
    }

  },

  actions: {
    async initialize(localStorage: any) {
      console.debug("initializing tabsStore")
      this.localStorage = localStorage

      // --- own tab id ---
      const ownTab = await ChromeApi.getCurrentTab()
      if (ownTab && ownTab.id) {
        //console.log("setting extension tab id to ", ownTab.id)
        this.ownTabId = ownTab.id
      }

      // --- setting current tabs
      this.tabs = await queryTabs()

      // @ts-ignore
      this.browserTabset = new Tabset("current", "current",
        _.map(this.tabs, t => new Tab(uid(), t)))

      this.pendingTabset = new Tabset("pending", "pending", [], [])

      this.ignoredTabset = new Tabset("ignored", "ignored", [], [])
    },

    async loadTabs(eventName: string) {
      // potentially expansive method
      // console.log(`${eventName}: -- loading tabs for tabset '${this.currentTabsetId}'`)
      //console.log(`${eventName}: -- loading tabs for tabset 'current'`)
      this.tabs = await queryTabs()
      const current = new Tabset("current", "current",
        _.map(this.tabs, t => {
          return new Tab(uid(), t)
        }))
      markDuplicates(current)
      this.browserTabset = current
    },

    tabsForGroup(groupId: number): chrome.tabs.Tab[] {
      // @ts-ignore
      return _.filter(this.tabs, (t: chrome.tabs.Tab) => t.groupId === groupId)
    },
    selectCurrentTabset(tabsetId: string): Tabset | undefined {
      const found = _.find([...this.tabsets.values()], k => {
        const ts = k || new Tabset("", "", [])
        return ts.id === tabsetId
      })
      if (found) {
        //console.log("found", found)
        this.currentTabsetId = tabsetId //this.tabsets.get(found) || new Tabset("", "", [])
        return found
      } else {
        console.debug("not found:", tabsetId, [...this.tabsets.values()])
      }
      return undefined
    },

    removeTab(tabset: Tabset, tabId: string) {

      //const currentTabset: Tabset = this.tabsets.get(this.currentTabsetId) || new Tabset("", "", [])
      tabset.tabs = _.filter(tabset.tabs, (t: Tab) => t.id !== tabId)
      markDuplicates(tabset)
      this.pendingTabset.tabs = _.filter(this.pendingTabset.tabs, (t: Tab) => t.id !== tabId)
      // return saveTabset(currentTabset)
      //   .then(() => currentTabset)
    },

    async updateOrCreateTabset(
      tabsetName: string,
      tabs: Tab[],
      merge: boolean = false,
      type: TabsetType = TabsetType.DEFAULT): Promise<NewOrReplacedTabset> {

      LoggingService.logger.debug("--- updateOrCreateTabset start -------------")
      const foundTS: Tabset | undefined = _.find([...this.tabsets.values()], ts => ts.name === tabsetName)
      let ts: Tabset = null as unknown as Tabset
      //const tabsetExtensionTab = await ChromeApi.getCurrentTab()
      const tabGroupsStore = useTabGroupsStore()
      const currentSpace = useSpacesStore().space
      if (foundTS) {
        if (merge) {
          LoggingService.logger.debug("found existing tabset " + foundTS.id + ", merging...")
          _.forEach(tabs, t => {
            const exists = _.find(foundTS.tabs, existing => existing.chromeTab.url === t.chromeTab?.url)
            if (!exists) {
              foundTS.tabs.push(t)
            }
          })
          ts = foundTS
          LoggingService.logger.debug("merging groups", tabGroupsStore.tabGroups)
          _.forEach(tabGroupsStore.tabGroups, tg => {
            const exists = _.find(foundTS.groups, existing => existing.chromeGroup.title === tg.title)
            if (!exists) {
              foundTS.groups.push(new Group(uid(), tg))
            }
          })


        } else {
          LoggingService.logger.debug("found existing tabset " + foundTS.id + ", replacing...")
          ts = new Tabset(foundTS.id, tabsetName, _.map(tabs, t => t),
            _.map(tabGroupsStore.tabGroups, tg => new Group(uid(), tg)))
          this.tabsets.set(foundTS.id, ts)
          //TabsetService.saveTabset(ts)
        }
      } else {
        LoggingService.logger.debug("didn't find existing tabset, creating new...")
        const useId = uid()
        ts = new Tabset(useId, tabsetName, tabs, _.map(tabGroupsStore.tabGroups, tg => new Group(uid(), tg)))
        this.tabsets.set(useId, ts)
      }
      LoggingService.logger.debug("currentSpace", currentSpace)
      if (currentSpace && currentSpace.id && ts.spaces.findIndex(s => s === currentSpace.id) < 0) {
        ts.spaces.push(currentSpace.id)
      }

      ts.type = type

      LoggingService.logger.debug("--- updateOrCreateTabset end -------------")
      return new NewOrReplacedTabset(foundTS !== undefined, ts)
    },

    deleteTabset(tabsetId: string) {
      this.tabsets.delete(tabsetId)
      if (this.currentTabsetId === tabsetId) {
        this.currentTabsetId = null as unknown as string
      }
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
      ts.tabs = _.filter(ts.tabs, (t: Tab) => t !== null)
      this.tabsets.set(ts.id, ts)
      markDuplicates(ts)
    }
  }
});
