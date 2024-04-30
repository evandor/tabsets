import {defineStore} from 'pinia';
import _, {forEach} from 'lodash'
import {LocalStorage, uid, useQuasar} from "quasar";
import {Tabset, TabsetSharing, TabsetStatus, TabsetType} from "src/tabsets/models/Tabset";
import {Tab, TabComment, UrlExtension} from "src/tabsets/models/Tab";
import ChromeApi from "src/services/ChromeApi";
import {NewOrReplacedTabset} from "src/models/NewOrReplacedTabset";
import {useSpacesStore} from "src/spaces/stores/spacesStore";
import {SpecialTabsetIdent} from "src/domain/tabsets/CreateSpecialTabset";
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

    /**
     * a named list of tabsets managed by this extension.
     */
    tabsets: new Map<string, Tabset>(),


    // use listeners? Might make sense to turn them off when restoring old tabset for example
    listenersOn: true

  }),

  getters: {




  },

  actions: {
    async initialize() {
      console.debug(" ...initializing tabsStore")

      //this.pendingTabset = new Tabset("pending", "pending", [], [])
    },


    // async updateOrCreateTabset(
    //   tabsetName: string,
    //   tabs: Tab[],
    //   merge: boolean = false,
    //   windowId: string = 'current',
    //   type: TabsetType = TabsetType.DEFAULT,
    //   color: string | undefined = undefined
    // ): Promise<NewOrReplacedTabset> {
    //
    //   const foundTS: Tabset | undefined = _.find([...this.tabsets.values()] as Tabset[], ts => ts.name === tabsetName)
    //   let ts: Tabset = null as unknown as Tabset
    //   //const tabsetExtensionTab = await ChromeApi.getCurrentTab()
    //   const currentSpace = useSpacesStore().space
    //   if (foundTS) {
    //     if (foundTS.status === TabsetStatus.DELETED) {
    //       foundTS.status = TabsetStatus.DEFAULT
    //       foundTS.tabs = []
    //     }
    //     if (merge) {
    //       _.forEach(tabs, t => {
    //         const exists = _.find(foundTS.tabs, existing => existing.url === t.url)
    //         if (!exists) {
    //           foundTS.tabs.push(t)
    //         }
    //       })
    //       ts = foundTS
    //     } else {
    //       ts = new Tabset(foundTS.id, tabsetName, _.map(tabs, t => t), [])
    //       ts.type = type
    //       ts.window = windowId
    //       ts.color = color
    //       this.tabsets.set(foundTS.id, ts)
    //     }
    //   } else {
    //     const useId = uid()
    //     ts = new Tabset(useId, tabsetName, tabs, [])
    //     ts.type = type
    //     ts.window = windowId
    //     ts.color = color
    //     this.tabsets.set(useId, ts)
    //   }
    //   if (currentSpace && currentSpace.id && ts.spaces.findIndex(s => s === currentSpace.id) < 0) {
    //     ts.spaces.push(currentSpace.id)
    //   }
    //
    //
    //   return new NewOrReplacedTabset(foundTS !== undefined, ts)
    // },

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
    // setTabsets(ts: Tabset[]) {
    //   console.log("adding tabsets", ts.length)
    //   //ts.tabs = _.filter(ts.tabs, (t: Tab) => t !== null)
    //   const tabsetMap = new Map<string, Tabset>()
    //   ts.forEach(ts => tabsetMap.set(ts.id, ts))
    //   this.tabsets = tabsetMap
    //   //markDuplicates(ts)
    // },
    // addToPendingTabset(tab: Tab) {
    //   if (usePermissionsStore().hasFeature(FeatureIdent.IGNORE)) {
    //     const ignoreTS = this.getTabset('IGNORE')
    //     if (ignoreTS && tab.url) {
    //       const foundIndex = ignoreTS.tabs.findIndex((ignoreTab: Tab) => ignoreTab.url?.startsWith(tab.url || 'xxx'))
    //       if (foundIndex >= 0) {
    //         console.log("ignoring", tab.url, ignoreTS.tabs[foundIndex].url)
    //         return false
    //       }
    //     }
    //   }
    //   this.pendingTabset.tabs.push(tab)
    // },

    clearTabsets() {
      this.tabsets = new Map<string, Tabset>()
    }
  }
});
