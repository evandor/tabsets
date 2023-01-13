import {defineStore} from 'pinia';
import {computed, ref, watch} from "vue";
import {useQuasar} from "quasar";
import {useRoute} from "vue-router";


export enum LeftDrawerState {
  SMALL = "SMALL",
  WIDE = "WIDE"
}

export enum LeftDrawerTabs {
  BOOKMARKS = "bookmarks",
  OPEN_TABS = "openTabs",
  UNASSIGNED_TABS = "unassignedTabs",
  GROUP_BY_HOST_TABS = "groupedByHostTabs",
  SAVED_TABS = "savedTabs",
  SIDEBAR = "sidebar",
  RSS = "rss",
  SCHEDULED = "scheduled",
  HISTORY = "history",
  FEATURES = "features",
  HELP = "help"
}

export class LeftDrawer {
  constructor(
    public state: LeftDrawerState,
    public activeTab: LeftDrawerTabs = LeftDrawerTabs.OPEN_TABS) {
  }
}

export const useUiStore = defineStore('ui', () => {

  const $q = useQuasar()

  const leftDrawer = ref<LeftDrawer>($q.localStorage.getItem('ui.leftDrawer') || new LeftDrawer(LeftDrawerState.SMALL))
  const leftDrawerLabelAnimated = ref(false)
  const tabsetIdForNewTab = ref<string | undefined>($q.localStorage.getItem('ui.tabsetIdForNewTab') as string || undefined)
  const newTabsetEmptyByDefault = ref<boolean>($q.localStorage.getItem('ui.newTabsetEmptyByDefault') as boolean || false)
  const tabBeingDragged = ref<string | undefined>(undefined)

  // info Messages
  const hiddenMessages = ref<string[]>($q.localStorage.getItem('ui.hiddenInfoMessages') as string[] || [])
  const anotherMessageAlreadyShown = ref(false)

  watch(leftDrawer.value, (val: Object) => {
    $q.localStorage.set("ui.leftDrawer", val)
  }, {deep: true})

  watch(tabsetIdForNewTab, (val: Object) => {
    $q.localStorage.set("ui.tabsetIdForNewTab", val)
  }, {deep: true})

  watch(newTabsetEmptyByDefault,
    (val: Object) => {
      $q.localStorage.set("ui.newTabsetEmptyByDefault", val)
    })

  const route = useRoute()
  watch(route, (to) => {
    console.log("resetting", anotherMessageAlreadyShown.value)
    anotherMessageAlreadyShown.value = false
  }, {flush: 'pre', immediate: true, deep: true})

  // watch(hiddenMessages.value,
  //   (val: string[], val2: string[]) => {
  //     console.log("watching", val, val2)
  //     $q.localStorage.set("ui.hiddenInfoMessages", val)
  //   })

  watch(
    hiddenMessages,
    (thresholdsVal: Object) => {
      $q.localStorage.set("ui.hiddenInfoMessages", thresholdsVal)
    }, {deep: true}
  )

  const leftDrawerLabelIsAnimated = computed(() => {
    return () => leftDrawerLabelAnimated.value
  })

  function setLeftDrawerLabelAnimated(animated: boolean) {
    leftDrawerLabelAnimated.value = animated
  }

  const setTabsetForNewTabPage = (tabsetId: string) => {
    tabsetIdForNewTab.value = tabsetId
  }

  function draggingTab(tabId: string) {
    tabBeingDragged.value = tabId
  }

  function droppingTab() {
    const tabBeingDropped = tabBeingDragged.value
    tabBeingDragged.value = undefined
    return tabBeingDropped
  }

  function setNewTabsetEmptyByDefault(defaultValue: boolean) {
    newTabsetEmptyByDefault.value = defaultValue
  }

  function hideInfoMessage(ident: string) {
    hiddenMessages.value.push(ident)
  }

  function restoreHints() {
    // hiddenMessages.value = [] did not work
    hiddenMessages.value = hiddenMessages.value.splice(0, hiddenMessages.value.length)
    anotherMessageAlreadyShown.value = false
  }

  // const activateFeature = computed(() => {
  //   return (feature: string): void => {
  //     if (activeFeatures.value.indexOf(feature) < 0) {
  //       activeFeatures.value.push(feature)
  //     }
  //   }
  // })

  const showMessage = computed(() => {
    return (ident: string, probability: number = 1) => {
      console.log("checking message", ident, probability, hiddenMessages.value)
      if (hiddenMessages.value.indexOf(ident) >= 0) {
        return false
      }
      return true
      //const random = Math.random()
      //console.log("random", random, props.probability)
      // const couldBeShown = Math.random() < probability
      // console.log("could be shown", couldBeShown, anotherMessageAlreadyShown)
      // if (couldBeShown && !anotherMessageAlreadyShown) {
      //   //anotherMessageAlreadyShown.value = true
      //   return true
      // } else if (anotherMessageAlreadyShown.value) {
      //   return false
      // }
      // return couldBeShown
    }
  })

  return {
    leftDrawer,
    leftDrawerLabelIsAnimated,
    setLeftDrawerLabelAnimated,
    setTabsetForNewTabPage,
    tabsetIdForNewTab,
    draggingTab,
    droppingTab,
    newTabsetEmptyByDefault,
    setNewTabsetEmptyByDefault,
    hideInfoMessage,
    restoreHints,
    showMessage
  }
})
