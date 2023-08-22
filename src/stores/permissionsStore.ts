// !== MIT
import {defineStore} from 'pinia';
import {computed, ref, watchEffect} from "vue";
import {Notify, useQuasar} from "quasar";
import {FeatureIdent, FeatureType} from "src/models/AppFeature";
import {useSuggestionsStore} from "src/stores/suggestionsStore";
import {StaticSuggestionIdent, Suggestion} from "src/models/Suggestion";
import {CreateSpecialTabsetCommand, SpecialTabsetIdent} from "src/domain/tabsets/CreateSpecialTabset";
import {TabsetType} from "src/models/Tabset";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {AppFeatures} from "src/models/AppFeatures";
import {useDB} from "src/services/usePersistenceService";
import {useUtils} from "src/services/Utils";
import {useTabsetService} from "src/services/TabsetService2";


export const usePermissionsStore = defineStore('permissions', () => {

    const $q = useQuasar()
    const {sendMsg} = useUtils()

    // maybe assign db in init function / setup
    const {localDb} = useDB($q)

    const storage = localDb

    // related to chrome permissions
    const grantedOptionalPermissions = ref<string[] | undefined>([])
    const grantedOptionalOrigins = ref<string[] | undefined>([])
    const permissions = ref<chrome.permissions.Permissions | undefined>(undefined)

    // related to tabsets permissions
    const activeFeatures = ref<string[]>($q?.localStorage?.getItem('ui.activeFeatures') as string[] || [])

    //const inActiveDefaultFeatures = ref<string[]>($q.localStorage?.getItem('ui.inActiveDefaultFeatures') as string[] || [])

    async function initialize() {
        if (storage) {
            //storage.getActiveFeatures().then((res) => activeFeatures.value = res)
            activeFeatures.value = await storage.getActiveFeatures()
            console.log("initialized active features with", activeFeatures.value)
        } else {
            console.warn("storage not provided")
        }
        if (process.env.MODE !== 'bex') {
            return
        }
        console.debug("initializing permissions Store")

        if (chrome) { // issues in vitest where chrome is not defined
            // @ts-ignore
            permissions.value = await chrome.permissions.getAll()
            if (permissions.value) {
                grantedOptionalPermissions.value = permissions.value.permissions ? permissions.value.permissions : []
                grantedOptionalOrigins.value = permissions.value.origins ? permissions.value.origins : []
                console.log("initializing permissions Store done")
            }
        }
    }

    const hasPermission = computed(() => {
        return (permission: string): boolean | undefined => {
            //console.log("query for permission", permission, grantedOptionalPermissions.value.indexOf(permission) >= 0)
            return grantedOptionalPermissions.value ? grantedOptionalPermissions.value.indexOf(permission) >= 0 : undefined
        }
    })

    const hasAllOrigins = computed(() => {
        return (): boolean | undefined => {
            return grantedOptionalOrigins.value ?
                grantedOptionalOrigins.value.indexOf("*://*/*") >= 0
                : undefined
        }
    })

    async function grantPermission(permission: string): Promise<boolean> {
        // @ts-ignore
        const granted: boolean = await chrome.permissions.request({permissions: [permission]})
        return initialize()
            .then(() => Promise.resolve(granted))
    }

    async function grantAllOrigins(): Promise<boolean> {
        // @ts-ignore
        const granted: boolean = await chrome.permissions.request({origins: ["*://*/*", "<all_urls>"]})
        return initialize()
            .then(() => Promise.resolve(granted))
    }

    async function revokePermission(permission: string): Promise<void> {
        // @ts-ignore
        await chrome.permissions.remove({permissions: [permission]})
        await initialize()
        return Promise.resolve()
    }

    async function revokeAllOrigins(): Promise<void> {
        // @ts-ignore
        await chrome.permissions.remove({origins: ["*://*/*", "<all_urls>"]})
        await initialize()
        return Promise.resolve()
    }

    // watchEffect(() => {
    //     if (storage) {
    //         console.log("saving activeFeatures", activeFeatures.value)
    //         storage.saveActiveFeatures(activeFeatures.value)
    //     }
    // })

    const hasFeature = computed(() => {
        return (feature: FeatureIdent): boolean => {
            if (feature === FeatureIdent.SIDE_PANEL) {
                // @ts-ignore
                return chrome.sidePanel !== undefined
            }
            const appFeature = new AppFeatures().getFeature(feature)
            if (appFeature) {
                return activeFeatures.value.indexOf(feature.toLowerCase()) >= 0
            }
            return false
        }
    })

    const featuresCount = computed(() => (): number => activeFeatures.value.length)

    const activateFeature = computed(() => {
        return (feature: string): void => {
            if (activeFeatures.value.indexOf(feature) < 0) {
                activeFeatures.value.push(feature)
                saveActiveFeatures()
                if (FeatureIdent.NEWEST_TABS.toLowerCase() === feature) {
                    useSuggestionsStore().inactivateSuggestion(Suggestion.getStaticSuggestion(StaticSuggestionIdent.TRY_NEWEST_TABS_FEATURE))
                }
                if (FeatureIdent.SPACES.toLowerCase() === feature) {
                    useSuggestionsStore().inactivateSuggestion(Suggestion.getStaticSuggestion(StaticSuggestionIdent.TRY_SPACES_FEATURE))
                }
                if (FeatureIdent.BACKUP.toLowerCase() === feature) {
                    //useSuggestionsStore().removeSuggestion(StaticSuggestionIdent.TRY_TAB_DETAILS_FEATURE)
                    useCommandExecutor().executeFromUi(new CreateSpecialTabsetCommand(SpecialTabsetIdent.BACKUP, TabsetType.SPECIAL))
                }
                if (FeatureIdent.HELP.toLowerCase() === feature) {
                    useCommandExecutor().executeFromUi(new CreateSpecialTabsetCommand(SpecialTabsetIdent.HELP, TabsetType.SPECIAL))
                } else if (FeatureIdent.IGNORE.toLowerCase() === feature) {
                    //useSuggestionsStore().removeSuggestion(StaticSuggestionIdent.TRY_TAB_DETAILS_FEATURE)
                    useCommandExecutor().executeFromUi(new CreateSpecialTabsetCommand(SpecialTabsetIdent.IGNORE, TabsetType.SPECIAL))
                }
                sendMsg('feature-activated', {feature: feature})
            }
        }
    })

    function deactivateRecursive(feature: string) {
        console.log("deactivate recursive: ", feature)
        const deactivatedIdent = feature.toUpperCase() as FeatureIdent
        const appFeature = new AppFeatures().getFeature(deactivatedIdent)

        //console.log("deactivating normal feature", feature)
        const index = activeFeatures.value.indexOf(feature)
        if (index >= 0) {
            if (FeatureIdent.HELP.toLowerCase() === feature) {
                useTabsetService().deleteTabset("HELP")
                // Notify.create({
                //     color: 'warning',
                //     message: "The Help pages have been deleted"
                // })
            }
            activeFeatures.value.splice(index, 1)
            saveActiveFeatures()
            sendMsg('feature-deactivated', {feature: feature})
            new AppFeatures().getFeatures().forEach(f => {
                if (f.requires.findIndex((r: FeatureIdent) => r === deactivatedIdent) >= 0) {
                    console.log("need to deactivate as well:", f)
                    deactivateRecursive(f.ident.toLowerCase())
                }
            })
            //console.log("deactivated", feature, activeFeatures.value)
        }

    }

    const deactivateFeature = computed(() => {
        return (feature: string): void => {
            //console.log("deactivating", feature)
            deactivateRecursive(feature)
        }
    })

    function saveActiveFeatures() {
        if (storage) {
            storage.saveActiveFeatures(activeFeatures.value)
        } else {
            console.warn("could not save change in active features")
        }
    }

    return {
        initialize,
        hasPermission,
        grantPermission,
        revokePermission,
        hasAllOrigins,
        grantAllOrigins,
        revokeAllOrigins,
        permissions,
        hasFeature,
        activateFeature,
        deactivateFeature,
        featuresCount
    }
})
