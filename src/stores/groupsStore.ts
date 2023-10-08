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
     * the array of all 'ever used' chrome tab groups, even if they are not currently in use
     */
    const tabGroups = ref<chrome.tabGroups.TabGroup[]>([])

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
                //console.log("currentTabGroups set to ", currentTabGroups.value)

                const res: Promise<any>[] = groups.flatMap((group: chrome.tabGroups.TabGroup) => {
                    return storage.addGroup(group)
                })
                Promise.all(res)
                    .then(() => {
                        storage.getGroups().then(res => {
                            console.log("from init: setting groups", res)
                            tabGroups.value = res
                        })
                    })

            })
        }
    }

    function onCreated(group: chrome.tabGroups.TabGroup) {
        if (inBexMode() && chrome?.tabGroups && group.title) {
            console.log("creating group", group)
            storage.addGroup(group)
                .then((added: boolean) => {
                    if (added) {
                        tabGroups.value.push(group)
                    }
                })
        }
    }

    function onUpdated(group: chrome.tabGroups.TabGroup) {
        if (inBexMode() && chrome?.tabGroups) {
            console.log("updating group", group)
            storage.addGroup(group)
                .then((added: boolean) => {
                    if (added) {
                        tabGroups.value.push(group)
                    }
                })
        }
    }

    function initListeners() {
        if (inBexMode() && chrome && chrome.tabGroups) {
            chrome.tabGroups.onCreated.addListener((group: chrome.tabGroups.TabGroup) => onCreated(group))
            //chrome.tabGroups.onRemoved.addListener((group: chrome.tabGroups.TabGroup) => init("onRemoved"))
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
        return undefined
    }

    function groupFor(groupId: number | undefined, groupName: string | undefined = undefined): chrome.tabGroups.TabGroup | undefined {
        if (inBexMode() && usePermissionsStore().hasFeature(FeatureIdent.TAB_GROUPS) && chrome && chrome.tabGroups) {
            return findGroup(tabGroups.value, groupId, groupName)
        }
        return undefined
    }

    function currentGroupFor(groupName: string | undefined = undefined): chrome.tabGroups.TabGroup | undefined {
        if (inBexMode() && usePermissionsStore().hasFeature(FeatureIdent.TAB_GROUPS) && chrome?.tabGroups && groupName) {
            return findGroup(currentTabGroups.value, undefined, groupName)
        }
        return undefined
    }

    function deleteGroupByTitle(title: string) {
        const groupFound = groupFor(undefined, title)
        console.log("found group to delete", groupFound)

        // remove here in groupsStore
        const foundIndex = _.findIndex(tabGroups.value, g => g.title === title)
        tabGroups.value.splice(foundIndex,1)

        // delete in DB
        return storage.deleteGroupByTitle(title)

        // delete in all tabs?

    }


    return {
        initialize,
        initListeners,
        groupFor,
        currentGroupFor,
        tabGroups,
        currentTabGroups,
        deleteGroupByTitle
    }
})
