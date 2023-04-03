import {defineStore} from 'pinia';
import _ from 'lodash'
import {computed, ref, watch} from "vue";
import {useQuasar} from "quasar";

export const useSettingsStore = defineStore('settings', () => {

  const $q = useQuasar()

  const activeToggles = ref<string[]>([])
  const thresholds = ref($q.localStorage.getItem('thresholds') || {
    min: 0,
    max: 40
  })
  const thumbnailQuality = ref($q.localStorage.getItem('thumbnailQuality') || 25)
  const isEnabled = computed(() => (ident: string) => _.findIndex(activeToggles.value, (e: string) => e === ident) >= 0)

  watch(
    activeToggles,
    (activeTogglesVal: string[]) => {
      localStorage.setItem("settings", _.join(activeTogglesVal, ","))
    }, {deep: true}
  )

  watch(
    thresholds,
    (thresholdsVal: Object) => {
      $q.localStorage.set("thresholds", thresholdsVal)
    }, {deep: true}
  )

  watch(thumbnailQuality, (val: Object) => $q.localStorage.set("thumbnailQuality", val))

  function initialize(localStorage: any) {
    console.debug("initializing settingsStore")
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
