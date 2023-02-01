import {defineStore} from 'pinia';
import { ref, watch} from "vue";
import {useQuasar} from "quasar";


export const useSettingsStore = defineStore('settings', () => {

  const $q = useQuasar()

  const thresholds = ref($q.localStorage.getItem('thresholds') || {
    min: 0,
    max: 40
  })

  const thumbnailQuality = ref($q.localStorage.getItem('thumbnailQuality') || 25)

  watch(
    thresholds,
    (thresholdsVal: Object) => {
      $q.localStorage.set("thresholds", thresholdsVal)
    }, {deep: true}
  )

  watch(thumbnailQuality, (val: Object) => $q.localStorage.set("thumbnailQuality", val))

  return {thresholds, thumbnailQuality}
})
