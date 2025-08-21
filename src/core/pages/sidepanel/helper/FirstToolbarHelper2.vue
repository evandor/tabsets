<template>
  <!-- FirstToolbarHelper2 -->
  <q-toolbar class="q-pa-none q-pl-none q-pr-none q-pb-none" :style="offsetTop()" style="border: 0 solid black">
    <q-toolbar-title>
      <div v-if="showWatermark" id="watermark">{{ watermark }}</div>
      <div class="row q-ma-none q-pa-none" v-if="useUiStore().overlapIndicator">
        <q-linear-progress :value="overlap" size="2px" :style="overlapStyle(uiDensity)">
          <q-tooltip class="tooltip-small">{{ overlapTooltip }}</q-tooltip>
        </q-linear-progress>
      </div>
      <div class="row q-ma-none q-pa-none">
        <div class="col-1 q-ma-none q-pa-none q-mr-md q-mt-xs" style="border: 0 solid red; max-width: 24px">
          <q-btn
            icon="menu"
            flat
            :disabled="props.disable"
            size="md"
            class="cursor-pointer"
            :class="{ shakeWithColor: animateMenuButton, 'cursor-pointer': true }" />
          <q-menu>
            <q-list style="min-width: 200px" dense>
              <!--              <CreateTabsetAction :tabset="currentTabset" level="root" />-->
              <!--              <EditTabsetAction :tabset="currentTabset" level="root" :element="props.element" />-->
              <SearchAction
                :tabset="currentTabset || new Tabset('dummy', 'dummy', [])"
                level="root"
                v-if="showSearchAction"
                @clicked="delayedRemoval()"
                :element="props.element" />
              <!--              <CreateSubfolderAction :tabset="currentTabset" level="root" :element="props.element" />-->
              <OpenAllInMenuAction
                :tabset="currentTabset || new Tabset('dummy', 'dummy')"
                level="root"
                :element="props.element" />
              <ShareTabsetAction :tabset="currentTabset|| new Tabset('dummy', 'dummy')" level="root" :element="props.element" />
              <ShowGalleryAction
                v-if="useFeaturesStore().hasFeature(FeatureIdent.GALLERY)"
                :tabset="currentTabset || new Tabset('dummy', 'dummy')"
                :element="props.element"
                level="root" />
              <ShowRezepteAction
                v-if="useFeaturesStore().hasFeature(FeatureIdent.GALLERY)"
                :tabset="currentTabset || new Tabset('dummy', 'dummy')"
                :element="props.element"
                level="root" />
              <!--              <CreateNoteAction-->
              <!--                :tabset="currentTabset"-->
              <!--                level="root"-->
              <!--                v-if="useSettingsStore().has('DEV_MODE')" />-->
              <CreatePageAction
                :tabset="currentTabset || new Tabset('dummy', 'dummy')"
                level="root"
                v-if="useFeaturesStore().hasFeature(FeatureIdent.PAGES)"
                :element="props.element" />
              <ArchiveTabsetAction
                :tabset="currentTabset || new Tabset('dummy', 'dummy')"
                level="root"
                :element="props.element"
                v-if="useFeaturesStore().hasFeature(FeatureIdent.ARCHIVE_TABSET)" />
              <!--              <DeleteTabsetAction :tabset="currentTabset" level="root" :element="props.element" />-->
            </q-list>
          </q-menu>
        </div>
        <div class="col-9 q-ma-none q-pa-none q-px-sm text-center" style="border: 0 solid red">
          <div class="col-12 text-subtitle1">
            <div class="q-ml-xs q-mt-none">
              <div class="text-bold ellipsis">
                <q-select
                  :style="tabsetColorStyle()"
                  filled
                  :disable="props.disable"
                  transition-show="scale"
                  transition-hide="scale"
                  :label="tabsetSelectLabel()"
                  v-model="tabsetSelectionModel"
                  @update:model-value="(option: SelectOption) => switchTabset(option)"
                  :options="tabsetSelectionOptions"
                  :loading="useUiStore().isLoading('categorization')"
                  dense
                  options-dense>
                  <template v-slot:loading>
                    <q-spinner color="primary" size="xs" />
                  </template>
                  <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps">
                      <template v-if="scope.opt.label.length > 0">
                        <q-item-section
                          style="max-width: 20px"
                          v-if="scope.opt.label !== 'Switch to' && scope.opt.label !== 'Open Bibbly Collection'">
                          <q-icon
                            size="xs"
                            :color="scope.opt.icon_color ? scope.opt.icon_color : 'primary'"
                            :name="scope.opt.icon"
                            v-if="scope.opt.icon" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>{{ scope.opt.label }}</q-item-label>
                          <q-item-label caption>{{ scope.opt.description }}</q-item-label>
                        </q-item-section>
                      </template>
                      <q-item-section class="q-ma-none q-pa-none" v-else>
                        <q-separator />
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
            </div>
          </div>
        </div>

        <div
          class="col text-subtitle1 text-right q-ma-none q-pa-none q-pr-sm q-pt-xs"
          v-if="!useUiStore().appLoading"
          style="border: 0 solid green">
          <slot name="iconsRight">
            <SidePanelToolbarFab2
              v-if="currentChromeTab && currentTabset"
              @button-clicked="(args: ActionHandlerButtonClickedHolder) => handleButtonClicked(currentTabset!, args)"
              :currentChromeTab="currentChromeTab"
              :disable="props.disable"
              :tabset="currentTabset" />
            <transition
              v-else-if="!currentTabset || currentTabset.type !== TabsetType.SPECIAL"
              appear
              enter-active-class="animated fadeIn slower delay-5s"
              leave-active-class="animated fadeOut">
              <q-btn icon="add" label="tab" size="sm" class="q-mr-md" @click="addUrlDialog()" />
            </transition>
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
import { SelectOption, useTabsetSelector } from 'src/core/pages/common/useTabsetSelector'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useNavigationService } from 'src/core/services/NavigationService'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { useActionHandlers } from 'src/tabsets/actionHandling/ActionHandlers'
import { ActionHandlerButtonClickedHolder } from 'src/tabsets/actionHandling/model/ActionHandlerButtonClickedHolder'
import SidePanelToolbarFab2 from 'src/tabsets/actionHandling/SidePanelToolbarFab2.vue'
import ArchiveTabsetAction from 'src/tabsets/actions/ArchiveTabsetAction.vue'
import CreatePageAction from 'src/tabsets/actions/CreatePageAction.vue'
import OpenAllInMenuAction from 'src/tabsets/actions/OpenAllInMenuAction.vue'
import SearchAction from 'src/tabsets/actions/SearchAction.vue'
import ShareTabsetAction from 'src/tabsets/actions/ShareTabsetAction.vue'
import ShowGalleryAction from 'src/tabsets/actions/ShowGalleryAction.vue'
import ShowRezepteAction from 'src/tabsets/actions/ShowRezepteAction.vue'
import { SelectTabsetCommand } from 'src/tabsets/commands/SelectTabsetCommand'
import AddUrlDialog from 'src/tabsets/dialogues/AddUrlDialog.vue'
import DeleteTabsetDialog from 'src/tabsets/dialogues/DeleteTabsetDialog.vue'
import EditTabsetDialog from 'src/tabsets/dialogues/EditTabsetDialog.vue'
import NewTabsetDialog from 'src/tabsets/dialogues/NewTabsetDialog.vue'
import { Tabset, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useTagsService } from 'src/tags/TagsService'
import { useUiStore } from 'src/ui/stores/uiStore'
import { useWindowsStore } from 'src/windows/stores/windowsStore'
import { inject, ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n({ useScope: 'global' })

const emits = defineEmits(['tabset-changed'])

const $q = useQuasar()
const router = useRouter()

type Props = { element: 'contextmenu' | 'btn' | 'popup'; disable?: boolean }

const props = withDefaults(defineProps<Props>(), {
  disable: false,
})

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
const animateMenuButton = ref(false)

// const tabsetSelectionOptions = ref<SelectOption[]>([])
const stashedTabs = ref(false)

let showSearchAction = ref(true)

const uiDensity = inject('ui.density')

windowLocation.value = window.location.href

const { tabsetSelectionOptions, tabsetSelectionModel, setAutomaticSelectionLabel } = useTabsetSelector(props.element)

watchEffect(() => {
  const tsCat = useTagsService().getCurrentTabContentClassification().classification
  console.log('got tsCat', tsCat)
  if (tsCat) {
    const label: string = tsCat.split(':').length === 2 ? tsCat.split(':')[1]! : tsCat
    setAutomaticSelectionLabel('automatic: ' + label)
  }
})

watchEffect(() => {
  tabsets.value = [...useTabsetsStore().tabsets.values()] as Tabset[]

  stashedTabs.value = tabsets.value.filter((ts: Tabset) => ts.type === TabsetType.SESSION).length > 0
})

watchEffect(() => {
  animateMenuButton.value = useUiStore().animateMenuButton
})

watchEffect(() => {
  currentTabset.value = useTabsetsStore().getCurrentTabset
  //console.log('---got current tabset', currentTabset.value)
  if (currentTabset.value) {
    // tabsetSelectionModel.value = {
    //   label: currentTabset.value?.name || '?',
    //   value: currentTabset.value?.id || '-',
    // }
    overlap.value = useTabsStore2().getOverlap(currentTabset.value)
    overlapTooltip.value = `${Math.round(100 * overlap.value)}% overlap between this tabset and the currently open tabs`
  } else {
    // tabsetSelectionModel.value = AutomaticSelectionOption
  }
})

const overlapStyle = (d: any) => {
  const res = 'color: hsl(' + Math.round(120 * overlap.value) + ' 80% 50%); position: absolute; top: 0px;'
  return res + (d === 'dense' ? '' : 'position: absolute; top:-15px')
}

watchEffect(() => {
  const windowId = useWindowsStore().currentBrowserWindow?.id || 0
  currentChromeTab.value = useTabsStore2().getCurrentChromeTab(windowId) || useTabsStore2().currentChromeTab
  // console.log(' --- updated currentChromeTab', currentChromeTab.value?.url)
})

watchEffect(() => {
  annimateNewTabsetButton.value = useUiStore().animateNewTabsetButton
})

watchEffect(() => {
  showFilter.value = useUiStore().sidePanelActiveViewIs(SidePanelViews.TABS_LIST) && useUiStore().toolbarFilter
})

watchEffect(() => {
  showWatermark.value = useUiStore().getWatermark().length > 0
  watermark.value = useUiStore().getWatermark()
})

watchEffect(() => {
  showSearchAction.value = useTabsetsStore().allTabsCount > 0
})

function getActiveFolder(tabset: Tabset) {
  return tabset.folderActive ? useTabsetService().findFolder([tabset], tabset.folderActive) : undefined
}

const handleButtonClicked = async (tabset: Tabset, args: ActionHandlerButtonClickedHolder, folder?: Tabset) => {
  const useFolder: Tabset | undefined = folder ? folder : getActiveFolder(tabset)
  console.log(`button clicked: tsId=${tabset.id}, folderId=${useFolder?.id}, args=...`)
  await useActionHandlers(undefined).handleClick(tabset, currentChromeTab.value!, args, useFolder)
}

const offsetTop = () => ($q.platform.is.capacitor || $q.platform.is.cordova ? 'margin-top:40px;' : '')

const addUrlDialog = () => $q.dialog({ component: AddUrlDialog })

const switchTabset = async (option: SelectOption) => {
  console.log('switching tabsets', option)
  const tsId = option.value
  if (tsId === 'select-space') {
    await router.push('/sidepanel/spaces')
    return
  }
  if (tsId === 'create-tabset') {
    $q.dialog({
      component: NewTabsetDialog,
      componentProps: {
        tabsetId: useTabsetsStore().getCurrentTabset?.id,
        spaceId: useSpacesStore().space?.id,
        fromPanel: true,
      },
    })
    // tabsetSelectionModel.value = {
    //   label: currentTabset.value?.name || '?',
    //   value: currentTabset.value?.id || '-',
    // }
    return
  }
  if (tsId === 'edit-tabset' && currentTabset.value) {
    $q.dialog({
      component: EditTabsetDialog,
      componentProps: {
        tabsetId: currentTabset.value.id,
        tabsetName: currentTabset.value.name,
        tabsetColor: currentTabset.value.color,
        window: currentTabset.value.window,
        details: currentTabset.value.details || useUiStore().listDetailLevel,
        contentClassification: /**currentTabset.value.contentClassification || **/ 'unclassified',
        fromPanel: true,
      },
    })
    return
  }
  if (tsId === 'popup-manage-tabsets') {
    router.push('/popup/tabsets')
    return
  }
  if (tsId === 'delete-tabset' && currentTabset.value) {
    $q.dialog({
      component: DeleteTabsetDialog,
      componentProps: {
        tabsetId: currentTabset.value.id,
        tabsetName: currentTabset.value.name,
        tabsCount: currentTabset.value.tabs.length,
      },
    })
    return
  }
  if (tsId === 'stashed-tabs') {
    router.push('/sidepanel/sessions')
    return
  }
  if (tsId === 'automatic-selection') {
    useTabsetsStore().unselectCurrentTabset()
    currentTabset.value = undefined
    return
  }
  if (tsId === '') {
    await router.push('/sidepanel/collections')
    return
  }
  if (tsId.startsWith('/mainpanel/')) {
    console.log('hier', tsId, tabsetSelectionModel.value)
    const url = chrome.runtime.getURL(`/www/index.html/#${tsId}`)
    useNavigationService().browserTabFor(url)
  }
  const result: ExecutionResult<Tabset | undefined> = await useCommandExecutor().execute(
    new SelectTabsetCommand(option.value),
  )
  currentTabset.value = result.result
  emits('tabset-changed')
}

const tabsetSelectLabel = () => {
  if (useFeaturesStore().hasFeature(FeatureIdent.SPACES)) {
    return useSpacesStore().space?.label || 'no space selected'
  }
  return 'Collection'
}

const delayedRemoval = () => {
  setTimeout(() => (showSearchAction.value = false), 500)
}

const tabsetColorStyle = () => {
  return currentTabset.value && currentTabset.value.color
    ? 'border-left: 3px solid ' +
        currentTabset.value.color +
        ';border-right: 3px solid ' +
        currentTabset.value.color +
        ';border-radius:3px'
    : ''
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

.q-list--dense > .q-item,
.q-item--dense {
  min-height: 22px;
}
</style>
