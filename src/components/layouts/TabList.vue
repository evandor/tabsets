<template>

  <InfoMessageWidget
    v-if="props.tabs.length > 1"
    :probability="0.3"
    ident="tablist_dnd"
    hint="You can select the favicon images and drag and drop the entries to reorder the list to your wishes"/>

  <q-list separator>
    <vue-draggable-next
      class="dragArea list-group w-full"
      :list="props.tabs"
      :group="{ name: 'tabs', pull: 'clone' }"

      @change="handleDragAndDrop">

      <q-item v-if="props.tabs.length === 0 &&
                      inBexMode() &&
                      useUiStore().rightDrawer.activeTab === DrawerTabs.UNASSIGNED_TABS &&
                      tabsStore.pendingTabset.tabs.length > 0">
        <div class="row fit q-ma-lg q-pa-lg text-subtitle2 text-grey-8">
          You can drag and drop items from the "Tabs to add" view to add them to this tabset by clicking on the icons
        </div>
      </q-item>

      <q-item
        :clickable="usePermissionsStore().hasFeature(FeatureIdent.DETAILS)"
        v-ripple
        v-for="(tab,index) in props.tabs"
        class="q-my-lg"
        @click.stop="showDetails(tab)"
        @mouseover="showButtons(  tab.id,true)"
        @mouseleave="showButtons( tab.id, false)"
        @dragstart="startDrag($event, tab)"
        :key="props.group + '_' + tab.id">

        <TabListElementWidget :showButtons="showButtonsProp.get(tab.id)"
                              :key="props.group + '__' + tab.id"
                              :tab="tabAsTab(tab)"
                              :highlightUrl="highlightUrl"/>

      </q-item>
    </vue-draggable-next>
  </q-list>

</template>

<script setup lang="ts">
import {Tab} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {PropType, ref} from "vue";
import {VueDraggableNext} from 'vue-draggable-next'
import {useQuasar} from "quasar";
import _ from "lodash"
import {useTabsStore} from "src/stores/tabsStore";
import {useUiService} from "src/services/useUiService";
import {DrawerTabs, LeftDrawerState, useUiStore} from "src/stores/uiStore";
import {useTabsetService} from "src/services/TabsetService2";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {CreateTabFromOpenTabsCommand} from "src/domain/commands/CreateTabFromOpenTabs";
import TabListElementWidget from "src/components/widgets/TabListElementWidget.vue";
import {useUtils} from "src/services/Utils"
import InfoMessageWidget from "components/widgets/InfoMessageWidget.vue";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";

const {inBexMode} = useUtils()

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

const startDrag = (evt: any, tab: Tab) => {
  console.debug("start drag", evt, tab)
  if (evt.dataTransfer) {
    evt.dataTransfer.dropEffect = 'all'
    evt.dataTransfer.effectAllowed = 'all'
    evt.dataTransfer.setData('text/plain', tab.id)
    useUiService().draggingTab(tab.id, evt)
  }
  console.log("evt.dataTransfer.getData('text/plain')", evt.dataTransfer.getData('text/plain'))
}

const showDetails = (tab: Tab) => {
  if (usePermissionsStore().hasFeature(FeatureIdent.DETAILS)) {
    useUiStore().setSelectedTab(tab)
    useUiStore().rightDrawerSetActiveTab(DrawerTabs.TAB_DETAILS)
  }
}

</script>

<style lang="sass" scoped>
.my-card
  width: 100%
</style>
