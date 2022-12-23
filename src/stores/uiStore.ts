import {defineStore} from 'pinia';
import {computed, ref, watch} from "vue";
import {useQuasar} from "quasar";


export enum LeftDrawerState {
  SMALL = "SMALL",
  WIDE = "WIDE"
}

export enum LeftDrawerTabs {
  BOOKMARKS = "bookmarks",
  OPEN_TABS = "openTabs",
  UNASSIGNED_TABS = "unassignedTabs",
  SAVED_TABS = "savedTabs",
  SIDEBAR = "sidebar",
  RSS = "rss",
  SCHEDULED = "scheduled"
}

export class LeftDrawer {
  constructor(
    public state: LeftDrawerState,
    public activeTab: LeftDrawerTabs = LeftDrawerTabs.BOOKMARKS) {
  }
}

export const useUiStore = defineStore('ui', () => {

  const $q = useQuasar()

  const leftDrawer = ref<LeftDrawer>($q.localStorage.getItem('ui.leftDrawer') || new LeftDrawer(LeftDrawerState.SMALL))
  const leftDrawerLabelAnimated = ref(false)

  watch(
    leftDrawer,
    (val: Object) => {
      $q.localStorage.set("ui.leftDrawer", val)
    }, {deep: true}
  )

  const leftDrawerLabelIsAnimated = computed(() => {
    return () => {
      return leftDrawerLabelAnimated.value
    }
  })

  function setLeftDrawerLabelAnimated(animated: boolean) {
    leftDrawerLabelAnimated.value = animated
  }


  return {leftDrawer, leftDrawerLabelIsAnimated, setLeftDrawerLabelAnimated}
})
