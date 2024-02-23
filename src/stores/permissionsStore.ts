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
import PersistenceService from "src/services/PersistenceService";


export const usePermissionsStore = defineStore('permissions', () => {

  const $q = useQuasar()
  const {sendMsg} = useUtils()

  let storage = null as unknown as PersistenceService

  // related to chrome permissions
  const grantedOptionalPermissions = ref<string[] | undefined>([])
  const grantedOptionalOrigins = ref<string[] | undefined>([])
  const permissions = ref<chrome.permissions.Permissions | undefined>(undefined)

  // related to tabsets permissions
  const activeFeatures = ref<string[]>($q?.localStorage?.getItem('ui.activeFeatures') as string[] || [])

  async function initialize(ps: PersistenceService) {
    console.debug(" ...initializing PermissionsStore")
    storage = ps
    await load()
  }

  async function load() {
    activeFeatures.value = await storage.getActiveFeatures()
    if (process.env.MODE !== 'bex') {
      return
    }
    if (chrome) { // issues in vitest where chrome is not defined
      // @ts-ignore
            permissions.value = await browser.permissions.getAll()
      if (permissions.value) {
        grantedOptionalPermissions.value = permissions.value.permissions ? permissions.value.permissions : []
        grantedOptionalOrigins.value = permissions.value.origins ? permissions.value.origins : []
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
        const granted: boolean = await browser.permissions.request({permissions: [permission]})
    return load()
      .then(() => Promise.resolve(granted))
  }

  async function grantAllOrigins(): Promise<boolean> {
    // @ts-ignore
        const granted: boolean = await browser.permissions.request({origins: ["*://*/*", "<all_urls>"]})
    return load()
      .then(() => Promise.resolve(granted))
  }

  async function revokePermission(permission: string): Promise<void> {
    // @ts-ignore
        await browser.permissions.remove({permissions: [permission]})
    await load()
    return Promise.resolve()
  }

  async function revokeAllOrigins(): Promise<void> {
    // @ts-ignore
        await browser.permissions.remove({origins: ["*://*/*", "<all_urls>"]})
    await load()
    return Promise.resolve()
  }

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

  const featuresCount = computed(() => (): number =>
    activeFeatures.value.length)

  const activateFeature = computed(() => {
    return (feature: string): void => {
      if (storage && activeFeatures.value.indexOf(feature) < 0) {
        activeFeatures.value.push(feature)
        storage.saveActiveFeatures(activeFeatures.value)

        if (FeatureIdent.SPACES.toLowerCase() === feature) {
          useSuggestionsStore().inactivateSuggestion(Suggestion.getStaticSuggestion(StaticSuggestionIdent.TRY_SPACES_FEATURE))
        }
        if (FeatureIdent.BACKUP.toLowerCase() === feature) {
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
      storage.saveActiveFeatures(activeFeatures.value)
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

  function addActivateFeature(feature: string): boolean {
    if (activeFeatures.value.indexOf(feature) < 0) {
      activeFeatures.value.push(feature)
      return true
    }
    return false
  }

  function removeActivateFeature(feature: string) {
    const index = activeFeatures.value.indexOf(feature)
    if (index >= 0) {
      activeFeatures.value.splice(index, 1)
      return true
    }
    return false
  }

  return {
    initialize,
    load,
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
    featuresCount,
    addActivateFeature,
    removeActivateFeature
  }
})
