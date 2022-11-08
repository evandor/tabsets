<template>

  <vue-draggable-next
    :key="props.group"
    class="row items-start"
    :list="props.tabs"
    :group="{ name: 'tabs', pull: 'clone' }"
    @change="handleDragAndDrop">
    <div
      class="col-xs-12 col-sm-4 col-md-3 col-lg-2 q-pa-xs"
      v-for="tab in props.tabs"
      :key="props.group + '_' + tab.id">

      <TabCardWidget :key="props.group + '__' + tab.id" :tab="tabAsTab(tab)" :highlightUrl="highlightUrl" />

    </div>
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
import {useTabsStore} from "stores/tabsStore";

const $q = useQuasar()
const tabsStore = useTabsStore()

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
  console.log("filtered", tabs)
  if (element.newIndex === 0) { // first element
    console.log(" 0 - searching for ", tabs[0].id)
    return _.findIndex(tabsStore.getCurrentTabs, t => t.id === tabs[0].id)
  } else {
    console.log(" 1 - searching for ", tabs[element.newIndex - 1].id)
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
    console.log('d&d tabs added', added.element.id, added.newIndex, props.group)
    console.log("tabs", tabsStore.getCurrentTabs)
    const exists = _.findIndex(tabsStore.getCurrentTabs, t => t.chromeTab.url === added.element.chromeTab.url) >= 0

    let useIndex = added.newIndex
    switch (props.group) {
      case 'otherTabs':
        const unpinnedNoGroup: Tab[] = _.filter(tabsStore.getCurrentTabs, (t: Tab) => !t.chromeTab.pinned && t.chromeTab.groupId === -1)
        if (unpinnedNoGroup.length > 0) {
          useIndex = adjustIndex(added, unpinnedNoGroup);
        }
        added.element.chromeTab.groupId = -1
        added.element.chromeTab.pinned = false
        break;
      case 'pinnedTabs':
        const filteredTabs: Tab[] = _.filter(tabsStore.getCurrentTabs, (t: Tab) => t.chromeTab.pinned)
        if (filteredTabs.length > 0) {
          useIndex = adjustIndex(added, filteredTabs);
        }
        added.element.chromeTab.pinned = true
        added.element.chromeTab.groupId = -1
        break
      default:
        if (props.group.startsWith('groupedTabs_')) {
          const groupId = props.group.split('_')[1]
          console.log("got group id", groupId)
          const filteredTabs: Tab[] = _.filter(tabsStore.getCurrentTabs, (t: Tab) => t.chromeTab.groupId === parseInt(groupId))
          if (filteredTabs.length > 0) {
            useIndex = adjustIndex(added, filteredTabs);
          }
          added.element.chromeTab.groupId = parseInt(groupId)
        }
        break
    }

    if (!exists) {
      if (useIndex !== undefined && useIndex >= 0) {
        tabsStore.getCurrentTabs.splice(useIndex, 0, added.element)
      } else {
        tabsStore.getCurrentTabs.push(added.element)
      }
    } else {
      const oldIndex = _.findIndex(tabsStore.getCurrentTabs, t => t.id === added.element.id)
      if (oldIndex >= 0) {
        const tab = tabsStore.getCurrentTabs.splice(oldIndex, 1)[0];
        tabsStore.getCurrentTabs.splice(useIndex, 0, tab);
      }

    }

    TabsetService.saveCurrentTabset()
      .then(() => {
        $q.notify({
          message: exists ? 'The tab has been moved' : 'The tab has been added',
          type: 'positive'
        })
      })
      .catch((err: any) => {
        console.log("err", err)
        $q.notify({
          message: 'The tab already exists in this tabset',
          type: 'negative'
        })
      })
  }
}

</script>

<style lang="sass" scoped>
.my-card
  width: 100%
</style>
