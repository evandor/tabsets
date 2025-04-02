<template>
  <!-- FirstToolbarHelper2 -->
  <q-toolbar class="q-pa-none q-pl-none q-pr-none q-pb-none" :style="offsetTop()">
    <q-toolbar-title>
      <div v-if="showWatermark" id="watermark">{{ watermark }}</div>
      <div class="row q-ma-none q-pa-none" v-if="useUiStore().overlapIndicator">
        <q-linear-progress :value="overlap" size="2px" :style="thresholdStyle()">
          <q-tooltip class="tooltip-small">{{ overlapTooltip }}</q-tooltip>
        </q-linear-progress>
      </div>
      <div class="row q-ma-none q-pa-none">
        <div class="col-6 q-ma-none q-pa-none" style="border: 0 solid red">
          <div class="col-12 text-subtitle1">
            <div class="q-ml-md q-mt-sm">
              <template v-if="useFeaturesStore().hasFeature(FeatureIdent.SPACES)">
                <div
                  v-if="route.path !== '/sidepanel/spaces'"
                  class="text-caption cursor-pointer"
                  @click.stop="router.push('/sidepanel/spaces')">
                  <q-icon
                    name="sync"
                    class="q-mr-xs cursor-pointer"
                    size="12px"
                    v-if="syncingActive()"
                    @click.stop="syncNow()">
                    <q-tooltip class="tooltip-small">Last synced: {{ lastSyncTime() }}. Click to sync now</q-tooltip>
                  </q-icon>
                  <span>
                    {{ title() }}
                    <q-icon name="arrow_drop_down" class="q-ma-none q-pa-none" color="grey-5" size="xs" />
                    <q-tooltip class="tooltip-small" :delay="1000"
                      >Select a different space or create a new one
                    </q-tooltip>
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
                <div class="text-caption">
                  <q-icon
                    name="sync"
                    class="q-mr-xs cursor-pointer"
                    size="12px"
                    v-if="syncingActive()"
                    @click="syncNow()">
                    <q-tooltip class="tooltip-small">Last synced: {{ lastSyncTime() }}. Click to sync now</q-tooltip>
                  </q-icon>
                  {{ title() }}
                </div>
              </template>
              <div class="text-body1 text-bold cursor-pointer ellipsis" @click="router.push('/sidepanel/collections')">
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
          <!--          </template>-->
        </div>

        <div
          class="col-6 text-subtitle1 text-right q-ma-none q-pa-none q-pr-none"
          v-if="!useUiStore().appLoading"
          style="border: 0 solid green">
          <slot name="iconsRight">
            <div class="q-mt-sm q-ma-none q-qa-none q-mr-xs">
              <span>
                <SpecialUrlAddToTabsetComponent
                  v-if="currentChromeTab && currentTabset && currentTabset.type !== TabsetType.SPECIAL"
                  @button-clicked="
                    (args: ActionHandlerButtonClickedHolder) => handleButtonClicked(currentTabset!, args)
                  "
                  :currentChromeTab="currentChromeTab"
                  :tabset="currentTabset"
                  :level="'root'" />
                <transition
                  v-else-if="!currentTabset || currentTabset.type !== TabsetType.SPECIAL"
                  appear
                  enter-active-class="animated fadeIn slower delay-5s"
                  leave-active-class="animated fadeOut">
                  <q-btn icon="add" label="tab" size="sm" class="q-mr-md" @click="addUrlDialog()" />
                </transition>
              </span>
              <!--              <q-icon name="more_vert" size="sm" color="secondary" class="cursor-pointer" />-->
              <!--              <SidePanelPageContextMenu v-if="currentTabset" :tabset="currentTabset as Tabset" />-->
            </div>
          </slot>
        </div>
      </div>
    </q-toolbar-title>
  </q-toolbar>
</template>

<script lang="ts" setup>
import { date, LocalStorage, useQuasar } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { SidePanelViews } from 'src/app/models/SidePanelViews'
import { GITHUB_AUTO_SYNC, GITHUB_AUTO_SYNC_LASTUPDATE } from 'src/boot/constants'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { useActionHandlers } from 'src/tabsets/actionHandling/ActionHandlers'
import { ActionHandlerButtonClickedHolder } from 'src/tabsets/actionHandling/model/ActionHandlerButtonClickedHolder'
import SpecialUrlAddToTabsetComponent from 'src/tabsets/actionHandling/SpecialUrlAddToTabsetComponent.vue'
import { GithubReadEventsCommand } from 'src/tabsets/commands/github/GithubReadEventsCommand'
import AddUrlDialog from 'src/tabsets/dialogues/AddUrlDialog.vue'
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

windowLocation.value = window.location.href

const redirectOnEmpty = () => {
  setTimeout(() => {
    // redirect to welcome page if there are not tabsets
    if (useTabsetsStore().tabsets.size === 0) {
      router.push('/sidepanel/welcome')
    }
  }, 1000)
}

redirectOnEmpty()

watchEffect(() => {
  currentTabset.value = useTabsetsStore().getCurrentTabset
  if (currentTabset.value) {
    overlap.value = useTabsStore2().getOverlap(currentTabset.value)
    overlapTooltip.value = `${Math.round(100 * overlap.value)}% overlap between this tabset and the currently open tabs`
  } else {
    redirectOnEmpty()
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
              return 'Tabset'
            case TabsetSharing.PUBLIC_LINK:
              return 'Shared Tabset'
            case TabsetSharing.PUBLIC_LINK_OUTDATED:
              return 'Shared Tabset'
            case TabsetSharing.USER:
              return currentTs.sharing.shareReference ? 'Shared Tabset' : 'Sharing Tabset'
            default:
              return 'Tabset'
          }
      }
    }
    return 'Tabset'
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

const addUrlDialog = () => $q.dialog({ component: AddUrlDialog })

const syncingActive = () => LocalStorage.getItem(GITHUB_AUTO_SYNC)

const syncNow = () => {
  const lastUpdate: number = (LocalStorage.getItem(GITHUB_AUTO_SYNC_LASTUPDATE) as number) || 0
  useCommandExecutor().executeFromUi(new GithubReadEventsCommand(lastUpdate))
  router.push('/sidepanel/collections')
}

const lastSyncTime = () => {
  const lastUpdate: number = (LocalStorage.getItem(GITHUB_AUTO_SYNC_LASTUPDATE) as number) || 0
  if (lastUpdate == 0) {
    return 'never'
  }
  return date.formatDate(lastUpdate, 'DD.MM.YY HH:mm')
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
