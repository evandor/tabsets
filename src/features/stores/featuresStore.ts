import { defineStore } from 'pinia'
import { AppFeatures } from 'src/app/models/AppFeatures'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { useUtils } from 'src/core/services/Utils'
import FeaturesPersistence from 'src/features/persistence/FeaturesPersistence'
import { useFirebaseServices } from 'src/services/firebase/useFirebaseServices'
import { ref } from 'vue'

export const useFeaturesStore = defineStore('features', () => {
  const { sendMsg, inBexMode } = useUtils()

  let storage = null as unknown as FeaturesPersistence

  // related to browser permissions
  const grantedOptionalPermissions = ref<string[] | undefined>([])
  const grantedOptionalOrigins = ref<string[] | undefined>([])
  const permissions = ref<chrome.permissions.Permissions | undefined>(undefined)

  // related to tabsets permissions
  const activeFeatures = ref<string[]>([])

  async function initialize(persistence: FeaturesPersistence) {
    console.debug(` ...initializing featuresStore (${persistence?.getServiceName()})`)
    storage = persistence
    await storage.init(useFirebaseServices().firebaseServices)
    await load()
  }

  async function load() {
    activeFeatures.value = await storage.getActiveFeatures()
    if (inBexMode() && chrome && chrome.permissions) {
      // issues in vitest where chrome is not defined
      permissions.value = await chrome.permissions.getAll()
      if (permissions.value) {
        grantedOptionalPermissions.value = permissions.value.permissions ? permissions.value.permissions : []
        grantedOptionalOrigins.value = permissions.value.origins ? permissions.value.origins : []
      }
    }
  }

  function activateFeature(feature: string) {
    console.log('activate feature', feature, activeFeatures.value)
    if (storage && activeFeatures.value.indexOf(feature) < 0) {
      // console.log("===<", activeFeatures.value)

      // check against enum
      const featureIdent = FeatureIdent[feature.toUpperCase() as keyof typeof FeatureIdent]
      if (!featureIdent) {
        throw new Error(`unknown feature called ${feature}`)
      }
      activeFeatures.value.push(feature.toLowerCase())
      storage.saveActiveFeatures(activeFeatures.value)

      // if (FeatureIdent.SPACES.toLowerCase() === feature) {
      //   useSuggestionsStore().inactivateSuggestion(Suggestion.getStaticSuggestion('TRY_SPACES_FEATURE'))
      // }
      // if (FeatureIdent.BACKUP.toLowerCase() === feature) {
      //   useCommandExecutor().executeFromUi(new CreateSpecialTabsetCommand(SpecialTabsetIdent.BACKUP, TabsetType.SPECIAL))
      // }
      // if (FeatureIdent.HELP.toLowerCase() === feature) {
      //   useCommandExecutor().executeFromUi(new CreateSpecialTabsetCommand(SpecialTabsetIdent.HELP, TabsetType.SPECIAL))
      // } else if (FeatureIdent.IGNORE.toLowerCase() === feature) {
      //   //useSuggestionsStore().removeSuggestion(StaticSuggestionIdent.TRY_TAB_DETAILS_FEATURE)
      //   useCommandExecutor().executeFromUi(new CreateSpecialTabsetCommand(SpecialTabsetIdent.IGNORE, TabsetType.SPECIAL))
      // }
      sendMsg('feature-activated', { feature: feature })
    } else if (!storage) {
      console.warn('storage is not set in featuresStore!')
    }
  }

  function deactivateRecursive(feature: string) {
    console.log('deactivate recursive: ', feature)
    const deactivatedIdent = feature.toUpperCase() as FeatureIdent

    //console.log("deactivating normal feature", feature)
    const index = activeFeatures.value.indexOf(feature)
    if (index >= 0) {
      // if (FeatureIdent.HELP.toLowerCase() === feature) {
      //   useTabsetService().deleteTabset("HELP")
      //   // Notify.create({
      //   //     color: 'warning',
      //   //     message: "The Help pages have been deleted"
      //   // })
      // }
      activeFeatures.value.splice(index, 1)
      storage.saveActiveFeatures(activeFeatures.value)
      sendMsg('feature-deactivated', { feature: feature })
      new AppFeatures().getFeatures().forEach((f) => {
        if (
          f.requires.findIndex((r: string) => {
            return r === deactivatedIdent.toString()
          }) >= 0
        ) {
          console.log('need to deactivate as well:', f)
          deactivateRecursive(f.ident.toLowerCase())
        }
      })
      //console.log("deactivated", feature, activeFeatures.value)
    }
  }

  const deactivateFeature = (feature: string): void => {
    //console.log("deactivating", feature)
    deactivateRecursive(feature)
  }

  // const hasFeature = computed(() => {
  //   return (feature: FeatureIdent): boolean => {
  //     // if (feature === FeatureIdent.SIDE_PANEL) {
  //     //   // @ts-expect-error TODO
  //     //   return chrome.sidePanel !== undefined
  //     // }
  //     const appFeature = new AppFeatures().getFeature(feature)
  //     if (appFeature) {
  //       return activeFeatures.value.indexOf(feature.toLowerCase()) >= 0
  //     }
  //     return false
  //   }
  // })

  const hasFeature = (feature: FeatureIdent): boolean => {
    // if (feature === FeatureIdent.SIDE_PANEL) {
    //   // @ts-expect-error TODO
    //   return chrome.sidePanel !== undefined
    // }
    const appFeature = new AppFeatures().getFeature(feature)
    if (appFeature) {
      return activeFeatures.value.indexOf(feature.toLowerCase()) >= 0
    }
    return false
  }

  return {
    initialize,
    activeFeatures,
    hasFeature,
    activateFeature,
    deactivateFeature,
  }
})
