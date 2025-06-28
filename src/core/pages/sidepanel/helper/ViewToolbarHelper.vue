<template>
  <!-- FirstToolbarHelper2 -->
  <q-toolbar class="q-pa-none q-pl-none q-pr-none q-pb-none greyBorderBottom" :style="offsetTop()">
    <q-toolbar-title>
      <div class="row q-ma-none q-pa-none" v-if="useUiStore().overlapIndicator">
        <q-linear-progress :value="overlap" size="2px" :style="thresholdStyle()">
          <q-tooltip class="tooltip-small">{{ overlapTooltip }}</q-tooltip>
        </q-linear-progress>
      </div>
      <div class="row q-ma-none q-pa-none">
        <div class="col-6 q-ma-none q-pa-none" style="border: 0 solid red">
          <div class="col-12 text-subtitle1">
            <div class="q-ml-md q-mt-sm">
              <div class="text-caption cursor-pointer" @click.stop="backToMainView()">
                <span>&lt;&nbsp;back </span>
              </div>
              <div class="text-body1 text-bold ellipsis">
                {{ props.title }}
              </div>
            </div>
          </div>
          <!--          </template>-->
        </div>

        <div
          class="col-6 text-subtitle1 text-right q-ma-none q-pa-none q-pr-none"
          v-if="!useUiStore().appLoading"
          style="border: 0 solid green">
          <slot name="iconsRight"> </slot>
        </div>
      </div>
    </q-toolbar-title>
  </q-toolbar>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { SidePanelViews } from 'src/app/models/SidePanelViews'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { useActionHandlers } from 'src/tabsets/actionHandling/ActionHandlers'
import { ActionHandlerButtonClickedHolder } from 'src/tabsets/actionHandling/model/ActionHandlerButtonClickedHolder'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useUiStore } from 'src/ui/stores/uiStore'
import { useWindowsStore } from 'src/windows/stores/windowsStore'
import { ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  title: { type: String, default: 'My Tabsets' },
  forceTitle: { type: Boolean, default: false },
  showSearchBox: { type: Boolean, default: false },
  searchTerm: { type: String, default: '' },
  searchHits: { type: Number, required: false },
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

const toggleSearch = () => {
  searching.value = !searching.value
  if (searching.value) {
    router.push('/sidepanel/search')
  } else {
    router.push('/sidepanel')
  }
}

windowLocation.value = window.location.href

watchEffect(() => {
  currentTabset.value = useTabsetsStore().getCurrentTabset
  if (currentTabset.value) {
    const currentTabsetTabs: Set<string> = new Set(currentTabset.value.tabs.map((t: Tab) => t.url || ''))
    const browserTabs: Set<string> = new Set(useTabsStore2().browserTabs.map((t: chrome.tabs.Tab) => t.url || ''))
    try {
      const allTabs = currentTabsetTabs.union(browserTabs)
      const lapover = currentTabsetTabs.intersection(allTabs)
      overlap.value = lapover.size / allTabs.size
      overlapTooltip.value = `${Math.round(100 * overlap.value)}% overlap between this tabset and the currenly open tabs`
    } catch (err) {}
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

// if ($q.platform.is.chrome && $q.platform.is.bex) {
//   chrome.commands.onCommand.addListener((command) => {
//     if (command === 'search') {
//       console.debug(`got Command: ${command}`)
//       toggleSearch()
//     }
//   })
// }

const showSearchIcon = () => useTabsetsStore().tabsets.size > 1

const title = (): string => {
  if (useFeaturesStore().hasFeature(FeatureIdent.SPACES)) {
    return useSpacesStore().space ? useSpacesStore().space.label : 'no_space_selected'
  } else {
    const currentTs = useTabsetsStore().getCurrentTabset
    if (currentTs) {
      switch (currentTs.type) {
        case TabsetType.SESSION:
          return `Session (${currentTs.tabs.length} tab${currentTs.tabs.length > 1 ? 's' : ''})`
        default:
          return currentTs.sharing?.sharedId ? 'Shared Collection' : 'Collection'
      }
    }
    return 'Collection'
  }
}

function getActiveFolder(tabset: Tabset) {
  return tabset.folderActive ? useTabsetService().findFolder([tabset], tabset.folderActive) : undefined
}

const handleButtonClicked = async (tabset: Tabset, args: ActionHandlerButtonClickedHolder, folder?: Tabset) => {
  const useFolder: Tabset | undefined = folder ? folder : getActiveFolder(tabset)
  console.log(`button clicked: tsId=${tabset.id}, folderId=${useFolder?.id}, args=...`)
  await useActionHandlers(undefined).handleClick(tabset, currentChromeTab.value!, args, useFolder)
}

const offsetTop = () => ($q.platform.is.capacitor || $q.platform.is.cordova ? 'margin-top:40px;' : '')

const backToMainView = () => {
  useUiStore().sidePanelSetActiveView(SidePanelViews.MAIN)
  router.push('/sidepanel')
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
