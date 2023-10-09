import {defineStore} from 'pinia';
import {ref} from "vue";
import {useUtils} from "src/services/Utils";
import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import PersistenceService from "src/services/PersistenceService";
import _ from "lodash"

/**
 * a pinia store for chrome groups.
 *
 * Elements are persisted to the storage provided in the initialize function
 */

let storage: PersistenceService = null as unknown as PersistenceService

export const useGroupsStore = defineStore('groups', () => {

    const {inBexMode} = useUtils()

    /**
     * the map of all 'ever used' chrome tab groups, even if they are not currently in use
     */
    const tabGroups = ref<Map<number, chrome.tabGroups.TabGroup>>(new Map())

    /**
     * the array all actually currently used chrome tab groups
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
                console.log("currentTabGroups set to ", currentTabGroups.value)

                // adding potentially new groups to storage
                const res: Promise<any>[] = groups.flatMap((group: chrome.tabGroups.TabGroup) => {
                    return storage.upsertGroup(group)
                })

                // setting all (new and older) groups to 'tabGroups'
                Promise.all(res)
                    .then(() => {
                        tabGroups.value = new Map()
                        storage.getGroups().then(res => {
                            console.log("from init: setting groups", res)
                            res.forEach(r => tabGroups.value.set(r.id, r))
                        })
                    })

            })
        }
    }

    function onCreated(group: chrome.tabGroups.TabGroup) {
        if (inBexMode() && chrome?.tabGroups && group.title) {
            // update currentTabGroups
            chrome.tabGroups.query({}, (groups) => {
                currentTabGroups.value = groups
            })

            console.log("creating group in storage", group)
            storage.upsertGroup(group)
                .then((added: boolean) => {
                    tabGroups.value.set(group.id, group)
                })
        }
    }

    function onUpdated(group: chrome.tabGroups.TabGroup) {
        if (inBexMode() && chrome?.tabGroups) {
            // update currentTabGroups
            chrome.tabGroups.query({}, (groups) => {
                currentTabGroups.value = groups
            })

            //console.log("updating group in storage", group)
            storage.upsertGroup(group)
                .then((added: boolean) => {
                    //console.log("setting", group)
                    tabGroups.value.set(group.id, group)
                    // const index = _.findIndex(tabGroups.value, g => g.id === group.id)
                    // if (index >= 0) {
                    //     tabGroups.value.splice(index, 1, group)
                    // } else {
                    //     tabGroups.value.push(group)
                    // }
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
                    console.log("found group by ID", g)
                    return g
                }
            }
        }
        if (groupName) {
            for (const g of groups) {
                if (g.title === groupName) {
                    console.log("found group by name", g)
                    return g
                }
            }
        }
        console.log("no group found for", groupId, groupName)
        console.log("groups", groups)
        console.log("tabGroups", tabGroups.value)
        console.log("currentTabGroups", currentTabGroups.value)

        return undefined
    }

    function groupFor(groupId: number): chrome.tabGroups.TabGroup | undefined {
        if (inBexMode() && usePermissionsStore().hasFeature(FeatureIdent.TAB_GROUPS) && chrome && chrome.tabGroups) {
            return tabGroups.value.get(groupId)
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

    // function deleteGroupByTitle(title: string) {
    //     const groupFound = groupFor(undefined, title)
    //     console.log("found group to delete", groupFound)
    //
    //     // remove here in groupsStore
    //     tabGroups.value.delete()
    //     // delete in DB
    //     return storage.deleteGroupByTitle(title)
    //
    //     // delete in all tabs?
    //
    // }


    return {
        initialize,
        initListeners,
        groupFor,
        currentGroupForName,
        currentGroupForId,
        tabGroups,
        currentTabGroups,
        //deleteGroupByTitle
    }
})
