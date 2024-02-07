import {defineStore} from 'pinia';
import _ from 'lodash'
import {computed, ref, watch} from "vue";
import {useQuasar} from "quasar";

export const useSettingsStore = defineStore('settings', () => {

  const localStorage= useQuasar().localStorage

  const activeToggles = ref<string[]>([])
  const thresholds = ref(localStorage.getItem('thresholds') || {
    min: 0,
    max: 40
  })
  const thumbnailQuality = ref(localStorage.getItem('thumbnailQuality') || 25)
  const isEnabled = computed(() => (ident: string) => _.findIndex(activeToggles.value, (e: string) => e === ident) >= 0)

  watch(
    activeToggles,
    (activeTogglesVal: string[]) => {
      localStorage.set("settings", _.join(activeTogglesVal, ","))
    }, {deep: true}
  )

  watch(
    thresholds,
    (thresholdsVal: Object) => {
      localStorage.set("thresholds", thresholdsVal)
      //console.log("thresholds set to ", thresholdsVal)
    }, {deep: true}
  )

  watch(thumbnailQuality, (val: Object) => localStorage.set("thumbnailQuality", val))

  function initialize(localStorage: any) {
    console.debug(" ...initializing settingsStore")
    const fts: string | undefined = localStorage.getItem("settings")
    if (fts) {
      activeToggles.value = _.map(fts.split(","), e => e.trim())
    }
  }

  function setFeatureToggle(ident: string, setActive: boolean) {
    const index = activeToggles.value.indexOf(ident)
    if (index >= 0 && !setActive) {
      activeToggles.value.splice(index, 1)
    } else if (index < 0 && setActive) {
      activeToggles.value.push(ident)
    }
  }

  return {initialize, setFeatureToggle, isEnabled,thresholds, thumbnailQuality}
})
