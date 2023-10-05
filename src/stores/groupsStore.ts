import {defineStore} from 'pinia';
import {ref} from "vue";
import {useQuasar} from "quasar";
import {useUtils} from "src/services/Utils";
import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";

/**
 * a pinia store for chrome groups.
 *
 * Elements are persisted to the storage provided in the initialize function
 */

export const useGroupsStore = defineStore('groups', () => {

    const {inBexMode} = useUtils()

    const tabGroups = ref<chrome.tabGroups.TabGroup[]>([])

    /**
     * initialize store with
     * @param ps a persistence storage
     */
    async function initialize() {
        console.log("initializing groupsStore")
        init("initialization")
    }

    function init(trigger: string = "") {
        if (inBexMode() && chrome?.tabGroups) {
            chrome.tabGroups.query({}, (groups) => {
                //console.table(groups)
                tabGroups.value = groups
            })
        }
    }

    function initListeners() {
        if (inBexMode() && chrome && chrome.tabGroups) {
            chrome.tabGroups.onCreated.addListener((window: chrome.tabGroups.TabGroup) => init("onCreated"))
            chrome.tabGroups.onRemoved.addListener((window: chrome.tabGroups.TabGroup) => init("onRemoved"))
            chrome.tabGroups.onMoved.addListener((window: chrome.tabGroups.TabGroup) => init("onMoved"))
            chrome.tabGroups.onUpdated.addListener((window: chrome.tabGroups.TabGroup) => init("onUpdated"))
        }
    }

    function groupFor(groupId: number, groupName: string | undefined = undefined): chrome.tabGroups.TabGroup | undefined {
        if (inBexMode() && usePermissionsStore().hasFeature(FeatureIdent.TAB_GROUPS) && chrome && chrome.tabGroups) {
            for (const g of tabGroups.value) {
                if (g.id === groupId) {
                    return g
                }
            }
            if (groupName) {
                for (const g of tabGroups.value) {
                    if (g.title === groupName) {
                        return g
                    }
                }
            }
        }
        return undefined
    }


    return {
        initialize,
        initListeners,
        groupFor,
        tabGroups
    }
})
