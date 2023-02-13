<template>

  <vue-draggable-next
    :key="props.group"
    class="row items-start"
    :list="props.tabs"
    :group="{ name: 'tabs', pull: 'clone' }"
    @change="handleDragAndDrop">
    <div
      v-if="props.tabs.length > 0"
      class="col-xs-12 col-sm-4 col-md-3 col-lg-2 q-pa-xs"
      v-for="tab in props.tabs"
      @dragstart="startDrag($event, tab)"
      :key="props.group + '_' + tab.id">

      <TabCardWidget :key="props.group + '__' + tab.id" :tab="tabAsTab(tab)" :highlightUrl="highlightUrl"/>

    </div>

<!--    <div v-else-if="tabsStore.pendingTabset?.tabs.length === 0" class="q-ma-md q-pa-xl fit"-->
<!--         style="border: 2px dotted grey; border-radius: 7px">-->
<!--      <div class="row fit text-subtitle2 justify-center items-center">-->
<!--        <div class="col-12">drag and drop new tabs from</div>-->
<!--      </div>-->
<!--      <div class="row">-->
<!--        <div class="col-12 cursor-pointer text-blue-8" @click="openOrShowOpenTabs()">here</div>-->
<!--      </div>-->
<!--    </div>-->

  </vue-draggable-next>

</template>

<script setup lang="ts">
import {Tab} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {PropType, ref} from "vue";
import {VueDraggableNext} from 'vue-draggable-next'
import TabCardWidget from "src/components/widgets/TabCardWidget.vue"
import {useQuasar} from "quasar";
import _ from "lodash"
import {useTabsStore} from "src/stores/tabsStore";
import {useUiService} from "src/services/useUiService";
import {LeftDrawerState, DrawerTabs} from "src/stores/uiStore";
import {useTabsetService} from "src/services/TabsetService2";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {CreateTabFromOpenTabsCommand} from "src/domain/commands/CreateTabFromOpenTabs";

const $q = useQuasar()
const tabsStore = useTabsStore()
const uiService = useUiService()

const {saveCurrentTabset} = useTabsetService()

const props = defineProps({
  tabs: {
    type: Array as PropType<Array<Tab>>,
    required: true
  },
  group: {
    type: String,
    required: true
  },
  highlightUrl: {
    type: String,
    required: false
  }
})

const thumbnails = ref<Map<string, string>>(new Map())
const tabAsTab = (tab: Tab): Tab => tab as unknown as Tab

function adjustIndex(element: any, tabs: Tab[]) {
  //console.log("filtered", tabs)
  if (element.newIndex === 0) { // first element
    //console.log(" 0 - searching for ", tabs[0].id)
    return _.findIndex(tabsStore.getCurrentTabs, t => t.id === tabs[0].id)
  } else {
    //console.log(" 1 - searching for ", tabs[element.newIndex - 1].id)
    return 1 + _.findIndex(tabsStore.getCurrentTabs, t => t.id === tabs[element.newIndex - 1].id)
  }
}

const handleDragAndDrop = (event: any) => {
  console.log("event", event)
  const {moved, added} = event
  if (moved) {
    console.log('d&d tabs moved', moved.element.id, moved.newIndex, props.group)
    let useIndex = moved.newIndex
    switch (props.group) {
      case 'otherTabs':
        // @ts-ignore
        const unpinnedNoGroup: Tab[] = _.filter(tabsStore.getCurrentTabs, (t: Tab) => !t.chromeTab.pinned && t.chromeTab.groupId === -1)
        if (unpinnedNoGroup.length > 0) {
          useIndex = adjustIndex(moved, unpinnedNoGroup);
        }
        break;
      case 'pinnedTabs':
        const filteredTabs: Tab[] = _.filter(tabsStore.getCurrentTabs, (t: Tab) => t.chromeTab.pinned)
        if (filteredTabs.length > 0) {
          useIndex = adjustIndex(moved, filteredTabs);
        }
        break
      default:
        if (props.group.startsWith('groupedTabs_')) {
          const groupId = props.group.split('_')[1]
          // @ts-ignore
          const filteredTabs: Tab[] = _.filter(tabsStore.getCurrentTabs, (t: Tab) => t.chromeTab.groupId === parseInt(groupId))
          if (filteredTabs.length > 0) {
            useIndex = adjustIndex(moved, filteredTabs);
          }
        }
        break
    }
    TabsetService.moveTo(moved.element.id, useIndex)
  }
  if (added) {
    useCommandExecutor()
      .executeFromUi(new CreateTabFromOpenTabsCommand(added.element, added.newIndex, props.group))
  }
}

const openOrShowOpenTabs = () => {
  // const activeTab = uiService.leftDrawerActiveTab()
  const drawerModel = uiService.drawerModel()
  if (drawerModel.state === LeftDrawerState.SMALL || drawerModel.activeTab !== DrawerTabs.OPEN_TABS) {
    uiService.leftDrawerSetActiveTab(DrawerTabs.OPEN_TABS)
  } else {
    uiService.leftDrawerAnimateLabel()
  }
  // useUiService().setWideDrawer()
}

const startDrag = (evt: any, tab: Tab) => {
  console.log("start drag", evt, tab)
  if (evt.dataTransfer) {
    evt.dataTransfer.dropEffect = 'move'
    evt.dataTransfer.effectAllowed = 'move'
    evt.dataTransfer.setData('text/plain', tab.id)
    useUiService().draggingTab(tab.id)
  }
  console.log("evt.dataTransfer.getData('text/plain')", evt.dataTransfer.getData('text/plain'))
}

</script>

<style lang="sass" scoped>
.my-card
  width: 100%
</style>
