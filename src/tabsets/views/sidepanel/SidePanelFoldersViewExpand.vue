<template>
  <!-- SidePanelFoldersView2 -->
  <q-list>
    <q-expansion-item
      v-if="props.tabset"
      v-for="folder in folders"
      :key="folder.id"
      :v-model="expanded[folder.id]"
      @show="expanded[folder.id] = true"
      @hide="expanded[folder.id] = false"
      dense
      dense-toggle
      header-style="padding: 0px 2px 0px 4px;margin: 0px 0px 0px 0px;border:0 solid red;border-radius:3px;height:32px"
      hide-expand-icon
      :label="folder.name">
      <template v-slot:header>
        <div class="row fit q-ma-none q-pa-none darkColors lightColors">
          <div class="col-2 text-center" style="border: 0 solid green; width: 35px; max-width: 35px">
            <q-icon :name="expanded[folder.id] ? 'sym_o_folder_open' : 'folder'" color="warning" size="sm" />
            <!--            <span class="tabsCount">{{ tabsAndFoldersCount(folder) }}</span>-->
          </div>
          <div class="col-9 ellipsis q-ml-sm">
            <div>{{ folder.name }}</div>
            <!--            <div class="text-caption" style="font-size: xx-small">{{ folderCaption(folder) }}</div>-->
          </div>
          <div class="col text-right">
            <q-btn
              round
              flat
              outline
              text-color="primary"
              class="cursor-pointer q-mt-none q-mr-none"
              icon="more_vert"
              size="sm" />
            <PanelTabListFolderContextMenu
              @button-clicked="(args: ActionHandlerButtonClickedHolder) => handleButtonClicked(tabset, args, folder)"
              v-if="currentChromeTab"
              :tabset="tabset"
              :currentChromeTab="currentChromeTab"
              :tabsetId="props.tabset.id!"
              :level="'folder'"
              :folder="folder" />
          </div>
        </div>
      </template>
      <q-card class="q-pl-md">
        <SidePanelPageContentExpand :tabset="folder" />
      </q-card>
    </q-expansion-item>
  </q-list>
</template>

<script lang="ts" setup>
import { Tabset } from 'src/tabsets/models/Tabset'
import { onMounted, ref, watchEffect } from 'vue'
import '@he-tree/vue/style/default.css'
import '@he-tree/vue/style/material-design.css'
import { QVueGlobals } from 'quasar'
import SidePanelPageContentExpand from 'src/core/pages/SidePanelPageContentExpand.vue'
import { useActionHandlers } from 'src/tabsets/actionHandling/ActionHandlers'
import { ActionHandlerButtonClickedHolder } from 'src/tabsets/actionHandling/model/ActionHandlerButtonClickedHolder'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import PanelTabListFolderContextMenu from 'src/tabsets/widgets/PanelTabListFolderContextMenu.vue'
import { useUiStore } from 'src/ui/stores/uiStore'
import { useWindowsStore } from 'src/windows/stores/windowsStore'

type Props = {
  tabset: Tabset
  filter?: string
}

const props = defineProps<Props>()

const emits = defineEmits(['folders-found', 'folder-selected'])

interface ExpandedState {
  [key: string]: boolean
}

const currentChromeTab = ref<chrome.tabs.Tab | undefined>(undefined)
const folders = ref<Tabset[]>([])
const expanded = ref<ExpandedState>({})

onMounted(() => {
  folders.value = calcFolders(props.tabset)
  folders.value.forEach((f: Tabset) => {
    expanded.value[f.id] = false
  })
})

watchEffect(() => {
  const windowId = useWindowsStore().currentBrowserWindow?.id || 0
  currentChromeTab.value = useTabsStore2().getCurrentChromeTab(windowId) || useTabsStore2().currentChromeTab
})

const calcFolders = (tabset: Tabset): Tabset[] => {
  if (tabset.folderActive) {
    const af = useTabsetService().findFolder(tabset.folders, tabset.folderActive)
    if (af && af.folderParent) {
      return af.folders.filter(
        (f: Tabset) => !props.filter || f.name.toLowerCase().indexOf(props.filter.toLowerCase()) >= 0,
      )
    }
  }
  return tabset.folders.filter(
    (f: Tabset) => !props.filter || f.name.toLowerCase().indexOf(props.filter.toLowerCase()) >= 0,
  )
}

watchEffect(() => {
  folders.value = calcFolders(props.tabset)
  emits('folders-found', folders.value.length)
})

const startDrag = (evt: any, folder: Tabset) => {
  console.log('start dragging', evt, folder)
  if (evt.dataTransfer) {
    evt.dataTransfer.dropEffect = 'all'
    evt.dataTransfer.effectAllowed = 'all'
    //evt.dataTransfer.setData('text/plain', tab.id)
    //useUiStore().draggingTab(tab.id, evt)
  }
  console.log("evt.dataTransfer.getData('text/plain')", evt.dataTransfer.getData('text/plain'))
}

const overDrag = (event: any, folder: Tabset) => {
  event.preventDefault()
}

const overDrag2 = (event: any) => {
  event.preventDefault()
}

const drop = (evt: any, folder: Tabset) => {
  console.log('drop', evt, folder)
  const tabToDrag = useUiStore().tabBeingDragged
  const tabset = useTabsetsStore().getCurrentTabset
  if (tabToDrag && tabset) {
    // console.log("tabToDrag", tabToDrag)
    const moveToFolderId = folder.id
    // console.log("moveToFolderId", moveToFolderId)
    useTabsetService().moveTabToFolder(tabset, tabToDrag, moveToFolderId)
  }
}

const tabsAndFoldersCount = (folder: Tabset) => {
  const cnt = folder.tabs.length + folder.folders.length
  return cnt === 0 ? '-' : cnt > 99 ? '99+' : cnt.toString()
}

const handleButtonClicked = async (tabset: Tabset, args: ActionHandlerButtonClickedHolder, folder?: Tabset) => {
  console.log(`button clicked: tsId=${tabset.id}, folderId=${folder?.id}, args=...`)
  await useActionHandlers(null as unknown as QVueGlobals).handleClick(tabset, currentChromeTab.value!, args, folder)
}

const parentChain = (tabset: Tabset, folder?: Tabset, chain: Tabset[] = []): Tabset[] => {
  // console.log(`parentChain tabset: ${tabset.id} (active: ${tabset.folderActive}), folder:${folder?.id}, chain.length: ${chain.length}`)
  if (chain.length > 5) {
    // safety net
    return chain
  }
  // if (!tabset.folderActive || tabset.id === folder?.folderParent) {
  if (!tabset.folderActive || tabset.id === folder?.folderParent || tabset.id === tabset.folderActive) {
    //|| tabset.folderActive === folder?.id) {
    // console.log("returning chain...")
    return chain
  }
  if (!folder) {
    // console.log("!folder", tabset.folderActive)
    const f: Tabset | undefined = useTabsetsStore().getActiveFolder(tabset, tabset.folderActive)
    if (f) {
      chain.push(f)
      return parentChain(tabset, f, chain)
    }
  } else {
    const f: Tabset | undefined = useTabsetsStore().getActiveFolder(tabset, folder.folderParent)
    if (f) {
      chain.push(f)
      return parentChain(tabset, f, chain)
    }
  }
  return chain
}
</script>

<style scoped lang="scss">
.body--dark .darkColors {
  background-color: $grey-8;
  border: 1px solid $grey-7;
}

.body--light .lightColors {
  background-color: $grey-1;
  border: 1px solid $grey-2;
}

.q-item__label {
  margin-top: 0;
}

.tabsCount {
  font-size: 10px !important;
  color: grey !important;
  position: absolute;
  z-index: 19999;
  top: 9px;
  left: 14px;
  text-align: right;
  width: 16px !important;
  max-width: 16px !important;
}
</style>
