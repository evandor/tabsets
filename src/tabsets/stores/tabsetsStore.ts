import {defineStore} from 'pinia';
import _ from 'lodash'
import {computed, ref, watch, watchEffect} from "vue";
import {LocalStorage, uid} from "quasar";
import {Tabset, TabsetSharing, TabsetStatus} from "src/tabsets/models/Tabset";
import TabsetsPersistence from "src/tabsets/persistence/TabsetsPersistence";
import {Tab, TabComment} from "src/tabsets/models/Tab";
import {useTabsetService} from "src/services/TabsetService2";
import {useWindowsStore} from "src/windows/stores/windowsStore";
import {STRIP_CHARS_IN_COLOR_INPUT, STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {Space} from "src/spaces/models/Space";

/**
 * a pinia store for "Tabsets".
 *
 * Elements are persisted to the storage provided in the initialize function; the currently
 * selected space id is written to (and read from) local storage.
 */

export const useTabsetsStore = defineStore('tabsets', () => {

    /**
     * the (internal) storage for this store to use
     */
    let storage: TabsetsPersistence = null as unknown as TabsetsPersistence

    /**
     * a named list of tabsets managed by this extension.
     */
    const tabsets = ref<Map<string, Tabset>>(new Map<string, Tabset>())

    const currentTabset = ref<Tabset | undefined>(undefined)

    /**
     * initialize store with
     * @param ps a persistence storage
     */
    async function initialize(ps: TabsetsPersistence) {
      console.debug(" ...initializing tabsetsStore", ps.getServiceName())
      storage = ps
      await storage.init()
      // TODO remove after version 0.4.12
      await storage.migrate()
      await storage.loadTabsets()
    }

    function setTabset(ts: Tabset) {
      tabsets.value.set(ts.id, ts)
    }

    async function createTabset(tabsetName: string, tabs: Tab[], color: string | undefined = undefined) {
      const trustedName = tabsetName.replace(STRIP_CHARS_IN_USER_INPUT, '')
        .substring(0, 31)
      const trustedColor = color ?
        color.replace(STRIP_CHARS_IN_COLOR_INPUT, '').substring(0, 31)
        : undefined

      const tabsetWithSameName: Tabset | undefined = _.find([...tabsets.value.values()] as Tabset[], ts => ts.name === trustedName)
      let ts: Tabset = null as unknown as Tabset
      //const currentSpace = useSpacesStore().space
      if (tabsetWithSameName) {
        if (tabsetWithSameName.status === TabsetStatus.DELETED) {
          // TODO
          // delete Tabset(tabsetWithSameName)
        } else {
          return Promise.reject(`tabset with same name ('${trustedName}') exists already`)
        }
      }

      ts = new Tabset(uid(), trustedName, tabs, [])
      ts.color = trustedColor
      tabsets.value.set(ts.id, ts)
      await storage.addTabset(ts)

      // TODO
      // if (currentSpace && currentSpace.id && ts.spaces.findIndex(s => s === currentSpace.id) < 0) {
      //   ts.spaces.push(currentSpace.id)
      // }

      return Promise.resolve()
    }

    function addTabset(ts: Tabset) {
      console.log("adding tabset (new)", ts)
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
          t.comments.push(new TabComment("", t.note))
          delete t['note' as keyof object]
        }
      })
      if (foundSomething) {
        useTabsetService().saveTabset(ts)
      }

      useWindowsStore().addToWindowSet(ts.window)

      if (ts.sharing === TabsetSharing.PUBLIC_LINK || ts.sharing === TabsetSharing.PUBLIC_LINK_OUTDATED) {
        // MqttService.init()
        // if (ts.sharedId) {
        //   MqttService.subscribe(ts.sharedId)
        // }
      }

      tabsets.value.set(ts.id, ts)
      // TODO markDuplicates(ts)
    }

    function saveTabset(ts: Tabset) {
      return storage.saveTabset(JSON.parse(JSON.stringify(ts)))
    }

    function deleteTabset(tsId: string) {
      return storage.deleteTabset(tsId)
        .then((res) => {
          if (currentTabset.value && currentTabset.value.id === tsId) {
            currentTabset.value = undefined
          }
          return res
        })
    }


    // deleteTabset(tabsetId: string) {
    //   this.tabsets.delete(tabsetId)
    //   if (this.currentTabsetId === tabsetId) {
    //     this.currentTabsetId = null as unknown as string
    //   }
    // },

    function selectCurrentTabset(tabsetId: string): Tabset | undefined {
      const found = _.find([...tabsets.value.values()] as Tabset[], k => {
        const ts = k || new Tabset("", "", [])
        return ts.id === tabsetId
      })
      if (found) {
        // console.log("found", found)
        currentTabset.value = found //this.tabsets.get(found) || new Tabset("", "", [])

        //ChromeApi.buildContextMenu("tabsStore")
        return found
      } else {
        console.debug("not found:", tabsetId)//, [...this.tabsets.values()])
      }
      return undefined
    }

    function unsetCurrentTabset(): void {
      currentTabset.value = undefined
    }

    // *** getters ***

    const getCurrentTabs = computed(() => currentTabset.value ? currentTabset.value.tabs : [])
    const getCurrentTabset = computed(() => currentTabset.value)

    const currentTabsetName = computed(() => currentTabset.value ? currentTabset.value.name : undefined)

    const tabForUrlInSelectedTabset = computed(() => {
      return (url: string): Tab | undefined => {
        const tabs: Tab[] = currentTabset.value ? currentTabset.value.tabs as Tab[] : []
        return _.find(tabs, t => t.url === url)
      }
    })

    const mostAccessedTabs = computed(() => {
      const allTabs: Tab[] =
        _.orderBy(
          _.filter(
            _.flatMap(
              _.filter(
                _.map([...tabsets.value.values()] as Tabset[], (ts: Tabset) => ts),
                (ts: Tabset) => ts.status === TabsetStatus.DEFAULT || ts.status === TabsetStatus.FAVORITE),
              (ts: Tabset) => ts.tabs), (t: Tab) => t.activatedCount > 1),
          (t: Tab) => t.activatedCount, ['desc'])
      return allTabs.slice(0, 12)
    })

    const getTabset = computed(() => {
      return (tabsetId: string): Tabset | undefined => {
        return tabsets.value.get(tabsetId) as Tabset | undefined
      }
    })

  const existingInTabset = computed(() => {
      return (searchName: string, space: Space = null as unknown as Space): Tabset | undefined => {
        const trustedName = searchName.replace(STRIP_CHARS_IN_USER_INPUT, '')
        return _.find([...tabsets.value.values()] as Tabset[], (ts: Tabset) => {
          if (space === null) {
            return ts.name === trustedName?.trim()
          } else {
            return ts.name === trustedName?.trim() && ts.spaces.indexOf(space.id) >= 0
          }
        })
      }

  })

  // existingInTabset: (state) => {
  // },

  // getTabset: (state) => {
    //   return (tabsetId: string): Tabset | undefined => {
    //     return state.tabsets.get(tabsetId) as Tabset
    //   }
    // },
    // const mostAccessedTabs(state): Tab[] {
    //   const allTabs: Tab[] =
    //     _.orderBy(
    //       _.filter(
    //         _.flatMap(
    //           _.filter(
    //             _.map([...this.tabsets.values()] as Tabset[], (ts: Tabset) => ts),
    //             (ts: Tabset) => ts.status === TabsetStatus.DEFAULT || ts.status === TabsetStatus.FAVORITE),
    //           (ts: Tabset) => ts.tabs), (t: Tab) => t.activatedCount > 1),
    //       (t: Tab) => t.activatedCount, ['desc'])
    //   return allTabs.slice(0, 12)
    // },

    // currentTabsetName: (state): string | undefined => {
    //   const candidates = _.filter([...state.tabsets.values()], ts => ts.id === state.currentTabsetId)
    //   if (candidates.length > 0) {
    //     return candidates[0].name
    //   }
    //   return undefined
    // },
    //
    //   tabForUrlInSelectedTabset: (state): (url: string) => Tab | undefined => {
    //   const tabs: Tab[] = state.tabsets.get(state.currentTabsetId)?.tabs as Tab[] || []
    //   return (url: string) => _.find(tabs, t => t.url === url)
    // },

    return {
      initialize,
      tabsets,
      createTabset,
      unsetCurrentTabset,
      addTabset,
      saveTabset, // check save vs add vs create
      setTabset,
      deleteTabset,
      selectCurrentTabset,
      getCurrentTabs,
      getCurrentTabset,
      currentTabsetName,
      tabForUrlInSelectedTabset,
      getTabset,
      existingInTabset
    }
  }
)
