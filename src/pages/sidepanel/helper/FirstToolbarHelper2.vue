<template>
  <!-- FirstToolbarHelper2 -->
  <q-toolbar class="q-pa-none q-pl-none q-pr-none q-pb-none greyBorderBottom" :style="offsetTop()">
    <q-toolbar-title>
      <div v-if="showWatermark" id="watermark">{{ watermark }}</div>

      <div class="row q-ma-none q-pa-none">
        <div class="col-6 q-ma-none q-pa-none" style="border: 0 solid red">
          <!-- no spaces && searching -->
          <SearchWithTransitionHelper
            v-if="searching"
            :search-term="props.searchTerm"
            :search-hits="props.searchHits!" />

          <FilterWithTransitionHelper v-else-if="showFilter" />
          <!-- no spaces && not searching -->
          <template v-else>
            <!-- no spaces && not searching -->
            <div class="col-12 text-subtitle1">
              <div class="q-ml-md q-mt-sm">
                <template v-if="useFeaturesStore().hasFeature(FeatureIdent.SPACES)">
                  <div
                    v-if="route.path !== '/sidepanel/spaces'"
                    class="text-caption cursor-pointer"
                    @click.stop="router.push('/sidepanel/spaces')">
                    <span
                      >{{ title() }}
                      <q-icon name="arrow_drop_down" class="q-ma-none q-pa-none" color="grey-5" size="xs" />
                      <q-tooltip class="tooltip-small" :delay="1000"
                        >Select a different space or create a new one</q-tooltip
                      >
                    </span>
                  </div>
                  <div v-else class="text-caption cursor-pointer" @click.stop="router.push('/sidepanel')">
                    <span
                      >&lt;&nbsp;back
                      <q-tooltip class="tooltip-small" :delay="1000"
                        >Click again to return or choose a new space</q-tooltip
                      >
                    </span>
                  </div>
                </template>
                <template v-else>
                  <div class="text-caption">{{ title() }}</div>
                </template>
                <div
                  class="text-body1 text-bold cursor-pointer ellipsis"
                  @click="router.push('/sidepanel/collections')">
                  <template v-if="currentTabset">
                    {{ currentTabset.name }}
                    <q-icon name="arrow_drop_down" class="q-ma-none q-pa-none" color="grey-5" size="xs" />
                    <q-tooltip class="tooltip-small" :delay="1000"
                      >Select a different collection or create a new one {{ currentTabset.size }}
                    </q-tooltip>
                  </template>
                  <template v-else>
                    <q-spinner color="primary" size="1em" />
                  </template>
                </div>
              </div>
            </div>
          </template>
        </div>

        <div
          class="col-6 text-subtitle1 text-right q-ma-none q-pa-none q-pr-none"
          v-if="!useUiStore().appLoading"
          style="border: 0 solid green">
          <slot name="iconsRight">
            <div class="q-mt-sm q-ma-none q-qa-none">
              <template v-if="showSearchIcon()">
                <SidePanelToolbarButton
                  icon="search"
                  class="q-mr-sm"
                  id="toggleSearchBtn"
                  size="11px"
                  @click="toggleSearch" />
              </template>

              <SidePanelToolbarTabNavigationHelper />

              <span>
                <SpecialUrlAddToTabsetComponent
                  v-if="currentChromeTab && currentTabset"
                  @button-clicked="
                    (args: ActionHandlerButtonClickedHolder) => handleButtonClicked(currentTabset!, args)
                  "
                  :currentChromeTab="currentChromeTab"
                  :tabset="currentTabset" />
              </span>
              <q-icon name="more_vert" size="sm" color="secondary" class="cursor-pointer" />
              <SidePanelPageContextMenu v-if="currentTabset" :tabset="currentTabset as Tabset" />
            </div>
          </slot>
        </div>
      </div>
      <div class="row q-ma-none q-pa-none" v-if="useUiStore().overlapIndicator">
        <q-linear-progress :value="overlap" size="2px" :style="thresholdStyle()">
          <q-tooltip class="tooltip-small">{{ overlapTooltip }}</q-tooltip>
        </q-linear-progress>
      </div>
    </q-toolbar-title>
  </q-toolbar>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { SidePanelViews } from 'src/app/models/SidePanelViews'
import SidePanelToolbarButton from 'src/core/components/SidePanelToolbarButton.vue'
import FilterWithTransitionHelper from 'src/core/widget/FilterWithTransitionHelper.vue'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import SidePanelToolbarTabNavigationHelper from 'src/opentabs/pages/SidePanelToolbarTabNavigationHelper.vue'
import SearchWithTransitionHelper from 'src/pages/sidepanel/helper/SearchWithTransitionHelper.vue'
import SidePanelPageContextMenu from 'src/pages/sidepanel/SidePanelPageContextMenu.vue'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { useActionHandlers } from 'src/tabsets/actionHandling/ActionHandlers'
import { ActionHandlerButtonClickedHolder } from 'src/tabsets/actionHandling/model/ActionHandlerButtonClickedHolder'
import SpecialUrlAddToTabsetComponent from 'src/tabsets/actionHandling/SpecialUrlAddToTabsetComponent.vue'
import { Tabset, TabsetSharing, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useUiStore } from 'src/ui/stores/uiStore'
import { useWindowsStore } from 'src/windows/stores/windowsStore'
import { ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

const { t } = useI18n({ useScope: 'global' })

const props = defineProps({
  title: { type: String, default: 'My Tabsets' },
  forceTitle: { type: Boolean, default: false },
  showSearchBox: { type: Boolean, default: false },
  searchTerm: { type: String, default: '' },
  searchHits: { type: Number, required: false },
})

const $q = useQuasar()
const router = useRouter()
const route = useRoute()

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

const handleButtonClicked = async (tabset: Tabset, args: ActionHandlerButtonClickedHolder, folder?: Tabset) => {
  const useFolder: Tabset | undefined = folder ? folder : getActiveFolder(tabset)
  //console.log(`button clicked: tsId=${tabset.id}, folderId=${useFolder?.id}, args=...`)
  await useActionHandlers(undefined).handleClick(tabset, currentChromeTab.value!, args, useFolder)
}

const offsetTop = () => ($q.platform.is.capacitor || $q.platform.is.cordova ? 'margin-top:40px;' : '')
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
