<template>

  <!--  <InfoMessageWidget-->
  <!--    v-if="props.tabs?.length > 1"-->
  <!--    :probability="0.3"-->
  <!--    css-class="q-pa-none"-->
  <!--    ident="paneltablist_dnd"-->
  <!--    hint="You can select the favicon images and drag and drop the entries to reorder the list"/>-->

  <q-list separator class="q-ma-none">
    <vue-draggable-next
      class="q-ma-none"
      :list="props.tabs as Array<Tab>"
      :group="{ name: 'tabs', pull: 'clone' }"

      @change="handleDragAndDrop">

      <q-item
        clickable
        v-ripple
        v-for="tab in props.tabs"
        class="q-ma-none q-pa-sm"
        :style="itemStyle(tab)"

        @dragstart="startDrag($event, tab)"
        :key="'paneltablist_' + tab.id">

        <PanelTabListElementWidget :key="'ptlew__' + tab.id"
                                   :tab="tab"
                                   :type="props.type"
                                   :tabsetType="props.tabsetType"
                                   :hide-menu="props.hideMenu"/>

      </q-item>
    </vue-draggable-next>
  </q-list>

  <audio id="myAudio">
    <source src="mp3/click.mp3" type="audio/mp3">
  </audio>

</template>

<script setup lang="ts">
import {Tab} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {onMounted, PropType, ref} from "vue";
import {VueDraggableNext} from 'vue-draggable-next'
import {useQuasar} from "quasar";
import _ from "lodash"
import {useTabsStore} from "src/stores/tabsStore";
import {DrawerTabs, useUiStore} from "src/stores/uiStore";
import {useTabsetService} from "src/services/TabsetService2";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {CreateTabFromOpenTabsCommand} from "src/domain/commands/CreateTabFromOpenTabs";
import {useUtils} from "src/services/Utils"
import InfoMessageWidget from "components/widgets/InfoMessageWidget.vue";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import PanelTabListElementWidget from "components/widgets/PanelTabListElementWidget.vue";
import {TabsetType} from "src/models/Tabset";
import {useWindowsStore} from "stores/windowsStores";

const {inBexMode} = useUtils()

const $q = useQuasar()
const tabsStore = useTabsStore()

const {saveCurrentTabset} = useTabsetService()

const props = defineProps({
  tabs: {type: Array as PropType<Tab[]>, required: true},
  hideMenu: {type: Boolean, default: false},
  type: {type: String, default: 'sidepanel'},
  tabsetType: {type: String, default: TabsetType.DEFAULT.toString()},
})

const thumbnails = ref<Map<string, string>>(new Map())
const tabAsTab = (tab: Tab): Tab => tab as unknown as Tab

const showButtonsProp = ref<Map<string, boolean>>(new Map())

const showButtons = (tabId: string, show: boolean) => showButtonsProp.value.set(tabId, show)

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
    console.log('d&d tabs moved', moved.element.id, moved.newIndex)
    let useIndex = moved.newIndex
    TabsetService.moveTo(moved.element.id, useIndex)
  }
  if (added) {
    useCommandExecutor()
      .executeFromUi(new CreateTabFromOpenTabsCommand(added.element, added.newIndex))
  }
}

const startDrag = (evt: any, tab: Tab) => {
  console.debug("start drag", evt, tab)
  if (evt.dataTransfer) {
    evt.dataTransfer.dropEffect = 'all'
    evt.dataTransfer.effectAllowed = 'all'
    evt.dataTransfer.setData('text/plain', tab.id)
    useUiStore().draggingTab(tab.id, evt)
  }
  console.log("evt.dataTransfer.getData('text/plain')", evt.dataTransfer.getData('text/plain'))
}

// const showDetails = (tab: Tab) => {
//   console.log("showing details - what for?")
//   useUiStore().setSelectedTab(tab)
//   useUiStore().rightDrawerSetActiveTab(DrawerTabs.TAB_DETAILS)
// }

const itemStyle = (tab: Tab) => "border-bottom: 1px solid #fafafa"

</script>

<style lang="sass" scoped>
.my-card
  width: 100%
</style>
