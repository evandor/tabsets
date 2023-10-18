import {defineStore} from 'pinia';
import {ref} from "vue";
import {useUtils} from "src/services/Utils";
import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import PersistenceService from "src/services/PersistenceService";
import _ from "lodash"
import {useTabsStore} from "stores/tabsStore";
import {useTabsetService} from "src/services/TabsetService2";

/**
 * a pinia store for chrome groups.
 *
 * Elements are persisted to the storage provided in the initialize function
 */

let storage: PersistenceService = null as unknown as PersistenceService

export const useGroupsStore = defineStore('groups', () => {

    const {inBexMode} = useUtils()

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
     * @param ps a persistence storage
     */
    async function initialize(providedDb: PersistenceService) {
        console.log("initializing groupsStore")
        storage = providedDb
        init("initialization")
    }

    function init(trigger: string = "") {
        if (inBexMode() && chrome?.tabGroups) {
            chrome.tabGroups.query({}, (groups) => {

                currentTabGroups.value = groups
                console.log("initializing current tab groups with", currentTabGroups.value)

                // adding potentially new groups to storage
                const res: Promise<any>[] = groups.flatMap((group: chrome.tabGroups.TabGroup) => {
                    return storage.addGroup(group)
                })

                // setting all (new and older) groups to 'tabGroups'
                Promise.all(res)
                    .then(() => {
                        tabGroups.value = new Map()
                        storage.getGroups().then(res => {
                            res.forEach(r => tabGroups.value.set(r.title || '', r))
                        })
                    })
            })
        }
    }

    function onCreated(group: chrome.tabGroups.TabGroup) {
        console.debug("group: onCreated", group)
        if (inBexMode() && chrome?.tabGroups && group.title) {
            chrome.tabGroups.query({}, (groups) => {
                currentTabGroups.value = groups
            })
        }
    }

    function onUpdated(group: chrome.tabGroups.TabGroup) {
        console.debug("group: onUpdated", group)
        if (inBexMode() && chrome?.tabGroups) {

            chrome.tabGroups.query({}, (groups) => {
                currentTabGroups.value = groups

                //console.log("set currentTabGroups to", groups)

                // update tabGroups
                for (const g of groups) {
                    useGroupsStore().persistGroup(g)
                }

                // update the group names for matching group ids
                for (const ts of [...useTabsStore().tabsets.values()]) {
                    let matchForTabset = false
                    for (const t of ts.tabs) {
                        for (const g of groups) {
                            if (t.groupId === g.id && t.groupName !== g.title) {
                                //console.log("found match", g)
                                t.groupName = g.title
                                matchForTabset = true
                            }
                        }
                    }
                    if (matchForTabset) {
                        useTabsetService().saveTabset(ts)
                    }
                }

                // update color changes
                for (const g of groups) {
                    const tabGroup = findGroup([...tabGroups.value.values()], undefined, g.title)
                    if (tabGroup && tabGroup.color !== g.color) {
                        //console.log("updating group", tabGroup, g)
                        storage.updateGroup(g)
                    }
                }
            })
        }
    }

    function initListeners() {
        if (inBexMode() && chrome && chrome.tabGroups) {
            chrome.tabGroups.onCreated.addListener((group: chrome.tabGroups.TabGroup) => onCreated(group))
            chrome.tabGroups.onRemoved.addListener((group: chrome.tabGroups.TabGroup) => init("onRemoved"))
            chrome.tabGroups.onMoved.addListener((group: chrome.tabGroups.TabGroup) => init("onMoved"))
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
        if (inBexMode() && usePermissionsStore().hasFeature(FeatureIdent.TAB_GROUPS) && chrome && chrome.tabGroups && groupTitle) {
            return _.find([...tabGroups.value.values()], g => g.title === groupTitle)
        }
        return undefined
    }

    function currentGroupForName(groupName: string | undefined = undefined): chrome.tabGroups.TabGroup | undefined {
        if (inBexMode() && usePermissionsStore().hasFeature(FeatureIdent.TAB_GROUPS) && chrome?.tabGroups && groupName) {
            return findGroup(currentTabGroups.value, undefined, groupName)
        }
        return undefined
    }

    function currentGroupForId(groupId: number): chrome.tabGroups.TabGroup | undefined {
        if (inBexMode() && usePermissionsStore().hasFeature(FeatureIdent.TAB_GROUPS) && chrome?.tabGroups) {
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
            console.debug("persisting group", group)
            const existingGroups = await storage.getGroups()
            //console.log("got existing groups", existingGroups)

            const index = existingGroups.findIndex(g => {
                return g.id === group.id && g.title !== group.title
            })
            if ( index < 0) {
                // no group exits yet with same id and different title
                await storage.addGroup(JSON.parse(JSON.stringify(group)) as chrome.tabGroups.TabGroup)
            } else {
                const existingGroup = existingGroups[index]
                console.debug("replacing group", existingGroup,group)
                await storage.deleteGroupByTitle(existingGroup.title || '')
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
        deleteGroupByTitle
    }
})
