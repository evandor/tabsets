import {defineStore} from 'pinia';
import _ from 'lodash'
import {computed, ref, watch, watchEffect} from "vue";
import {Space} from "src/spaces/models/Space";
import PersistenceService from "src/services/PersistenceService";
import {LocalStorage, uid} from "quasar";
import throttledQueue from "throttled-queue";
import SpacesPersistence from "src/spaces/persistence/SpacesPersistence";
import {Tabset, TabsetSharing, TabsetStatus} from "src/tabsets/models/Tabset";
import TabsetsPersistence from "src/tabsets/persistence/TabsetsPersistence";
import {Tab, TabComment} from "src/tabsets/models/Tab";
import {useTabsetService} from "src/services/TabsetService2";
import {useWindowsStore} from "src/windows/stores/windowsStore";
import {STRIP_CHARS_IN_COLOR_INPUT, STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {useSpacesStore} from "src/spaces/stores/spacesStore";
import {NewOrReplacedTabset} from "src/models/NewOrReplacedTabset";

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
  }

    return {
      initialize,
      tabsets,
      createTabset,
      addTabset,
      saveTabset, // check save vs add vs create
      setTabset,
      deleteTabset
    }
  }
)
