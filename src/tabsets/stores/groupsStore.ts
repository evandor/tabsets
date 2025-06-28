import _ from 'lodash'
import { defineStore } from 'pinia'
import { useUtils } from 'src/core/services/Utils'
import { Tabset } from 'src/tabsets/models/Tabset'
import TabsetsGroupsPersistence from 'src/tabsets/persistence/TabsetsGroupsPersistence'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { ref } from 'vue'

/**
 * a pinia store for chrome groups.
 *
 * 'tabGroups' manages all groups the user has (ever) created; 'currentTagGroups'
 * are the groups currently used in the browser.
 *
 * TabGroups are persisted to the storage provided in the initialize function.
 *
 * Open: should a group without title be tracked?
 */

let storage: TabsetsGroupsPersistence = null as unknown as TabsetsGroupsPersistence

export const useGroupsStore = defineStore('groups', () => {
  const { inBexMode } = useUtils()

  /**
   * the map of all 'ever used' Chrome tab groups, even if they are not currently in use,
   * using the title as key.
   */
  const tabGroups = ref<Map<string, chrome.tabGroups.TabGroup>>(new Map())

  /**
   * the array all actually currently used Chrome tab groups.
   */
  const currentTabGroups = ref<chrome.tabGroups.TabGroup[]>([])

  /**
   * initialize store with
   * @param providedDb a persistence storage
   */
  async function initialize(providedDb: TabsetsGroupsPersistence) {
    // console.debug(' ...initializing groupsStore')
    storage = providedDb
    await init('initialization')
  }

  async function init(trigger: string = '') {
    if (!inBexMode() || !chrome?.tabGroups) {
      return
    }
    const groups = await chrome.tabGroups.query({}) //, (groups) => {

    currentTabGroups.value = groups
    console.log('initializing current tab groups with', currentTabGroups.value)

    // adding potentially new groups to storage
    const res: Promise<any>[] = groups.flatMap((group: chrome.tabGroups.TabGroup) => {
      return storage.addGroup(group)
    })

    // setting all (new and older) groups to 'tabGroups'
    await Promise.all(res)
    tabGroups.value = new Map()
    const res2 = await storage.getGroups()
    res2.forEach((r) => tabGroups.value.set(r.title || '', r))
  }

  // TODO: if groups without title are not tracked at all, this might be unnecessary
  function onCreated(group: chrome.tabGroups.TabGroup) {
    console.debug('group: onCreated', group)
    if (inBexMode() && chrome?.tabGroups && group.title) {
      chrome.tabGroups.query({}, (groups) => {
        currentTabGroups.value = groups
      })
    }
  }

  async function onUpdated(group: chrome.tabGroups.TabGroup) {
    console.debug('group: onUpdated', group)
    if (!inBexMode() || !chrome?.tabGroups) {
      return Promise.resolve()
    }
    const groups = await chrome.tabGroups.query({}) //, (groups) => {
    currentTabGroups.value = groups

    await useGroupsStore().persistGroup(group)

    // update the group names for matching group ids
    for (const ts of [...useTabsetsStore().tabsets.values()]) {
      let matchForTabset = false
      for (const t of ts.tabs) {
        for (const g of groups) {
          if (t.groupId === g.id && t.groupName !== g.title) {
            t.groupName = g.title
            matchForTabset = true
          }
        }
      }
      if (matchForTabset) {
        await useTabsetService().saveTabset(ts as Tabset)
      }
    }

    // update color changes
    for (const g of groups) {
      const tabGroup = findGroup([...tabGroups.value.values()], undefined, g.title)
      if (tabGroup && tabGroup.color !== g.color) {
        await storage.updateGroup(g)
      }
    }
  }

  function initListeners() {
    if (inBexMode() && chrome && chrome.tabGroups) {
      // console.debug(' ...initializing GroupsStore Listeners')
      chrome.tabGroups.onCreated.addListener((group: chrome.tabGroups.TabGroup) => onCreated(group))
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      chrome.tabGroups.onRemoved.addListener((group: chrome.tabGroups.TabGroup) => init('onRemoved'))
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      chrome.tabGroups.onMoved.addListener((group: chrome.tabGroups.TabGroup) => init('onMoved'))
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      chrome.tabGroups.onUpdated.addListener((group: chrome.tabGroups.TabGroup) => onUpdated(group))
    }
  }

  function findGroup(groups: chrome.tabGroups.TabGroup[], groupId: number | undefined, groupName: string | undefined) {
    if (groupId) {
      for (const g of groups) {
        if (g.id === groupId) {
          return g
        }
      }
    }
    if (groupName) {
      for (const g of groups) {
        if (g.title === groupName) {
          return g
        }
      }
    }
    return undefined
  }

  function groupForName(groupTitle: string | undefined): chrome.tabGroups.TabGroup | undefined {
    if (inBexMode() && chrome && chrome.tabGroups && groupTitle) {
      return _.find([...tabGroups.value.values()], (g: chrome.tabGroups.TabGroup) => g.title === groupTitle)
    }
    return undefined
  }

  function currentGroupForName(groupName: string | undefined = undefined): chrome.tabGroups.TabGroup | undefined {
    if (inBexMode() && chrome?.tabGroups && groupName) {
      return findGroup(currentTabGroups.value, undefined, groupName)
    }
    return undefined
  }

  function currentGroupForId(groupId: number): chrome.tabGroups.TabGroup | undefined {
    if (inBexMode() && chrome?.tabGroups) {
      return findGroup(currentTabGroups.value, groupId, undefined)
    }
    return undefined
  }

  /**
   * persisting a group means adding it making sure it does not exist, but based on its ID
   * @param group
   */
  async function persistGroup(group: chrome.tabGroups.TabGroup) {
    if (group.title) {
      console.debug('persisting group', group)
      const existingGroups = await storage.getGroups()
      //console.log("got existing groups", existingGroups)

      const index = existingGroups.findIndex((g) => {
        return g.id === group.id && g.title !== group.title
      })
      if (index < 0) {
        // no group exits yet with same id and different title
        await storage.addGroup(JSON.parse(JSON.stringify(group)) as chrome.tabGroups.TabGroup)
      } else {
        const existingGroup = existingGroups[index]
        console.debug('replacing group', existingGroup, group)
        await storage.deleteGroupByTitle(existingGroup!.title || '')
        await persistGroup(group)
      }
    }
  }

  function updateGroup(group: chrome.tabGroups.TabGroup) {
    return storage.updateGroup(group)
  }

  function deleteGroupByTitle(title: string) {
    tabGroups.value.delete(title)
    return storage.deleteGroupByTitle(title)
  }

  return {
    initialize,
    initListeners,
    groupForName,
    currentGroupForName,
    currentGroupForId,
    tabGroups,
    currentTabGroups,
    persistGroup,
    updateGroup,
    deleteGroupByTitle,
  }
})
