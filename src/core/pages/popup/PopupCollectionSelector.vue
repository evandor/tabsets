<template>
  <!-- PopupCollectionSelector -->
  <div class="row">
    <div class="col q-ma-none q-pa-none text-center">
      <div class="text-bold ellipsis">
        <q-input v-if="collectionMode === 'add'" v-model="newCollection" dense ref="newCollectionInputRef">
          <template v-slot:append>
            <q-icon name="close" @click="quitAddCollection" class="cursor-pointer" />
          </template>
        </q-input>
        <q-select
          v-else
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
                <q-item-section
                  style="max-width: 20px"
                  v-if="
                    scope.opt.label !== 'Switch to' &&
                    scope.opt.label !== 'Open Bibbly Collection' &&
                    scope.opt.label !== 'Add'
                  ">
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
          v-if="showTabsCount && currentTabset && currentTabset.tabs.length > 0"
          class="text-left q-ml-sm text-caption vertical-middle text-grey-8 cursor-pointer"
          @click="router.push('/popup/tabset')">
          {{ currentTabset.tabs.length + ' ' + (currentTabset.tabs.length === 1 ? 'tab' : 'tabs') }}
        </div>
        <!--        <template v-else-if="mode == 'add-tabset'">-->
        <!--          <transition appear enter-active-class="animated fadeInDown" leave-active-class="animated fadeInUp">-->
        <!--            <q-input @blur="blurNewTabset()" autofocus v-model="newTabsetName" dense label="Add new Collection" />-->
        <!--          </transition>-->
        <!--        </template>-->
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useFocus } from '@vueuse/core'
import { openURL, useQuasar } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { SidePanelViews } from 'src/app/models/SidePanelViews'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useTabsetSelector } from 'src/core/pages/common/useTabsetSelector'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useUtils } from 'src/core/services/Utils'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { SelectTabsetCommand } from 'src/tabsets/commands/SelectTabsetCommand'
import DeleteTabsetDialog from 'src/tabsets/dialogues/DeleteTabsetDialog.vue'
import EditTabsetDialog from 'src/tabsets/dialogues/EditTabsetDialog.vue'
import NewTabsetDialog from 'src/tabsets/dialogues/NewTabsetDialog.vue'
import { Tabset, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useTagsService } from 'src/tags/TagsService'
import { useUiStore } from 'src/ui/stores/uiStore'
import { useWindowsStore } from 'src/windows/stores/windowsStore'
import { ref, shallowRef, watchEffect } from 'vue'
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
const collectionMode = ref<'add' | 'default'>('default')
const newCollection = ref<string | undefined>(undefined)
const newCollectionInputRef = shallowRef()
const { focused } = useFocus(newCollectionInputRef)

const stashedTabs = ref(false)

const { tabsetSelectionOptions, tabsetSelectionModel, setAutomaticSelectionLabel } = useTabsetSelector('popup')

watchEffect(() => {
  const tsCat = useTagsService().getCurrentTabContentClassification().classification
  console.log('gto tsCat', tsCat)
  if (tsCat) {
    const label: string = tsCat.split(':').length === 2 ? tsCat.split(':')[1]! : tsCat
    setAutomaticSelectionLabel('automatic: ' + label)
  }
})

windowLocation.value = window.location.href

watchEffect(() => {
  tabsets.value = [...useTabsetsStore().tabsets.values()] as Tabset[]
  const useSpaces = useFeaturesStore().hasFeature(FeatureIdent.SPACES)
  const space = useSpacesStore().space

  stashedTabs.value = tabsets.value.filter((ts: Tabset) => ts.type === TabsetType.SESSION).length > 0
})

watchEffect(() => {
  animateMenuButton.value = useUiStore().animateMenuButton
})

function setModelFromCurrentTabset() {
  if (currentTabset.value) {
    tabsetSelectionModel.value = {
      label: currentTabset.value?.name || '?',
      value: currentTabset.value?.id || '-',
    }
    overlap.value = useTabsStore2().getOverlap(currentTabset.value)
    overlapTooltip.value = `${Math.round(100 * overlap.value)}% overlap between this tabset and the currently open tabs`
  }
}

watchEffect(() => {
  currentTabset.value = useTabsetsStore().getCurrentTabset
  //console.log('---got current tabset', currentTabset.value)
  setModelFromCurrentTabset()
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
  console.log('switching tabset', tabset)
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
  if (tsId === 'add-collection') {
    collectionMode.value = 'add'
    setTimeout(() => (focused.value = true), 600)
  }
  if (tsId === 'automatic-selection') {
    useTabsetsStore().unselectCurrentTabset()
    currentTabset.value = undefined
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

const quitAddCollection = () => {
  collectionMode.value = 'default'
  setModelFromCurrentTabset()
}
</script>

<style scoped>
.q-list--dense > .q-item,
.q-item--dense {
  min-height: 22px;
}
</style>
