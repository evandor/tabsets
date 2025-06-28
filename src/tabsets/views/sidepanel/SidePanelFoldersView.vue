<template>
  <!-- SidePanelFoldersView -->
  <div
    class="q-ma-none q-pa-sm q-pl-md greyBorderBottom"
    v-if="props.tabset?.folders?.length > 0 && currentFolderPath().length > 0">
    <q-breadcrumbs>
      <q-breadcrumbs-el
        class="cursor-pointer"
        icon="home"
        @click="selectFolder(props.tabset)"
        @dragover="overDrag2($event)"
        @drop="dropAtBreadcrumb($event)" />
      <q-breadcrumbs-el
        v-for="f in currentFolderPath()"
        class="cursor-pointer"
        @dragover="overDrag2($event)"
        @drop="dropAtBreadcrumb($event, f)"
        @click="selectFolder(props.tabset, f)"
        :label="f['name' as keyof object]" />
    </q-breadcrumbs>
  </div>

  <q-list>
    <q-item
      v-if="props.tabset"
      v-for="folder in folders"
      clickable
      v-ripple
      class="q-my-none q-mx-xs q-pa-none darkColors lightColors q-mt-xs"
      @dragstart="startDrag($event, folder)"
      @dragover="overDrag($event, folder)"
      @drop="drop($event, folder)"
      :key="'panelfolderlist_' + folder.id">
      <q-item-section
        @click="selectFolder(tabset, folder as Tabset)"
        class="q-mx-sm"
        style="justify-content: start; width: 25px; max-width: 25px">
        <div class="q-pa-none q-pl-sm">
          <q-icon :name="folder.type === TabsetType.RSS_FOLDER ? 'o_rss_feed' : 'folder'" color="warning" size="sm" />
        </div>
      </q-item-section>
      <q-item-section @click="selectFolder(tabset, folder as Tabset)">
        <q-item-label>
          <div class="text-subtitle2 ellipsis">
            <Highlight :filter="props.filter" :text="folder.name" />
          </div>
        </q-item-label>
        <!--        <q-item-label class="text-caption text-secondary">-->
        <!--          {{ folderCaption(folder) }}-->
        <!--        </q-item-label>-->
      </q-item-section>

      <q-item-section side @mouseover="hoveredTabset = tabset?.id" @mouseleave="hoveredTabset = undefined">
        <q-item-label>
          <span class="text-caption">{{ folderCaption(folder) }}</span>
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

          <!--          <SpecialUrlAddToTabsetComponent-->
          <!--            v-if="currentChromeTab"-->
          <!--            @button-clicked="(args: ActionHandlerButtonClickedHolder) => handleButtonClicked(tabset, args, folder)"-->
          <!--            :currentChromeTab="currentChromeTab"-->
          <!--            :tabset="tabset"-->
          <!--            :level="'folder'"-->
          <!--            :folder="folder" />-->
        </q-item-label>
      </q-item-section>
    </q-item>
  </q-list>

  <q-separator class="q-ma-sm q-mx-xl" v-if="folders.length > 0" />
</template>

<script lang="ts" setup>
import { Tabset, TabsetType } from 'src/tabsets/models/Tabset'
import { onMounted, ref, watchEffect } from 'vue'
import '@he-tree/vue/style/default.css'
import '@he-tree/vue/style/material-design.css'
import { QVueGlobals } from 'quasar'
import { useActionHandlers } from 'src/tabsets/actionHandling/ActionHandlers'
import { ActionHandlerButtonClickedHolder } from 'src/tabsets/actionHandling/model/ActionHandlerButtonClickedHolder'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import Highlight from 'src/tabsets/widgets/Highlight.vue'
import PanelTabListFolderContextMenu from 'src/tabsets/widgets/PanelTabListFolderContextMenu.vue'
import { useUiStore } from 'src/ui/stores/uiStore'
import { useWindowsStore } from 'src/windows/stores/windowsStore'

type Props = {
  tabset: Tabset
  filter?: string
}

const props = defineProps<Props>()

const emits = defineEmits(['folders-found', 'folder-selected'])

const currentChromeTab = ref<chrome.tabs.Tab | undefined>(undefined)
const hoveredTabset = ref<string | undefined>(undefined)
const folders = ref<Tabset[]>([])

onMounted(() => {
  folders.value = calcFolders(props.tabset)
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

const dropAtBreadcrumb = (evt: any, f?: any) => {
  // console.log("dropAtBreadcrumb", evt, f)
  const tabToDrag = useUiStore().tabBeingDragged
  const tabset = useTabsetsStore().getCurrentTabset
  // console.log("tabToDrag", tabToDrag, tabset?.id)
  if (tabToDrag && tabset) {
    const moveToFolderId = f?.id || undefined
    // console.log("moveToFolderId", moveToFolderId)
    useTabsetService().moveTabToFolder(tabset, tabToDrag, moveToFolderId)
  }
}

const selectFolder = (tabset: Tabset, folder?: Tabset) => {
  console.log(`selecting folder '${folder?.id}' (${folder?.name}) in tabset ${tabset.id} (${tabset.name})`)
  tabset.folderActive = folder ? (tabset.id === folder.id ? undefined : folder.id) : undefined
  useTabsetService().saveTabset(tabset)
  useTabsetService().handleHeadRequests(tabset, folder?.id)
  emits('folder-selected')
}

const folderCaption = (folder: Tabset): string => {
  if (folder.name !== '..') {
    const tabsInfo = folder.tabs.length + ' tab' + (folder.tabs.length !== 1 ? 's' : '')
    if (folder.folders.length > 0) {
      return tabsInfo + ', ' + folder.folders.length + ' folder' + (folder.folders.length !== 1 ? 's' : '')
    } else {
      return tabsInfo
    }
  } else {
    return ''
  }
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

const currentFolderPath = (): Tabset[] => {
  const res: Tabset[] = parentChain(props.tabset)
  return res ? res.reverse() : []
}
</script>

<style scoped>
.q-item__label {
  margin-top: 0;
}

.q-item {
  min-height: 30px;
}
</style>
