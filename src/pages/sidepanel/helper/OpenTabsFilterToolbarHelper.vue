<template>
  <!-- SearchToolbarHelper -->
  <div class="row fit">
    <div class="col-1 q-ml-md q-mt-sm">
      <q-icon :name="toggleSelectionIcon()" class="cursor-pointer" size="sm" @click.stop="invertSelection()">
        <q-tooltip class="tooltip-small">Invert Selection</q-tooltip>
      </q-icon>
    </div>
    <div class="col-9 q-ma-none q-pa-none q-ml-none">
      <SearchWidget2
        :search-term="props.searchTerm"
        :search-hits="props.searchHits!"
        @on-term-changed="(val) => emits('onTermChanged', val)"
        @on-enter="toggleSearch" />
    </div>
    <div class="col text-right q-mt-xs q-mr-sm">
      <q-icon :name="sortByUrl ? 'undo' : 'sort'" color="primary" class="cursor-pointer" @click="toggleSorting()">
        <q-tooltip class="tooltip-small">Toggle Sorting between custom and URL</q-tooltip>
      </q-icon>
    </div>
  </div>
</template>

<script lang="ts" setup>
import _ from 'lodash'
import { SidePanelViews } from 'src/app/models/SidePanelViews'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { TabsSortingCommand } from 'src/opentabs/commands/TabsSortingCommand'
import SearchWidget2 from 'src/search/widgets/SearchWidget2.vue'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useUiStore } from 'src/ui/stores/uiStore'
import { useWindowsStore } from 'src/windows/stores/windowsStore'
import { ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

interface Props {
  title?: string
  forceTitle?: boolean
  showSearchBox?: boolean
  searchTerm?: string
  searchHits?: number
  tabSelection: Set<string>
}

const props = withDefaults(defineProps<Props>(), {
  title: 'My Tabsets',
  forceTitle: false,
  showSearchBox: false,
  searchTerm: '',
})

const emits = defineEmits(['onTermChanged', 'tabSelectionInverted'])

const router = useRouter()

const sortByUrl = ref(false)
const searching = ref(false)
const showFilter = ref(false)
const windowLocation = ref('')
const annimateNewTabsetButton = ref(false)
const currentTabset = ref<Tabset | undefined>(undefined)
const currentChromeTab = ref<chrome.tabs.Tab | undefined>(undefined)
const overlap = ref(0.5)
const overlapTooltip = ref('')
const showWatermark = ref(false)
const watermark = ref('')
const tabSelection = ref<Set<string>>(new Set<string>())
const filteredTabsCount = ref(0)
const filter = ref('')

// const invertSelection = () => console.log('******')

const toggleSearch = () => {
  searching.value = !searching.value
  if (searching.value) {
    router.push('/sidepanel/search')
  } else {
    router.push('/sidepanel')
  }
}

windowLocation.value = window.location.href

setTimeout(() => {
  // redirect to welcome page if there are not tabsets
  if (useTabsetsStore().tabsets.size === 0) {
    router.push('/sidepanel/welcome')
  }
}, 1000)

watchEffect(() => {
  console.log('tabselection', props.tabSelection)
  tabSelection.value = props.tabSelection
})

watchEffect(() => {
  currentTabset.value = useTabsetsStore().getCurrentTabset
  if (currentTabset.value) {
    overlap.value = useTabsStore2().getOverlap(currentTabset.value)
    overlapTooltip.value = `${Math.round(100 * overlap.value)}% overlap between this tabset and the currently open tabs`
  }
})

const thresholdStyle = () => 'color: hsl(' + Math.round(120 * overlap.value) + ' 80% 50%)'

watchEffect(() => {
  const windowId = useWindowsStore().currentBrowserWindow?.id || 0
  currentChromeTab.value = useTabsStore2().getCurrentChromeTab(windowId) || useTabsStore2().currentChromeTab
})

watchEffect(() => {
  annimateNewTabsetButton.value = useUiStore().animateNewTabsetButton
})

watchEffect(() => {
  if (props.showSearchBox && !searching.value) {
    searching.value = true
  }
})

watchEffect(() => {
  showFilter.value = useUiStore().sidePanelActiveViewIs(SidePanelViews.TABS_LIST) && useUiStore().toolbarFilter
})

watchEffect(() => {
  showWatermark.value = useUiStore().getWatermark().length > 0
  watermark.value = useUiStore().getWatermark()
})

const filteredTabs = (tabs: chrome.tabs.Tab[]) => {
  const res = _.filter(
    tabs,
    (t: chrome.tabs.Tab) => (t.title || 'unknown title').toLowerCase().indexOf(filter.value) >= 0,
  )
  filteredTabsCount.value = res.length
  return res
}
const invertSelection = () => {
  emits('tabSelectionInverted')
  // const oldSelection = tabSelection.value
  // // console.log('inverting', currentWindowOnly.value)
  // // TODO
  // //if (currentWindowOnly.value) {
  //   tabsForCurrentWindow.value.forEach((t: chrome.tabs.Tab) => {
  //     console.log('checking', t.id)
  //     if (t.id) {
  //       if (oldSelection.has('' + t.id)) {
  //         tabSelection.value.delete('' + t.id)
  //       } else {
  //         tabSelection.value.add('' + t.id)
  //       }
  //     }
  //  //  })
  // }
}

const toggleSorting = () => {
  sortByUrl.value = !sortByUrl.value
  useCommandExecutor().executeFromUi(new TabsSortingCommand(sortByUrl.value))
}

const toggleSelectionIcon = () => {
  if (tabSelection.value.size === 0) {
    return 'o_check_box'
  } else if (tabSelection.value.size === filteredTabs(useTabsStore2().browserTabs).length) {
    return 'o_check_box_outline_blank'
  }
  return 'o_published_with_changes'
}
</script>

<style scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 3.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
