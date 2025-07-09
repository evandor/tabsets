<template>
  <!-- PopupCollectionSelector -->
  <div class="row">
    <div class="col q-ma-none q-pa-none text-center" style="border: 0 solid red">
      <div class="text-bold ellipsis">
        <template v-if="currentTabset">
          <q-select
            :style="tabsetColorStyle()"
            filled
            :disable="props.disable"
            transition-show="scale"
            transition-hide="scale"
            v-model="tabsetSelectionModel"
            @update:model-value="(newTabset: object) => switchTabset(newTabset)"
            :options="tabsetSelectionOptions"
            dense
            options-dense>
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <template v-if="scope.opt.label.length > 0">
                  <q-item-section style="max-width: 20px" v-if="scope.opt.label !== 'Switch to'">
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
          <div
            v-if="showTabsCount && currentTabset.tabs.length > 0"
            class="text-left q-ml-sm text-caption vertical-middle text-grey-8 cursor-pointer"
            @click="router.push('/popup/tabset')">
            {{ currentTabset.tabs.length + ' ' + (currentTabset.tabs.length === 1 ? 'tab' : 'tabs') }}
          </div>
        </template>
        <!--        <template v-else-if="mode == 'add-tabset'">-->
        <!--          <transition appear enter-active-class="animated fadeInDown" leave-active-class="animated fadeInUp">-->
        <!--            <q-input @blur="blurNewTabset()" autofocus v-model="newTabsetName" dense label="Add new Collection" />-->
        <!--          </transition>-->
        <!--        </template>-->
        <template v-else>
          <q-spinner color="primary" size="1em" />
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { openURL, useQuasar } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { SidePanelViews } from 'src/app/models/SidePanelViews'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useUtils } from 'src/core/services/Utils'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { SelectTabsetCommand } from 'src/tabsets/commands/SelectTabsetCommand'
import DeleteTabsetDialog from 'src/tabsets/dialogues/DeleteTabsetDialog.vue'
import EditTabsetDialog from 'src/tabsets/dialogues/EditTabsetDialog.vue'
import NewTabsetDialog from 'src/tabsets/dialogues/NewTabsetDialog.vue'
import { Tabset, TabsetStatus, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useUiStore } from 'src/ui/stores/uiStore'
import { useWindowsStore } from 'src/windows/stores/windowsStore'
import { ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

type SelectOption = {
  label: string
  value: string
  disable?: boolean
  icon?: string
  icon_color?: string
}

const { t } = useI18n({ useScope: 'global' })
const { openSidepanel } = useUtils()

const emits = defineEmits(['tabset-changed', 'add-tabset'])

const $q = useQuasar()
const router = useRouter()

type Props = {
  url: string | undefined
  disable?: boolean
  showTabsCount?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disable: false,
})

const showFilter = ref(false)
const windowLocation = ref('')
const annimateNewTabsetButton = ref(false)
const currentTabset = ref<Tabset | undefined>(undefined)
const currentBrowserTab = ref<chrome.tabs.Tab | undefined>(undefined)
const overlap = ref(0.5)
const overlapTooltip = ref('')
const showWatermark = ref(false)
const watermark = ref('')
const tabsets = ref<Tabset[]>([])
const animateMenuButton = ref(false)
const sidepanelEnabled = ref(false)

const tabsetSelectionModel = ref<SelectOption | undefined>(undefined)
const tabsetSelectionOptions = ref<SelectOption[]>([])
const stashedTabs = ref(false)

const newTabsetName = ref<string | undefined>(undefined)

windowLocation.value = window.location.href

watchEffect(() => {
  tabsets.value = [...useTabsetsStore().tabsets.values()] as Tabset[]
  const useSpaces = useFeaturesStore().hasFeature(FeatureIdent.SPACES)
  const space = useSpacesStore().space

  stashedTabs.value = tabsets.value.filter((ts: Tabset) => ts.type === TabsetType.SESSION).length > 0

  tabsetSelectionOptions.value = tabsets.value
    .filter((ts: Tabset) =>
      useFeaturesStore().hasFeature(FeatureIdent.ARCHIVE_TABSET) ? ts.status !== TabsetStatus.ARCHIVED : true,
    )
    .filter((ts: Tabset) => ts.type !== TabsetType.SPECIAL)
    .filter((ts: Tabset) => ts.type !== TabsetType.SESSION)
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

  if (tabsetSelectionOptions.value.length == 1) {
    tabsetSelectionOptions.value = []
  }
  if (tabsetSelectionOptions.value.length > 1) {
    tabsetSelectionOptions.value.unshift({ label: 'Switch to', value: '', disable: true, icon: 'switch_horiz' })
  }

  // if (tabsetSelectionOptions.value.length > 10) {
  //   tabsetSelectionOptions.value = tabsetSelectionOptions.value.slice(0, 10)
  //   tabsetSelectionOptions.value.push({ label: '', value: '', disable: true })
  //   tabsetSelectionOptions.value.push({ label: 'show all...', value: '' })
  // } else if (tabsetSelectionOptions.value.length > 4) {
  //   tabsetSelectionOptions.value.push({ label: '', value: '', disable: true })
  //   tabsetSelectionOptions.value.push({ label: 'more...', value: '' })
  // }

  if (tabsets.value.length > 1) {
    tabsetSelectionOptions.value.push({ label: '', value: '', disable: true })
  }

  tabsetSelectionOptions.value.push({ label: 'Show Collection', value: 'show-tabset', icon: 'o_eye' })
  //tabsetSelectionOptions.value.push({ label: 'Add Collection', value: 'add-tabset', icon: 'o_add' })
  tabsetSelectionOptions.value.push({ label: 'Manage Collections', value: 'popup-manage-tabsets', icon: 'o_edit' })
  if (useFeaturesStore().hasFeature(FeatureIdent.FOLDER)) {
    tabsetSelectionOptions.value.push({
      label: 'Add Folder to Collection',
      value: 'popup-add-folder',
      icon: 'sym_o_folder',
    })
  }
  if (useFeaturesStore().hasFeature(FeatureIdent.VISUALIZATIONS)) {
    tabsetSelectionOptions.value.push({
      label: 'Folder Visualisation',
      value: 'popup-visualize-folders',
      icon: 'sym_o_graph_5',
    })
  }

  if (stashedTabs.value) {
    tabsetSelectionOptions.value.push({ label: '', value: '', disable: true })
    tabsetSelectionOptions.value.push({ label: 'Stashed Tabs', value: 'stashed-tabs', icon: 'o_add' })
  }

  if (useFeaturesStore().hasFeature(FeatureIdent.SPACES)) {
    tabsetSelectionOptions.value.push({ label: '', value: '', disable: true })
    tabsetSelectionOptions.value.push({ label: 'Select Space...', value: 'select-space', icon: 'o_space_dashboard' })
  }
})

watchEffect(() => {
  animateMenuButton.value = useUiStore().animateMenuButton
})

watchEffect(() => {
  currentTabset.value = useTabsetsStore().getCurrentTabset
  //console.log('---got current tabset', currentTabset.value)
  if (currentTabset.value) {
    tabsetSelectionModel.value = {
      label: currentTabset.value?.name || '?',
      value: currentTabset.value?.id || '-',
    }
    overlap.value = useTabsStore2().getOverlap(currentTabset.value)
    overlapTooltip.value = `${Math.round(100 * overlap.value)}% overlap between this tabset and the currently open tabs`
  } else {
    // redirectOnEmpty()
  }
})

watchEffect(() => {
  const windowId = useWindowsStore().currentBrowserWindow?.id || 0
  currentBrowserTab.value = useTabsStore2().getCurrentChromeTab(windowId) || useTabsStore2().currentChromeTab
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

const offsetTop = () => ($q.platform.is.capacitor || $q.platform.is.cordova ? 'margin-top:40px;' : '')

const switchTabset = async (tabset: object) => {
  const tsId = tabset['value' as keyof object]
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
    tabsetSelectionModel.value = {
      label: currentTabset.value?.name || '?',
      value: currentTabset.value?.id || '-',
    }
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
        fromPanel: true,
      },
    })
    return
  }
  if (tsId === 'popup-manage-tabsets') {
    router.push('/popup/tabsets')
    return
  }
  if (tsId === 'popup-visualize-folders') {
    const target = chrome.runtime.getURL('/www/index.html#/mainpanel/visualizations/folders')
    openURL(target)
    return
  }
  if (tsId === 'show-tabset') {
    router.push('/popup/tabset')
    return
  }
  if (tsId === 'add-tabset') {
    // mode.value = 'add-tabset'
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

const tabsetColorStyle = () => {
  return currentTabset.value && currentTabset.value.color
    ? 'border-left: 3px solid ' +
        currentTabset.value.color +
        ';border-right: 3px solid ' +
        currentTabset.value.color +
        ';border-radius:3px'
    : ''
}

chrome.runtime.getContexts({}, (ctxs: object[]) => {
  //console.log('ctxs', ctxs)
  sidepanelEnabled.value = ctxs.filter((c: object) => 'SIDE_PANEL' === c['contextType' as keyof object]).length > 0
  // console.log('sidepanelEnabled', sidepanelEnabled.value)
})
</script>

<style scoped>
.q-list--dense > .q-item,
.q-item--dense {
  min-height: 22px;
}
</style>
