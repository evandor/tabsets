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
        <div class="col-4 q-ma-none q-pa-none" style="border: 0 solid red">
          <div class="col-12 text-subtitle1">
            <div class="q-ml-xs q-mt-none">
              <div class="text-body1 text-bold ellipsis">
                <template v-if="currentTabset">
                  <!--                  <q-btn-dropdown no-caps class="q-ma-none q-px-none q-py-none" dense size="sm" v-close-popup flat>-->
                  <!--                    <template v-slot:label>-->
                  <!--                      <div class="column">-->
                  <!--                        <div class="text-caption">{{ tabsetSelectLabel() }}</div>-->
                  <!--                        <div class="text-body2">{{ model?.label }}</div>-->
                  <!--                      </div>-->
                  <!--                    </template>-->

                  <!--                    <q-list dense>-->
                  <!--                      <q-item clickable v-close-popup v-for="option in options">-->
                  <!--                        <q-item-section>-->
                  <!--                          <q-item-label>{{ option.label }}</q-item-label>-->
                  <!--                        </q-item-section>-->
                  <!--                      </q-item>-->
                  <!--                    </q-list>-->
                  <!--                  </q-btn-dropdown>-->

                  <q-select
                    v-if="options.length > 1"
                    borderless
                    label="Tabset"
                    v-model="model"
                    @update:model-value="(newTabset: object) => switchTabset(newTabset)"
                    :options="options"
                    dense
                    options-dense />
                  <div v-else>
                    <div class="text-caption q-ml-md">{{ title() }}</div>
                    <div class="q-ml-md">{{ currentTabset.name }}</div>
                  </div>
                  <!--                  {{ currentTabset.name }}-->
                  <!--                  <q-icon-->
                  <!--                    name="arrow_drop_down"-->
                  <!--                    class="q-ma-none q-pa-none"-->
                  <!--                    color="grey-5"-->
                  <!--                    size="xs"-->
                  <!--                    @click="router.push('/sidepanel/collections')" />-->
                  <!--                  <q-tooltip class="tooltip-small" :delay="1000"-->
                  <!--                    >Select a different collection or create a new one {{ currentTabset.size }}-->
                  <!--                  </q-tooltip>-->
                </template>
                <template v-else>
                  <q-spinner color="primary" size="1em" />
                </template>
              </div>
            </div>
          </div>
          <!--          </template>-->
        </div>

        <div class="col-4 text-center" style="border: 0 solid blue">
          <span
            v-if="useFeaturesStore().hasFeature(FeatureIdent.SPACES)"
            class="text-body1 cursor-pointer"
            @click="router.push('/sidepanel/spaces')"
            >{{ useSpacesStore().space.label }}</span
          >
        </div>
        <div
          class="col-4 text-subtitle1 text-right q-ma-none q-pa-none q-pr-none"
          v-if="!useUiStore().appLoading"
          style="border: 0 solid green">
          <slot name="iconsRight">
            <div class="q-mt-none q-ma-none q-qa-none q-mr-xs q-mt-xs">
              <!--              <template v-if="useFeaturesStore().hasFeature(FeatureIdent.SPACES)">-->
              <!--                <div-->
              <!--                  v-if="route.path !== '/sidepanel/spaces'"-->
              <!--                  class="text-caption cursor-pointer"-->
              <!--                  @click.stop="router.push('/sidepanel/spaces')">-->
              <!--                  <span class="text-bold">-->
              <!--                    <q-icon name="arrow_drop_down" class="q-ma-none q-pa-none" color="grey-5" size="xs" />-->
              <!--                    <q-tooltip class="tooltip-small" :delay="1000"-->
              <!--                      >Select a different space or create a new one-->
              <!--                    </q-tooltip>-->
              <!--                    {{ title() }}-->
              <!--                  </span>-->
              <!--                </div>-->
              <!--                <div v-else class="text-caption cursor-pointer" @click.stop="router.push('/sidepanel')">-->
              <!--                  <span-->
              <!--                    >&lt;&nbsp;back-->
              <!--                    <q-tooltip class="tooltip-small" :delay="1000"-->
              <!--                      >Click again to return or choose a new space</q-tooltip-->
              <!--                    >-->
              <!--                  </span>-->
              <!--                </div>-->
              <!--              </template>-->

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
import { useQuasar } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { SidePanelViews } from 'src/app/models/SidePanelViews'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { useActionHandlers } from 'src/tabsets/actionHandling/ActionHandlers'
import { ActionHandlerButtonClickedHolder } from 'src/tabsets/actionHandling/model/ActionHandlerButtonClickedHolder'
import SpecialUrlAddToTabsetComponent from 'src/tabsets/actionHandling/SpecialUrlAddToTabsetComponent.vue'
import { SelectTabsetCommand } from 'src/tabsets/commands/SelectTabsetCommand'
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

type SelectOption = { label: string; value: string }

const { t } = useI18n({ useScope: 'global' })

const props = defineProps({
  title: { type: String, default: 'My Tabsets' },
  forceTitle: { type: Boolean, default: false },
  showSearchBox: { type: Boolean, default: false },
  searchTerm: { type: String, default: '' },
  searchHits: { type: Number, required: false },
})

const emits = defineEmits(['tabset-changed'])

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
const tabsets = ref<Tabset[]>([])

const model = ref<SelectOption | undefined>(undefined)
const options = ref<SelectOption[]>([])

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
  tabsets.value = [...useTabsetsStore().tabsets.values()] as Tabset[]
  options.value = tabsets.value
    .map((ts: Tabset) => {
      return {
        label: ts.name,
        value: ts.id,
      }
    })
    .sort((a: SelectOption, b: SelectOption) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()))
  if (options.value.length > 10) {
    options.value = options.value.slice(0, 10)
    options.value.push({ label: 'show all...', value: '' })
  } else {
    options.value.push({ label: 'more...', value: '' })
  }
  model.value = {
    label: currentTabset.value?.name || '?',
    value: currentTabset.value?.id || '-',
  }
})

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

const switchTabset = async (tabset: object) => {
  const tsId = tabset['value' as keyof object]
  if (tsId === '') {
    await router.push('/sidepanel/collections')
    return
  }
  const result: ExecutionResult<Tabset | undefined> = await useCommandExecutor().execute(
    new SelectTabsetCommand(tabset['value' as keyof object]),
  )
  currentTabset.value = result.result
  emits('tabset-changed')
}

const tabsetSelectLabel = () => {
  if (useFeaturesStore().hasFeature(FeatureIdent.SPACES)) {
    return useSpacesStore().space.label
  }
  return 'Tabset'
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
