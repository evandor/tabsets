import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { Tabset, TabsetStatus, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { ref, watchEffect } from 'vue'

export type SelectOption = {
  label: string
  value: string
  disable?: boolean
  icon?: string
  icon_color?: string
}

export type ElementHolder = 'contextmenu' | 'btn' | 'popup'

export function useTabsetSelector(holder: ElementHolder) {
  const tabsets = [...useTabsetsStore().tabsets.values()] as Tabset[]
  const useSpaces = useFeaturesStore().hasFeature(FeatureIdent.SPACES)
  const space = useSpacesStore().space

  console.log(`called with ${holder}, tabsets: ${tabsets.length}`)

  const currentTabset = ref<Tabset | undefined>(useTabsetsStore().getCurrentTabset)
  const tabsetSelectionOptions = ref<SelectOption[]>([])
  const tabsetSelectionModel = ref<SelectOption | undefined>(undefined)
  const stashedTabs = ref(tabsets.filter((ts: Tabset) => ts.type === TabsetType.SESSION).length > 0)

  const automaticSelectionOption = ref({
    label: 'select automatically',
    value: 'automatic-selection',
    icon: 'sym_o_stars_2',
  })

  const setAutomaticSelectionLabel = (newLabel: string) => {
    automaticSelectionOption.value.label = newLabel
  }

  const calculate = () => {
    console.log(`:::calculating... tabsets#: ${tabsets.length}, currentTs: ${currentTabset.value?.id}`)
    tabsetSelectionOptions.value = tabsets
      .filter((ts: Tabset) =>
        useFeaturesStore().hasFeature(FeatureIdent.ARCHIVE_TABSET) ? ts.status !== TabsetStatus.ARCHIVED : true,
      )
      .filter((ts: Tabset) => ts.type !== TabsetType.SPECIAL)
      .filter((ts: Tabset) => ts.type !== TabsetType.SESSION)
      .filter((ts: Tabset) => ts.type !== TabsetType.DYNAMIC)
      //.filter((ts: Tabset) => ts.id !== currentTabset.value?.id)
      .filter((ts: Tabset) => {
        if (useSpaces && space) {
          return ts.spaces.indexOf(space.id) >= 0
        } else if (useSpaces && !space) {
          return ts.spaces?.length === 0
        }
        return true
      })
      .map((ts: Tabset) => {
        return {
          label: ts.name,
          value: ts.id,
          disable: ts.id === currentTabset.value?.id,
        }
      })
      .sort((a: SelectOption, b: SelectOption) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()))

    // if (tabsetSelectionOptions.value.length == 1) {
    //   tabsetSelectionOptions.value = []
    // }
    if (tabsetSelectionOptions.value.length > 1) {
      tabsetSelectionOptions.value.unshift({ label: 'Switch to', value: '', disable: true, icon: 'switch_horiz' })
    }

    if (tabsets.length > 1) {
      tabsetSelectionOptions.value.push({ label: '', value: '', disable: true })
    }

    if (holder !== 'popup') {
      if (currentTabset.value) {
        tabsetSelectionOptions.value.push({ label: 'Edit Tabset', value: 'edit-tabset', icon: 'o_edit' })
        tabsetSelectionOptions.value.push({ label: 'Create new Tabset', value: 'create-tabset', icon: 'o_add' })
        tabsetSelectionOptions.value.push({ label: '', value: '', disable: true })
        tabsetSelectionOptions.value.push({
          label: 'Delete Tabset',
          value: 'delete-tabset',
          icon: 'o_delete',
          icon_color: 'negative',
        })
      } else {
        tabsetSelectionOptions.value.push({ label: 'Create custom Tabset', value: 'create-tabset', icon: 'o_add' })
      }
    } else {
      tabsetSelectionOptions.value.push({ label: 'Mange Tabsets', value: 'popup-manage-tabsets', icon: 'o_edit' })
    }

    if (stashedTabs.value) {
      tabsetSelectionOptions.value.push({ label: '', value: '', disable: true })
      tabsetSelectionOptions.value.push({ label: 'Stashed Tabs', value: 'stashed-tabs', icon: 'o_add' })
    }

    if (useFeaturesStore().hasFeature(FeatureIdent.SPACES)) {
      tabsetSelectionOptions.value.push({ label: '', value: '', disable: true })
      tabsetSelectionOptions.value.push({ label: 'Select Space...', value: 'select-space', icon: 'o_space_dashboard' })
    }

    tabsetSelectionOptions.value.unshift(automaticSelectionOption.value)
    console.log(':::calculated', tabsetSelectionOptions.value.map((ts) => ts.label).join(','))
  }

  watchEffect(() => {
    console.log('-- watchEffect() called --')
    calculate()
  })

  watchEffect(() => {
    console.log('-- watchEffect()2 called --')
    currentTabset.value = useTabsetsStore().getCurrentTabset
    //console.log('---got current tabset', currentTabset.value)
    if (currentTabset.value) {
      tabsetSelectionModel.value = {
        label: currentTabset.value?.name || '?',
        value: currentTabset.value?.id || '-',
      }
    } else {
      tabsetSelectionModel.value = automaticSelectionOption.value
    }
  })

  return {
    tabsetSelectionOptions,
    tabsetSelectionModel,
    setAutomaticSelectionLabel,
  }
}
