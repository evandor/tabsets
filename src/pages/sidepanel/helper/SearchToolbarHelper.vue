<template>
  <!-- SearchToolbarHelper -->
  <div class="row fit">
    <div class="col-8 q-ma-none q-pa-none q-ml-none">
      <!--          <SearchWithTransitionHelper :search-term="props.searchTerm" :search-hits="props.searchHits!" />-->
      <SearchWidget2
        :search-term="props.searchTerm"
        :search-hits="props.searchHits!"
        @on-enter="toggleSearch"
        :placeholder="props.placeholder || undefined" />
    </div>

    <div
      class="col text-subtitle1 text-right q-ma-none q-pa-none q-pr-none"
      v-if="!useUiStore().appLoading"
      style="border: 0 solid green">
      <div class="q-ma-none q-qa-none q-mr-xs">
        <SidePanelToolbarButton icon="search" class="q-mr-sm" id="toggleSearchBtn" size="xs" @click="toggleSearch" />
        <!-- TODO -->
        <!--        <SidePanelToolbarButton-->
        <!--          icon="o_filter_list"-->
        <!--          class="q-mr-sm"-->
        <!--          id="toggleSearchBtn"-->
        <!--          size="xs"-->
        <!--          @click="toggleSearch" />-->
        <SidePanelToolbarTabNavigationHelper />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { SidePanelViews } from 'src/app/models/SidePanelViews'
import SidePanelToolbarButton from 'src/core/components/SidePanelToolbarButton.vue'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import SidePanelToolbarTabNavigationHelper from 'src/opentabs/pages/SidePanelToolbarTabNavigationHelper.vue'
import SearchWidget2 from 'src/search/widgets/SearchWidget2.vue'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { Tabset, TabsetSharing, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useUiStore } from 'src/ui/stores/uiStore'
import { useWindowsStore } from 'src/windows/stores/windowsStore'
import { ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n({ useScope: 'global' })

const props = defineProps({
  title: { type: String, default: 'My Tabsets' },
  forceTitle: { type: Boolean, default: false },
  showSearchBox: { type: Boolean, default: false },
  searchTerm: { type: String, default: '' },
  searchHits: { type: Number, required: false },
  placeholder: { type: String, required: false },
})

const $q = useQuasar()
const router = useRouter()

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

if ($q.platform.is.chrome && $q.platform.is.bex) {
  chrome.commands.onCommand.addListener((command) => {
    if (command === 'search') {
      console.debug(`got Command: ${command}`)
      toggleSearch()
    }
  })
}

const showSearchIcon = () => useTabsetsStore().tabsets.size > 1

const title = (): string => {
  if (useFeaturesStore().hasFeature(FeatureIdent.SPACES)) {
    return useSpacesStore().space ? useSpacesStore().space.label : t('no_space_selected')
  } else {
    const currentTs = useTabsetsStore().getCurrentTabset
    if (currentTs) {
      switch (currentTs.type) {
        case TabsetType.SESSION:
          return `Session (${currentTs.tabs.length} tab${currentTs.tabs.length > 1 ? 's' : ''})`
        default:
          switch (currentTs.sharing.sharing) {
            case TabsetSharing.UNSHARED:
              return 'Collection'
            case TabsetSharing.PUBLIC_LINK:
              return 'Shared Collection'
            case TabsetSharing.PUBLIC_LINK_OUTDATED:
              return 'Shared Collection'
            case TabsetSharing.USER:
              return currentTs.sharing.shareReference ? 'Shared Collection' : 'Sharing Collection'
            default:
              return 'Collection'
          }
      }
    }
    return 'Collection'
  }
}

function getActiveFolder(tabset: Tabset) {
  return tabset.folderActive ? useTabsetService().findFolder([tabset], tabset.folderActive) : undefined
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
