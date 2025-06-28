import _ from 'lodash'
import { defineStore } from 'pinia'
import { LocalStorage } from 'quasar'
import { SettingIdent } from 'src/app/models/SettingIdent'
import { computed, ref, watch } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const settingToggles = ref<string[]>([])
  const thresholds = ref({
    min: 0,
    max: 40,
  })
  const thumbnailQuality = ref(75)

  const isEnabled = computed(
    () => (ident: string) => _.findIndex(settingToggles.value, (e: string) => e === ident) >= 0,
  )
  const isDisabled = computed(
    () => (ident: string) => _.findIndex(settingToggles.value, (e: string) => e === ident) < 0,
  )

  watch(
    thresholds,
    (thresholdsVal: Object) => {
      LocalStorage.setItem('thresholds', thresholdsVal)
    },
    { deep: true },
  )

  watch(thumbnailQuality, (val: Object) => LocalStorage.setItem('thumbnailQuality', val))

  function initialize() {
    // console.debug(' ...initializing settingsStore', '✅')
    settingToggles.value = (LocalStorage.getItem('settings') as string[]) || []
    // if (fts) {
    //   //console.debug(` ...determining activeToggles from '${fts}'`)
    //   settingToggles.value = _.map(fts.split(','), (e: any) => e.trim())
    //   //console.debug('activeToggles', settingToggles.value)
    // }
    const ths = LocalStorage.getItem('thresholds') as { min: number; max: number }
    if (ths) {
      thresholds.value = ths
    }
    const tnq = LocalStorage.getItem('thumbnailQuality') as number
    if (tnq) {
      thumbnailQuality.value = tnq
    }
  }

  // function setFeatureToggle(ident: string, setActive: boolean) {
  //   console.log('setting activeToggles', ident, setActive)
  //   const index = settingToggles.value.indexOf(ident)
  //   if (index >= 0 && !setActive) {
  //     settingToggles.value.splice(index, 1)
  //   } else if (index < 0 && setActive) {
  //     settingToggles.value.push(ident)
  //   }
  //   // TODO 'settings' vs 'ui.activeFeatures'
  //   //LocalStorage.setItem('settings', _.join(settingToggles.value, ','))
  // }

  function setToggle(ident: string, setActive: boolean) {
    console.log('setting toggle>', ident, setActive, settingToggles.value)
    const index = settingToggles.value.indexOf(ident)
    console.log('got index', index)
    if (index >= 0 && !setActive) {
      settingToggles.value.splice(index, 1)
    } else if (index < 0 && setActive) {
      settingToggles.value.push(ident)
    }
    console.log('result', settingToggles.value)
    LocalStorage.setItem('settings', settingToggles.value)
  }

  const has = computed(() => {
    return (setting: SettingIdent): boolean => {
      return settingToggles.value && settingToggles.value.includes(setting)
    }
  })

  return { initialize, setToggle, isEnabled, isDisabled, thresholds, thumbnailQuality, has }
})
