<template>

  <q-list separator class="q-ma-none">

    <!-- supporting drag & drop when not on mobile -->
    <template v-if="!props.preventDragAndDrop"
              v-for="column in getColumns()">

      <q-expansion-item v-if="showTabsetWithColumns()"
                        header-class="q-ma-none q-pa-none q-pl-sm q-pr-md bg-grey-1 text-blue-grey-10"

                        :label="column.title || column.id"
                        :default-opened="tabsForColumn(column).length === 1"
                        switch-toggle-side
                        expand-icon-toggle
                        dense-toggle>

        <template v-slot:header>
          <q-item-section
            class="q-mt-xs">
            <q-item-label class="text-bold text-underline">
              {{ column.title }}
            </q-item-label>
            <q-item-label class="text-caption text-grey-5">
              {{ column.id }}
            </q-item-label>
          </q-item-section>
        </template>

        <vue-draggable-next
          class="q-ma-none"
          :list="tabsForColumn(column) as Array<IndexedTab>"
          :group="{ name: 'tabs', pull: 'clone' }"
          @change="(event:any) => handleDragAndDrop(event, column)">

          <SidePanelTabListHelper v-for="tab in tabsForColumn(column)"
                                  :tab="tab.tab as Tab"
                                  :index="tab.index"
                                  :type="props.type"
                                  :sorting="props.sorting"
                                  :preventDragAndDrop="false"
                                  :tabset="props.tabset"
                                  :show-tabsets="props.showTabsets"
                                  :hide-menu="props.hideMenu"/>
        </vue-draggable-next>
      </q-expansion-item>
      <template v-else>
        <vue-draggable-next
          class="q-ma-none"
          :list="tabs as Array<Tab>"
          :group="{ name: 'tabs', pull: 'clone' }"
          @change="(event:any) => handleDragAndDrop(event,  column)">


          <SidePanelTabListHelper v-for="tab in tabsForColumn(column)"
                                  :tab="tab.tab as Tab"
                                  :index="tab.index"
                                  :type="props.type"
                                  :sorting="props.sorting"
                                  :preventDragAndDrop="false"
                                  :tabset="props.tabset"
                                  :show-tabsets="props.showTabsets"
                                  :hide-menu="props.hideMenu"/>
        </vue-draggable-next>
      </template>
    </template>

    <!-- no drag & drop on mobile -->
    <template v-else>
      ***
      <SidePanelTabListHelper
        v-for="tab in tabs"
        :tab="tab as Tab"
        :type="props.type"
        :sorting="props.sorting"
        :preventDragAndDrop="true"
        :tabset="props.tabset"
        :show-tabsets="props.showTabsets"
        :hide-menu="props.hideMenu"/>
    </template>
  </q-list>

  <audio id="myAudio">
    <source src="mp3/click.mp3" type="audio/mp3">
  </audio>

</template>

<script setup lang="ts">
import {Tab, TabSorting} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {ref, onMounted, PropType, watchEffect} from "vue";
import {VueDraggableNext} from 'vue-draggable-next'
import {useCommandExecutor} from "src/services/CommandExecutor";
import {CreateTabFromOpenTabsCommand} from "src/domain/commands/CreateTabFromOpenTabs";
import {Tabset, TabsetStatus, TabsetType} from "src/models/Tabset";
import SidePanelTabListHelper from "components/layouts/sidepanel/SidePanelTabListHelper.vue";
import {useTabsStore} from "stores/tabsStore";
import {useTabsetService} from "src/services/TabsetService2";
import {Group} from "src/models/Group";
import {SPECIAL_ID_FOR_NO_GROUP_ASSIGNED} from "boot/constants";
import _ from "lodash"
import {IndexedTab} from "src/models/IndexedTab";
import SidePanelPageContextMenu from "pages/sidepanel/SidePanelPageContextMenu.vue";

const props = defineProps({
  hideMenu: {type: Boolean, default: false},
  sorting: {type: String as PropType<TabSorting>, default: TabSorting.CUSTOM},
  type: {type: String, default: 'sidepanel'},
  showTabsets: {type: Boolean, default: false},
  preventDragAndDrop: {type: Boolean, default: false},
  tabset: {type: Object as PropType<Tabset>, required: false},
})

const tabs = ref<Tab[]>([])

const handleDragAndDrop = (event: any, column: Group) => {
  const {moved, added} = event
  console.log("event", event)
  if (moved) {
    console.log(`moved event: '${moved.element.tab.id}' ${moved.oldIndex} -> ${moved.newIndex}`)
    const tabsInColumn = tabsForColumn(column)
    const movedElement: Tab = tabsInColumn[moved.oldIndex].tab
    const realNewIndex = tabsInColumn[moved.newIndex].index
    console.log(`             '${movedElement.id}' ${moved.oldIndex} -> ${realNewIndex}`)
    TabsetService.moveTo(movedElement.id, realNewIndex, column)
  }
  if (added) {
    console.log(`added event: '${added.element.tab.id}' ${added.oldIndex} -> ${added.newIndex}, ${column.title || column.id}`)
    const tabsInColumn = tabsForColumn(column)
    const movedElement: Tab = added.element.tab
    const realNewIndex = added.newIndex < tabsInColumn.length ?
      tabsInColumn[added.newIndex].index : 0
    console.log(`             '${added.element.tab.id}' ${added.oldIndex} -> ${realNewIndex}`)
    movedElement.columnId = column.id
    useTabsetService().saveCurrentTabset()
    //useCommandExecutor()
    //  .executeFromUi(new CreateTabFromOpenTabsCommand(added.element, added.newIndex))
  }
}

watchEffect(() => {
  const tabset = useTabsStore().getTabset(props.tabset?.id || "")
  if (tabset) {
    tabs.value = useTabsetService().tabsToShow(tabset)
  } else {
    console.warn("could not determine tabset for id", props.tabset?.id || "")
    tabs.value = []
  }
})

/**
 * props.tabset.columns can be []
 */
const getColumns = () => {
  if (!props.tabset || !props.tabset.columns || props.tabset.columns.length === 0) {
    return [new Group(SPECIAL_ID_FOR_NO_GROUP_ASSIGNED, '')]
  }
  const columnsFromTabs = _.uniq(_.map(props.tabset.tabs, t => t.columnId ? t.columnId : "undefined"))
  console.log("columnsFromTabs", columnsFromTabs)
  if (columnsFromTabs.length > props.tabset.columns.length || columnsFromTabs.length === 1 && columnsFromTabs[0] === "undefined") {
    return props.tabset.columns.concat([new Group(SPECIAL_ID_FOR_NO_GROUP_ASSIGNED, 'tabs w/o group')])
  }
  return props.tabset.columns
}

const tabsForColumn = (column: Group): IndexedTab[] => {
  const tfc = _.filter(
    _.map(tabs.value as Tab[], (t: Tab, index: number) => new IndexedTab(index, t)), (it: IndexedTab) => {
      if (column.id === SPECIAL_ID_FOR_NO_GROUP_ASSIGNED) {
        return it.tab.columnId === SPECIAL_ID_FOR_NO_GROUP_ASSIGNED || !it.tab.columnId
      }
      return it.tab.columnId === column.id
    })
 // console.log("tfc", tfc)
  return tfc
}

const showTabsetWithColumns = () => {
  const cols = getColumns()
  if (cols.length === 1) {
    return cols[0].id !== SPECIAL_ID_FOR_NO_GROUP_ASSIGNED
  }
  return getColumns().length > 0
}
</script>

<style lang="sass" scoped>
.my-card
  width: 100%
</style>
