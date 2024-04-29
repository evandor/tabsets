import {defineStore} from 'pinia';
import _, {forEach} from 'lodash'
import {LocalStorage, uid, useQuasar} from "quasar";
import {Tabset, TabsetSharing, TabsetStatus, TabsetType} from "src/tabsets/models/Tabset";
import {Tab, TabComment, UrlExtension} from "src/tabsets/models/Tab";
import ChromeApi from "src/services/ChromeApi";
import {NewOrReplacedTabset} from "src/models/NewOrReplacedTabset";
import {useSpacesStore} from "src/spaces/stores/spacesStore";
import {SpecialTabsetIdent} from "src/domain/tabsets/CreateSpecialTabset";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {Space} from "src/spaces/models/Space";
import {useTabsetService} from "src/services/TabsetService2";
import {useWindowsStore} from "src/windows/stores/windowsStore";
import {TabAndTabsetId} from "src/tabsets/models/TabAndTabsetId";

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
  // _.forEach(tabset.tabs, t => {
  //   t.isDuplicate = duplicates.has(t.url || 'undefined');
  // })
}

export const useTabsStore = defineStore('tabs', {
  state: () => ({

    // cannot use type chrome.tabs.Tab if not in bex mode
//    currentChromeTab: null as unknown as chrome.tabs.Tab,
    // tab by window id
  //  currentChromeTabs: new Map() as Map<number, chrome.tabs.Tab>,

    /**
     * a named list of tabsets managed by this extension.
     */
    tabsets: new Map<string, Tabset>(),

    /**
     * if the user opens a new tab, this will be stored here
     */
    pendingTabset: null as unknown as Tabset,

    // which tabset should be shown in the extension?
    currentTabsetId: null as unknown as string,

    // use listeners? Might make sense to turn them off when restoring old tabset for example
    listenersOn: true

  }),

  getters: {

    pinnedTabs(state): Tab[] {
      return []
    },

    mostAccessedTabs(state): Tab[] {
      const allTabs: Tab[] =
        _.orderBy(
          _.filter(
            _.flatMap(
              _.filter(
                _.map([...this.tabsets.values()] as Tabset[], (ts: Tabset) => ts),
                (ts: Tabset) => ts.status === TabsetStatus.DEFAULT || ts.status === TabsetStatus.FAVORITE),
              (ts: Tabset) => ts.tabs), (t: Tab) => t.activatedCount > 1),
          (t: Tab) => t.activatedCount, ['desc'])
      return allTabs.slice(0, 12)
    },

    // tabsCount(): number {
    //   return this.tabs.length
    // },
    // getChromeTabs: (state): chrome.tabs.Tab[] => state.tabs,
    tabsetNames: (state) => _.map([...state.tabsets.keys()], key => {
      const tabset = state.tabsets.get(key)
      return tabset?.name || 'unknown'
    }),
    getCurrentTabs: (state): Tab[] => {
      return state.tabsets.get(state.currentTabsetId)?.tabs as Tab[] || []
    },
    getCurrentTabset: (state): Tabset | undefined => {
      //console.log("calling getcurrenttabset", state.currentTabsetId)
      return state.tabsets.get(state.currentTabsetId) as Tabset
    },
    getTabset: (state) => {
      return (tabsetId: string): Tabset | undefined => {
        return state.tabsets.get(tabsetId) as Tabset
      }
    },
    currentTabsetName: (state): string | undefined => {
      const candidates = _.filter([...state.tabsets.values()], ts => ts.id === state.currentTabsetId)
      if (candidates.length > 0) {
        return candidates[0].name
      }
      return undefined
    },

    tabForUrlInSelectedTabset: (state): (url: string) => Tab | undefined => {
      const tabs: Tab[] = state.tabsets.get(state.currentTabsetId)?.tabs as Tab[] || []
      return (url: string) => _.find(tabs, t => t.url === url)
    },

    tabsForUrl: (state): (url: string) => Tab[] => {
      return (url: string) => {
        const tabs: Tab[] = []
        forEach([...state.tabsets.values()] as Tabset[], (ts: Tabset) => {
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
        return _.find([...state.tabsets.values()] as Tabset[], (ts: Tabset) => {
          if (space === null) {
            return ts.name === trustedName?.trim()
          } else {
            return ts.name === trustedName?.trim() && ts.spaces.indexOf(space.id) >= 0
          }
        })
      }
    },

    getTabAndTabsetId: (state) => {
      return (tabId: string): TabAndTabsetId | undefined => {
        console.log("call to getTab1", tabId)
        for (const [key, value] of state.tabsets) {
          const found = useTabsetService().findTabInFolder([value as Tabset], tabId)
          // const found: Tab | undefined = _.find(value.tabs, t => {
          //   return t.id === tabId
          // })
          if (found && found.tab) {
            return new TabAndTabsetId(found.tab, value.id)
          }
        }
        return undefined
      }
    },

    tabsetFor: (state) => {
      return (tabId: string): Tabset | undefined => {
        for (const [key, value] of state.tabsets) {
          if (_.find(value.tabs, t => t.id === tabId)) {
            return value as Tabset
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
      _.forEach([...state.tabsets.values()] as Tabset[], (ts: Tabset) => {
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

  },

  actions: {
    async initialize() {
      console.debug(" ...initializing tabsStore")

      this.pendingTabset = new Tabset("pending", "pending", [], [])
    },

    tabsForGroup(groupId: number): chrome.tabs.Tab[] {
      // @ts-ignore
      return _.filter(this.tabs, (t: chrome.tabs.Tab) => t.groupId === groupId)
    },

    selectCurrentTabset(tabsetId: string): Tabset | undefined {
      const found = _.find([...this.tabsets.values()] as Tabset[], k => {
        const ts = k || new Tabset("", "", [])
        return ts.id === tabsetId
      })
      if (found) {
        // console.log("found", found)
        this.currentTabsetId = tabsetId //this.tabsets.get(found) || new Tabset("", "", [])

        //ChromeApi.buildContextMenu("tabsStore")

        return found
      } else {
        console.debug("not found:", tabsetId)//, [...this.tabsets.values()])
      }
      return undefined
    },

    removeTab(tabset: Tabset, tabId: string) {
      tabset.tabs = _.filter(tabset.tabs as Tab[], (t: Tab) => t.id !== tabId)
      markDuplicates(tabset)
      if (this.pendingTabset) {
        this.pendingTabset.tabs = _.filter(this.pendingTabset.tabs as Tab[], (t: Tab) => t.id !== tabId)
      }
      for (const folder of tabset.folders || []) {
        this.removeTab(folder, tabId)
      }
    },

    async updateOrCreateTabset(
      tabsetName: string,
      tabs: Tab[],
      merge: boolean = false,
      windowId: string = 'current',
      type: TabsetType = TabsetType.DEFAULT,
      color: string | undefined = undefined
    ): Promise<NewOrReplacedTabset> {

      const foundTS: Tabset | undefined = _.find([...this.tabsets.values()] as Tabset[], ts => ts.name === tabsetName)
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
        } else {
          ts = new Tabset(foundTS.id, tabsetName, _.map(tabs, t => t), [])
          ts.type = type
          ts.window = windowId
          ts.color = color
          this.tabsets.set(foundTS.id, ts)
        }
      } else {
        const useId = uid()
        ts = new Tabset(useId, tabsetName, tabs, [])
        ts.type = type
        ts.window = windowId
        ts.color = color
        this.tabsets.set(useId, ts)
      }
      if (currentSpace && currentSpace.id && ts.spaces.findIndex(s => s === currentSpace.id) < 0) {
        ts.spaces.push(currentSpace.id)
      }


      return new NewOrReplacedTabset(foundTS !== undefined, ts)
    },

    getOrCreateSpecialTabset(ident: SpecialTabsetIdent, type: TabsetType): Tabset {
      console.log("creating special tabset", ident, type)
      const foundTS: Tabset | undefined = _.find([...this.tabsets.values()] as Tabset[], ts => ts.id === ident.toString())
      let ts: Tabset = null as unknown as Tabset
      if (foundTS) {
        ts = foundTS
        ts.status = TabsetStatus.DEFAULT
      } else {
        const id = ident.toString()
        ts = new Tabset(id, id, [])
        if (ident === SpecialTabsetIdent.HELP) {
          const documentation = ChromeApi.createChromeTabObject(
            "Documentation", "https://docs.tabsets.net")
          const documentationTab = new Tab(uid(), documentation)
          documentationTab.description = "find out about Tabsets' Features"
          ts = new Tabset(id, id, [
            documentationTab,
            new Tab(uid(), ChromeApi.createChromeTabObject(
              "Philosophy", "https://tabsets.web.app/#/philosophy")),
            new Tab(uid(), ChromeApi.createChromeTabObject(
              "Pricacy", "https://tabsets.web.app/#/privacy")),
            new Tab(uid(), ChromeApi.createChromeTabObject(
              "Terms of service", "https://tabsets.web.app/#/tos")),
          ])
          ts.status = TabsetStatus.HIDDEN
        }

        this.tabsets.set(id, ts)
        console.log("tabsets set to ", this.tabsets)
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

    addTabset(ts: Tabset) {
      //console.log("adding tabset", ts)
      ts.tabs = _.filter(ts.tabs, (t: Tab) => t !== null)

      // this part is meant to be used to update tabs in case properties
      // are deprecated
      let foundSomething = false
      ts.tabs.forEach((t: Tab) => {
        if (t.note && t.note.trim().length > 0) {
          foundSomething = true
          console.warn("deprecated property: found tab with note, turning into comment")
          if (!t.comments) {
            t.comments = []
          }
          t.comments.push(new TabComment("",t.note))
          delete t['note' as keyof object]
        }
      })
      if (foundSomething) {
        useTabsetService().saveTabset(ts)
      }

      useWindowsStore().addToWindowSet(ts.window)

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
    },

    clearTabsets() {
      this.tabsets = new Map<string, Tabset>()
    }
  }
});
