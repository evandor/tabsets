<template>

  <q-list separator class="q-ma-none">

    <!-- supporting drag & drop when not on mobile -->
    <vue-draggable-next v-if="!props.preventDragAndDrop"
                        class="q-ma-none"
                        :list="props.tabs as Array<Tab>"
                        :group="{ name: 'tabs', pull: 'clone' }"
                        @change="handleDragAndDrop">

      <SidePanelTabListHelper v-for="tab in props.tabs"
                              :parentId="undefined"
                              :tab="tab"
                              :type="props.type"
                              :sorting="props.sorting"
                              :preventDragAndDrop="false"
                              :tabsetType="props.tabsetType"
                              :tabsetId="props.tabsetId"
                              :show-tabsets="props.showTabsets"
                              :hide-menu="props.hideMenu"/>
    </vue-draggable-next>

    <!-- no drag & drop on mobile or on documents -->
    <SidePanelTabListHelper v-else-if="tabsetType !== TabsetType.DOCUMENTATION"
                            v-for="tab in props.tabs"
                            :parentId="undefined"
                            :tab="tab"
                            :type="props.type"
                            :sorting="props.sorting"
                            :preventDragAndDrop="true"
                            :tabsetType="props.tabsetType"
                            :tabsetId="props.tabsetId"
                            :show-tabsets="props.showTabsets"
                            :hide-menu="props.hideMenu"/>

    <q-tree v-else
            :nodes="nodes"
            node-key="id"
            selected-color="dark"
            @mouseenter="entered(true)"
            @mouseleave="entered(false)"
            v-model:selected="selected"
            v-model:expanded="expanded">
      <template v-slot:header-node="prop">
        <q-icon name="o_folder" class="q-mr-sm"/>
        <span class="cursor-pointer fit no-wrap">{{ prop.node.tab.title }}</span>

        <span class="text-right fit" v-show="mouseHover && prop.node.id === deleteButtonId">
          <q-icon name="delete_outline" color="negative" size="18px" @click.stop="deletePageDialog">
            <q-tooltip class="tooltip">Delete this page (and subpages)</q-tooltip>
          </q-icon>
        </span>

      </template>
    </q-tree>
  </q-list>

  <audio id="myAudio">
    <source src="mp3/click.mp3" type="audio/mp3">
  </audio>

</template>

<script setup lang="ts">
import {Tab, TabSorting} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {onMounted, PropType, ref, watch, watchEffect} from "vue";
import {VueDraggableNext} from 'vue-draggable-next'
import {useCommandExecutor} from "src/services/CommandExecutor";
import {CreateTabFromOpenTabsCommand} from "src/domain/commands/CreateTabFromOpenTabs";
import {TabsetType} from "src/models/Tabset";
import SidePanelTabListHelper from "components/layouts/sidepanel/SidePanelTabListHelper.vue";
import {uid, useQuasar} from "quasar";
import NavigationService from "src/services/NavigationService";
import BookmarksService from "src/services/BookmarksService";
import PagesService from "src/services/PagesService";
import {DeletePageCommand} from "src/domain/pages/DeletePageCommand";

const props = defineProps({
  tabs: {type: Array as PropType<Tab[]>, required: true},
  hideMenu: {type: Boolean, default: false},
  sorting: {type: String as PropType<TabSorting>, default: TabSorting.CUSTOM},
  type: {type: String, default: 'sidepanel'},
  showTabsets: {type: Boolean, default: false},
  preventDragAndDrop: {type: Boolean, default: false},
  tabsetId: {type: String, required: true},
  tabsetType: {type: String, default: TabsetType.DEFAULT.toString()},
})

const $q = useQuasar()

const expanded = ref([])
const nodes = ref<TreeItem[]>([])
const selected = ref('')
const mouseHover = ref(false)
const deleteButtonId = ref('')

class TreeItem {
  constructor(
      public id: string,
      public parentId: string | undefined,
      public tab: Tab,
      public children: TreeItem[],
      public header = 'node') {

  }
}

function findParent(items: TreeItem[], parentId: string | undefined): TreeItem | undefined {
  if (!parentId) {
    return undefined
  }
  console.log("searching parent", parentId, items)
  for (let node of items) {
    if (node.id === parentId) {
      console.log("found node", node)
      return node
    }
    const foundInChildren = findParent(node.children, parentId)
    if (foundInChildren) {
      return foundInChildren
    }
  }
  return undefined
}

function addNodesWithParent(parentId: string | undefined = undefined, number: number = 0) {
  //console.log("adding nodes with parent", parentId, number)
  props.tabs?.forEach((tab: Tab) => {
    //console.log("got tab", tab.id, tab.parent)
    let parents: string[] = []
    if (tab.parent === parentId) {
      const parent = findParent(nodes.value, parentId)
      //console.log("checking parent of tab", tab.parent, parents)
      if (parent) {
        //console.log("found parent", parent)
        parent.children.push(new TreeItem(tab.id, parentId, tab, []))
      } else {
        nodes.value.push(new TreeItem(tab.id, parentId, tab, []))
      }
    } else {
      if (tab.parent && parents.indexOf(tab.parent) < 0) {
        parents.push(tab.parent)
      }
    }
    parents.forEach(parentId => {
      addNodesWithParent(parentId, number + 1)
    })
  })
}

watchEffect(() => {
  //console.log("watcheffect", props.tabs)
  nodes.value = []
  addNodesWithParent()
  //console.log("nodes", nodes.value)
})

watchEffect(() => {
  deleteButtonId.value = selected.value
})

watch(() => selected.value, (currentValue, oldValue) => {
  console.log("current/old", currentValue, oldValue)
  if (currentValue !== oldValue) {
    // l#/mainpanel/notes/18a365f4-2fff-494f-9322-f6b087ef603e
    const path = "/www/index.html#/mainpanel/notes/" + selected.value
    NavigationService.openOrCreateTab(chrome.runtime.getURL(path))
  }
})

const handleDragAndDrop = (event: any) => {
  console.log("event", event)
  const {moved, added} = event
  if (moved) {
    console.log('d&d tabs moved', moved.element.id, moved.newIndex)
    let useIndex = moved.newIndex
    TabsetService.moveTo(moved.element.id, useIndex)
  }
  if (added) {
    useCommandExecutor()
        .executeFromUi(new CreateTabFromOpenTabsCommand(added.element, added.newIndex))
  }
}

const entered = (b: boolean) => mouseHover.value = b

const deletePageDialog = () => {
  $q.dialog({
    title: 'Delete Page',
    message: 'Would you like to delete this page and sub-pages if existent? This cannot be undone',
    cancel: true,
    persistent: true
  }).onOk(() => {
    useCommandExecutor().executeFromUi(new DeletePageCommand(selected.value))
    //router.push("/start")
  }).onCancel(() => {
  }).onDismiss(() => {
  })
}

</script>

<style lang="sass" scoped>
.my-card
  width: 100%
</style>
