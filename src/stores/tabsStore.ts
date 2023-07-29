import {defineStore} from 'pinia';
import _, {forEach} from 'lodash'
import {LocalStorage, uid} from "quasar";
import {Tabset, TabsetStatus, TabsetType} from "src/models/Tabset";
import {Tab, UrlExtension} from "src/models/Tab";
import ChromeApi from "src/services/ChromeApi";
import {NewOrReplacedTabset} from "src/models/NewOrReplacedTabset";
import {useSpacesStore} from "src/stores/spacesStore";
import {SpecialTabsetIdent} from "src/domain/tabsets/CreateSpecialTabset";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {Space} from "src/models/Space";
import {useTabsetService} from "src/services/TabsetService2";

async function queryTabs(): Promise<chrome.tabs.Tab[]> {
  // @ts-ignore
  return await chrome.tabs.query({currentWindow: true});
}

function markDuplicates(tabset: Tabset) {
  //console.log("marking duplicates in tabset", tabset.id)
  const urls = new Set<string>()
  const duplicates = new Set<string>()
  _.forEach(tabset.tabs, t => {
    if (urls.has((t.url || 'undefined') + '-' + t.image)) {
      duplicates.add(t.url || 'undefined')
    } else {
      urls.add((t.url || 'undefined') + '-' + t.image)
    }
  })
  //console.log("found duplicates", urls, duplicates)
  _.forEach(tabset.tabs, t => {
    t.isDuplicate = duplicates.has(t.url || 'undefined');
  })
}

export const useTabsStore = defineStore('tabs', {
  state: () => ({

    // tabset extension id, set at init
    ownTabId: null as unknown as number,

    // chrome's current's windows tabs, reloaded on various events
    tabs: [] as unknown as chrome.tabs.Tab[],

    // cannot use type chrome.tabs.Tab if not in bex mode
    currentChromeTab: null as unknown as chrome.tabs.Tab,
    // tab by window id
    currentChromeTabs: new Map() as Map<number, chrome.tabs.Tab>,

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
    //ignoredTabset: null as unknown as Tabset,

    /**
     * tabs to revisit later (will be available in all spaces)
     */
    backupTabset: null as unknown as Tabset,

    // which tabset should be shown in the extension?
    currentTabsetId: null as unknown as string,

    // use listeners? Might make sense to turn them off when restoring old tabset for example
    listenersOn: true,

    localStorage: undefined as unknown as LocalStorage
  }),

  getters: {

    pinnedTabs(state): Tab[] {
      return []
      // const currentTabset: Tabset = state.tabsets.get(state.currentTabsetId) || new Tabset("", "", [])
      // return _.filter(currentTabset.tabs, (t: Tab) => {
      //   //console.log("t", t.chromeTab, t)
      //   return t?.pinned
      // })
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
      console.log("calling getcurrenttabset", state.currentTabsetId)
      return state.tabsets.get(state.currentTabsetId)
    },
    getTabset: (state) => {
      return (tabsetId: string): Tabset | undefined => {
        return state.tabsets.get(tabsetId)
      }
    },
    currentTabsetName: (state) : string | undefined => {
      const candidates = _.filter([...state.tabsets.values()], ts => ts.id === state.currentTabsetId)
      if (candidates.length > 0) {
        return candidates[0].name
      }
      return undefined
    },

    tabForUrlInSelectedTabset: (state): (url: string) => Tab | undefined => {
      const tabs: Tab[] = state.tabsets.get(state.currentTabsetId)?.tabs || []
      return (url: string) => _.find(tabs, t => t.url === url)
    },

    tabsForUrl: (state): (url: string) => Tab[] => {
      return (url: string) => {
        const tabs: Tab[] = []
        forEach([...state.tabsets.values()], (ts: Tabset) => {
          forEach(ts.tabs, (t: Tab) => {
            if (t.url === url) {
              tabs.push(t)
            }
          })
        })
        return tabs
      }
    },

    // Deprecated, use existingInTabset
    nameExistsInContextTabset: (state) => {
      return (searchName: string) => {
        const existingNames = _.map([...state.tabsets.values()], ts => ts.name)
        return _.find(existingNames, name => name === searchName?.trim())
      }
    },
    existingInTabset: (state) => {
      return (searchName: string, space: Space = null as unknown as Space): Tabset | undefined => {
        const trustedName = searchName.replace(STRIP_CHARS_IN_USER_INPUT, '')
        return _.find([...state.tabsets.values()], (ts: Tabset) => {
          if (space === null) {
            return ts.name === trustedName?.trim()
          } else {
            return ts.name === trustedName?.trim() && ts.spaces.indexOf(space.id) >= 0
          }
        })
      }
    },
    getTab: (state) => {
      return async (tabId: string): Promise<object | undefined> => {

        for (const [key, value] of state.tabsets) {
          //console.log("key/value", key, value)

          // lazy loading?
          // if (value.tabs.length === 0) {
          //   const useTabs = await useTabsetService().getTabs(key)
          //   const found: Tab | undefined = _.find(useTabs, t => t.id === tabId)
          //   if (found) {
          //     return Promise.resolve({
          //       tab: found,
          //       tabsetId: value.id
          //     })
          //   }
          // } else {
            const found: Tab | undefined = _.find(value.tabs, t => t.id === tabId)
            if (found) {
              return Promise.resolve({
                tab: found,
                tabsetId: value.id
              })
            }
          //}
        }
        return Promise.resolve(undefined)
      }
    },
    tabsetFor: (state) => {
      return (tabId: string): Tabset | undefined => {
        for (const [key, value] of state.tabsets) {
          if (_.find(value.tabs, t => t.id === tabId)) {
            return value
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
    },
    getCurrentChromeTab: (state) => {
      return (windowId: number): chrome.tabs.Tab | undefined => {
        return state.currentChromeTabs.get(windowId)
      }
    }
  },

  actions: {
    async initialize(localStorage: any) {
      console.debug("initializing tabsStore")
      this.localStorage = localStorage

      if ("bex" === process.env.MODE) {
        // --- own tab id ---
        const ownTab = await ChromeApi.getCurrentTab()
        if (ownTab && ownTab.id) {
          //console.log("setting extension tab id to ", ownTab.id)
          this.ownTabId = ownTab.id
        }

        // --- setting current tabs
        this.tabs = await queryTabs()
      }

      // @ts-ignore
      this.browserTabset = new Tabset("current", "current",
        _.map(this.tabs, t => new Tab(uid(), t)))

      this.pendingTabset = new Tabset("pending", "pending", [], [])
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

    setCurrentChromeTab(tab: chrome.tabs.Tab) {
      this.currentChromeTab = tab
      this.currentChromeTabs.set(tab.windowId, tab)
      //console.log("xxx", this.currentChromeTabs)
    },

    selectCurrentTabset(tabsetId: string): Tabset | undefined {
      const found = _.find([...this.tabsets.values()], k => {
        const ts = k || new Tabset("", "", [])
        return ts.id === tabsetId
      })
      if (found) {
       // console.log("found", found)
        this.currentTabsetId = tabsetId //this.tabsets.get(found) || new Tabset("", "", [])
        return found
      } else {
        console.debug("not found:", tabsetId)//, [...this.tabsets.values()])
      }
      return undefined
    },

    removeTab(tabset: Tabset, tabId: string) {

      //const currentTabset: Tabset = this.tabsets.get(this.currentTabsetId) || new Tabset("", "", [])
      tabset.tabs = _.filter(tabset.tabs, (t: Tab) => t.id !== tabId)
      markDuplicates(tabset)
      if (this.pendingTabset) {
        this.pendingTabset.tabs = _.filter(this.pendingTabset.tabs, (t: Tab) => t.id !== tabId)
      }
    },

    async updateOrCreateTabset(
      tabsetName: string,
      tabs: Tab[],
      merge: boolean = false,
      type: TabsetType = TabsetType.DEFAULT): Promise<NewOrReplacedTabset> {

      const foundTS: Tabset | undefined = _.find([...this.tabsets.values()], ts => ts.name === tabsetName)
      let ts: Tabset = null as unknown as Tabset
      //const tabsetExtensionTab = await ChromeApi.getCurrentTab()
      const currentSpace = useSpacesStore().space
      if (foundTS) {
        if (foundTS.status === TabsetStatus.DELETED) {
          foundTS.status = TabsetStatus.DEFAULT
          foundTS.tabs = []
        }
        if (merge) {
          _.forEach(tabs, t => {
            const exists = _.find(foundTS.tabs, existing => existing.url === t.url)
            if (!exists) {
              foundTS.tabs.push(t)
            }
          })
          ts = foundTS
          // _.forEach(tabGroupsStore.tabGroups, tg => {
          //   const exists = _.find(foundTS.groups, existing => existing.chromeGroup.title === tg.title)
          //   if (!exists) {
          //     foundTS.groups.push(new Group(uid(), tg))
          //   }
          // })


        } else {
          ts = new Tabset(foundTS.id, tabsetName, _.map(tabs, t => t),[])
          this.tabsets.set(foundTS.id, ts)
          //TabsetService.saveTabset(ts)
        }
      } else {
        const useId = uid()
        ts = new Tabset(useId, tabsetName, tabs, [])
        this.tabsets.set(useId, ts)
      }
      if (currentSpace && currentSpace.id && ts.spaces.findIndex(s => s === currentSpace.id) < 0) {
        ts.spaces.push(currentSpace.id)
      }

      ts.type = type

      return new NewOrReplacedTabset(foundTS !== undefined, ts)
    },

    getOrCreateSpecialTabset(ident: SpecialTabsetIdent, type: TabsetType): Tabset {
      const foundTS: Tabset | undefined = _.find([...this.tabsets.values()], ts => ts.id === ident.toString())
      let ts: Tabset = null as unknown as Tabset
      if (foundTS) {
        ts = foundTS
        ts.status = TabsetStatus.DEFAULT
      } else {
        const id = ident.toString()
        ts = new Tabset(id, id, [])
        this.tabsets.set(id, ts)
      }
      ts.type = type
      return ts
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

      // TODO can be removed sometime soon
      let foundOldRep = false
      ts.tabs.forEach((t:Tab) => {
        if (t['chromeTab' as keyof object]) {
          foundOldRep = true
          console.log("found old representation of tab")
          t.title = t['chromeTab' as keyof object]['title']
          t.url = t['chromeTab' as keyof object]['url']
          t.favIconUrl = t['chromeTab' as keyof object]['favIconUrl']
          delete t['chromeTab' as keyof object]
        }
      })
      if (foundOldRep) {
        useTabsetService().saveTabset(ts)
      }

      this.tabsets.set(ts.id, ts)
      markDuplicates(ts)
    },
    setTabsets(ts: Tabset[]) {
      console.log("adding tabsets", ts.length)
      //ts.tabs = _.filter(ts.tabs, (t: Tab) => t !== null)
      const tabsetMap = new Map<string, Tabset>()
      ts.forEach(ts => tabsetMap.set(ts.id, ts))
      this.tabsets = tabsetMap
      //markDuplicates(ts)
    },
    addToPendingTabset(tab: Tab) {
      if (usePermissionsStore().hasFeature(FeatureIdent.IGNORE)) {
        const ignoreTS = this.getTabset('IGNORE')
        if (ignoreTS && tab.url) {
          const foundIndex = ignoreTS.tabs.findIndex((ignoreTab: Tab) => ignoreTab.url?.startsWith(tab.url || 'xxx'))
          if (foundIndex >= 0) {
            console.log("ignoring", tab.url, ignoreTS.tabs[foundIndex].url)
            return false
          }
        }
      }
      this.pendingTabset.tabs.push(tab)
    }
  }
});
