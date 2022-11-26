import {defineStore} from 'pinia';
import _ from 'lodash'
import {computed, ref, watch} from "vue";
import {Space} from "src/models/Space";
import {useTabsStore} from "stores/tabsStore";
import {useQuasar} from "quasar";


export const useSettingsStore = defineStore('settings', () => {

  const $q = useQuasar()

  const thresholds = ref($q.localStorage.getItem('thresholds') || {
    min: 10,
    max: 40
  })

  watch(
    thresholds,
    (thresholdsVal: Object) => {
      $q.localStorage.set("thresholds", thresholdsVal)
    }, {deep: true}
  )

  return {thresholds}
})
