<template>

  <q-list bordered separator>
    <vue-draggable-next
      class="dragArea list-group w-full"
      :list="props.bookmarks"
      :group="{ name: 'tabs', pull: 'clone' }"
      @change="handleDragAndDrop">
      <q-item
        clickable v-ripple
        v-for="(bm,index) in props.bookmarks"
        :key="props.group + '_' + bm.id">

        <BookmarkListElementWidget
          :key="props.group + '__' + bm.id" :bookmark="bm" :highlightUrl="highlightUrl"/>

      </q-item>
    </vue-draggable-next>
  </q-list>

</template>

<script setup lang="ts">
import {Bookmark} from "src/models/Bookmark";
import {PropType, ref} from "vue";
import {VueDraggableNext} from 'vue-draggable-next'
import {useQuasar} from "quasar";
import {useTabsStore} from "src/stores/tabsStore";
import {DrawerTabs, useUiStore} from "src/stores/uiStore";
import {useTabsetService} from "src/services/TabsetService2";
import {useCommandExecutor} from "src/services/CommandExecutor";
import BookmarkListElementWidget from "components/widgets/BookmarkListElementWidget.vue";
import {CreateBookmarkFromOpenTabsCommand} from "src/domain/commands/CreateBookmarkFromOpenTabsCommand";

const $q = useQuasar()
const tabsStore = useTabsStore()

const {saveCurrentTabset} = useTabsetService()

const props = defineProps({
  bookmarks: {
    type: Array as PropType<Array<Bookmark>>,
    required: true
  },
  group: {
    type:String,
    required: true
  },
  parent: {
    type: String,
    required: true
  },
  highlightUrl: {
    type: String,
    required: false
  }
})
const showDeleteButton = ref<Map<string, boolean>>(new Map())

const thumbnails = ref<Map<string, string>>(new Map())
//const tabAsTab = (tab: Tab): Tab => tab as unknown as Tab

// function adjustIndex(element: any, tabs: Tab[]) {
//   //console.log("filtered", tabs)
//   if (element.newIndex === 0) { // first element
//     //console.log(" 0 - searching for ", tabs[0].id)
//     return _.findIndex(tabsStore.getCurrentTabs, t => t.id === tabs[0].id)
//   } else {
//     //console.log(" 1 - searching for ", tabs[element.newIndex - 1].id)
//     return 1 + _.findIndex(tabsStore.getCurrentTabs, t => t.id === tabs[element.newIndex - 1].id)
//   }
// }

const handleDragAndDrop = (event: any) => {
  console.log("event", event)
  const {moved, added} = event
  if (moved) {
    console.log('d&d bookmarks moved', moved.element.id, moved.newIndex)
    let useIndex = moved.newIndex
    // switch (props.group) {
    //   case 'otherTabs':
    //     // @ts-ignore
    //     const unpinnedNoGroup: Tab[] = _.filter(tabsStore.getCurrentTabs, (t: Tab) => !t.chromeTab.pinned && t.chromeTab.groupId === -1)
    //     if (unpinnedNoGroup.length > 0) {
    //       //useIndex = adjustIndex(moved, unpinnedNoGroup);
    //     }
    //     break;
    //   case 'pinnedTabs':
    //     const filteredTabs: Tab[] = _.filter(tabsStore.getCurrentTabs, (t: Tab) => t.chromeTab.pinned)
    //     if (filteredTabs.length > 0) {
    //       // useIndex = adjustIndex(moved, filteredTabs);
    //     }
    //     break
    //   default:
    //     if (props.group.startsWith('groupedTabs_')) {
    //       const groupId = props.group.split('_')[1]
    //       // @ts-ignore
    //       const filteredTabs: Tab[] = _.filter(tabsStore.getCurrentTabs, (t: Tab) => t.chromeTab.groupId === parseInt(groupId))
    //       if (filteredTabs.length > 0) {
    //         // useIndex = adjustIndex(moved, filteredTabs);
    //       }
    //     }
    //     break
    // }
    //TabsetService.moveTo(moved.element.id, useIndex)
  }
  if (added) {
    useCommandExecutor()
      .executeFromUi(new CreateBookmarkFromOpenTabsCommand(added.element, added.newIndex, props.parent))
  }
}

const openOrShowOpenTabs = () => {
}

const startDrag = (evt: any, tab: Bookmark) => {
  console.log("start drag", evt, tab)
  if (evt.dataTransfer) {
    evt.dataTransfer.dropEffect = 'move'
    evt.dataTransfer.effectAllowed = 'move'
    evt.dataTransfer.setData('text/plain', tab.id)
    useUiStore().draggingTab(tab.id,null as unknown as DragEvent)
  }
  console.log("evt.dataTransfer.getData('text/plain')", evt.dataTransfer.getData('text/plain'))
}


</script>

<style lang="sass" scoped>
.my-card
  width: 100%
</style>
