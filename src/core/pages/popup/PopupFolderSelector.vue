<template>
  <!-- PopupCollectionSelector -->
  <div class="row">
    <div class="col q-ma-none q-pa-none text-center" style="border: 0 solid red">
      <div class="text-bold ellipsis">
        <q-select
          filled
          :disable="props.disable"
          transition-show="scale"
          transition-hide="scale"
          v-model="folderSelectionModel"
          @update:model-value="(newTabset: object) => switchTabset(newTabset)"
          :options="folderSelectionOptions"
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
          v-if="showTabsCount && props.currentTabset.tabs.length > 0"
          class="text-left q-ml-sm text-caption vertical-middle text-grey-8 cursor-pointer"
          @click="router.push('/popup/tabset')">
          {{ props.currentTabset.tabs.length + ' ' + (props.currentTabset.tabs.length === 1 ? 'tab' : 'tabs') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { SidePanelViews } from 'src/app/models/SidePanelViews'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useUtils } from 'src/core/services/Utils'
import { SelectTabsetCommand } from 'src/tabsets/commands/SelectTabsetCommand'
import { FolderNode, FolderNodeVisitor } from 'src/tabsets/models/FolderNode'
import { Tabset } from 'src/tabsets/models/Tabset'
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

const router = useRouter()

class GetSelectedFolderVisitor implements FolderNodeVisitor {
  constructor(public folderActive: string) {}

  private selectedFolder: FolderNode | undefined = undefined

  visitFolder(folder: FolderNode): void {
    // console.log(`checking ${folder.id} - ${this.folderActive}`)
    if (folder.id === this.folderActive) {
      this.selectedFolder = folder
      console.log('selected', folder)
    }
  }

  getSelectedFolder(): FolderNode | undefined {
    return this.selectedFolder
  }
}

type Props = {
  currentTabset: Tabset
  disable?: boolean
  showTabsCount?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disable: false,
})

const showFilter = ref(false)
const windowLocation = ref('')
const annimateNewTabsetButton = ref(false)
const currentBrowserTab = ref<chrome.tabs.Tab | undefined>(undefined)
const showWatermark = ref(false)
const watermark = ref('')
const tabsets = ref<Tabset[]>([])
const animateMenuButton = ref(false)
const sidepanelEnabled = ref(false)

const folderSelectionModel = ref<SelectOption | undefined>(undefined)
const folderSelectionOptions = ref<SelectOption[]>([])

windowLocation.value = window.location.href

watchEffect(() => {
  tabsets.value = [...useTabsetsStore().tabsets.values()] as Tabset[]

  function nodesToOptions(options: SelectOption[], folderNode: FolderNode, level = 0) {
    options.push({ label: '\u00A0\u00A0'.repeat(level) + folderNode.name, value: folderNode.id })
    for (const f of folderNode.children) {
      nodesToOptions(options, f, level + 1)
    }
    return options
  }

  const folderTreeRoot = useTabsetsStore().getFolderTree(props.currentTabset)
  folderSelectionOptions.value = nodesToOptions([], folderTreeRoot)
  folderSelectionModel.value = folderSelectionOptions.value[0]!
  console.log('folderActive', props.currentTabset.folderActive)
  console.log('folderTreeRoot', folderTreeRoot)
  if (props.currentTabset.folderActive) {
    const visitor = new GetSelectedFolderVisitor(props.currentTabset.folderActive)
    folderTreeRoot.accept(visitor)
    const selectedFolder: FolderNode | undefined = visitor.getSelectedFolder()
    folderSelectionModel.value = { label: selectedFolder?.name || '???', value: selectedFolder?.id || '' }
  }
})

watchEffect(() => {
  animateMenuButton.value = useUiStore().animateMenuButton
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

const switchTabset = async (tabset: object) => {
  const tsId = tabset['value' as keyof object]
  if (tsId === 'select-space') {
    await router.push('/sidepanel/spaces')
    return
  }
  if (tsId === 'popup-manage-tabsets') {
    router.push('/popup/tabsets')
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
  emits('tabset-changed')
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
