import {defineStore} from 'pinia';
import _ from 'lodash'
import {computed, ref, watch} from "vue";

export const useFeatureTogglesStore = defineStore('featureToggles', () => {

  const activeToggles = ref<string[]>([])

  const isEnabled = computed(() => (ident: string) => _.findIndex(activeToggles.value, (e: string) => e === ident) >= 0)

  watch(
    activeToggles,
    (activeTogglesVal: string[]) => {
      localStorage.setItem("featureToggles", _.join(activeTogglesVal, ","))
    }, {deep: true}
  )

  function initialize(localStorage: any) {
    console.debug("initializing featureTogglesStore")
    const fts: string | undefined = localStorage.getItem("featureToggles")
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

  return {initialize, setFeatureToggle, isEnabled}
})
