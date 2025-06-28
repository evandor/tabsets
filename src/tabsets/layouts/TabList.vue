<template>
  <!-- TabList -->
  <InfoMessageWidget
    v-if="!preventDragAndDrop() && props.tabs?.length > 1"
    :probability="0.3"
    ident="tablist_dnd"
    hint="You can select the favicon images and drag and drop the entries to reorder the list to your wishes" />

  <q-list separator v-if="!preventDragAndDrop()">
    <vue-draggable-next
      class="dragArea list-group w-full"
      :list="props.tabs as Array<Tab>"
      :group="{ name: 'tabs', pull: 'clone' }"
      @change="handleDragAndDrop">
      <TabListHelper
        :group="group"
        :tabset-id="props.tabsetId"
        :tabset="props.tabset!"
        :tabset-shared-id="tabsetSharedId!"
        :simpleUi="props.simpleUi"
        :tabs="props.tabs" />
    </vue-draggable-next>
  </q-list>

  <TabListHelper
    v-else
    :group="group"
    :tabset-id="props.tabsetId"
    :tabset="props.tabset!"
    :tabset-shared-id="tabsetSharedId!"
    :simpleUi="props.simpleUi"
    :tabs="props.tabs" />
</template>

<script setup lang="ts">
import _ from 'lodash'
import { useQuasar } from 'quasar'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { CreateTabFromOpenTabsCommand } from 'src/tabsets/commands/CreateTabFromOpenTabs'
import { Tab, TabSorting } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import TabListHelper from 'src/tabsets/pages/pwa/TabListHelper.vue'
import TabsetService from 'src/tabsets/services/TabsetService'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import InfoMessageWidget from 'src/ui/widgets/InfoMessageWidget.vue'
import { PropType } from 'vue'
import { VueDraggableNext } from 'vue-draggable-next'

const $q = useQuasar()

const props = defineProps({
  tabs: { type: Array as PropType<Tab[]>, required: true },
  tabsetId: { type: String, required: true },
  tabset: { type: Object as PropType<Tabset>, required: false },
  group: { type: String, required: true },
  highlightUrl: { type: String, required: false },
  tabsetSharedId: { type: String, required: false },
  tabsetMqttUrl: { type: String, required: false },
  tabsetSorting: { type: String, required: false },
  simpleUi: { type: Boolean, default: false },
})

function adjustIndex(element: any, tabs: Tab[]) {
  //console.log("filtered", tabs)
  if (element.newIndex === 0) {
    // first element
    //console.log(" 0 - searching for ", tabs[0].id)
    return _.findIndex(useTabsetsStore().getCurrentTabs, (t: Tab) => t.id === tabs[0]!.id)
  } else {
    //console.log(" 1 - searching for ", tabs[element.newIndex - 1].id)
    return 1 + _.findIndex(useTabsetsStore().getCurrentTabs, (t: Tab) => t.id === tabs[element.newIndex - 1]!.id)
  }
}

const handleDragAndDrop = (event: any) => {
  console.log('event', event)
  const { moved, added } = event
  if (moved) {
    console.log('d&d tabs moved', moved.element.id, moved.newIndex, props.group)
    let useIndex = moved.newIndex
    switch (props.group) {
      case 'otherTabs':
        // // @ts-expect-error TODO
        // const unpinnedNoGroup: Tab[] = _.filter(
        //   tabsStore.getCurrentTabs,
        //   (t: Tab) => !t.pinned && t.groupId === -1,
        // )
        // if (unpinnedNoGroup.length > 0) {
        //   useIndex = adjustIndex(moved, unpinnedNoGroup)
        // }
        break
      case 'pinnedTabs':
        const filteredTabs: Tab[] = _.filter(useTabsetsStore().getCurrentTabs, (t: Tab) => t.pinned)
        if (filteredTabs.length > 0) {
          useIndex = adjustIndex(moved, filteredTabs)
        }
        break
      default:
        if (props.group.startsWith('groupedTabs_')) {
          // const groupId = props.group.split('_')[1]
          // // @ts-expect-error TODO
          // const filteredTabs: Tab[] = _.filter(
          //   tabsStore.getCurrentTabs,
          //   (t: Tab) => t.groupId === parseInt(groupId),
          // )
          // if (filteredTabs.length > 0) {
          //   useIndex = adjustIndex(moved, filteredTabs)
          // }
        }
        break
    }
    TabsetService.moveTo(moved.element.id, useIndex)
  }
  if (added) {
    useCommandExecutor().executeFromUi(new CreateTabFromOpenTabsCommand(added.element, added.newIndex))
  }
}

const preventDragAndDrop = () => $q.platform.is.mobile || props.tabsetSorting !== TabSorting.CUSTOM
</script>

<style lang="sass" scoped>
.my-card
  width: 100%
</style>
