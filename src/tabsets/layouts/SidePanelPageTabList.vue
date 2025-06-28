<template>
  <!-- SidePanelPageTabList -->
  <div style="width: 100%; max-width: 100%">
    <q-list class="q-ma-none">
      <template v-if="useUiStore().folderStyle === 'goInto'">
        <SidePanelTabListHelper
          v-for="(tab, index) in pinnedTabs"
          :key="index"
          v-once
          :view-context="props.viewContext"
          :tab="tab.tab as Tab"
          :index="tab.index"
          :tabset="props.tabset!"
          :filter="props.filter || ''" />

        <q-separator v-if="pinnedTabs.length > 0" class="q-mt-xs" />
      </template>
      <vue-draggable-next
        v-if="tabs.length > 0"
        class="q-ma-none"
        :list="tabs"
        :group="{ name: 'tabs', pull: 'clone' }"
        @change="(event: any) => handleDragAndDrop(event)">
        <SidePanelTabListHelper
          v-for="(tab, index) in tabs"
          :key="index"
          v-once
          :view-context="props.viewContext"
          :tab="tab.tab as Tab"
          :index="tab.index"
          :tabset="props.tabset!"
          :filter="props.filter || ''" />
      </vue-draggable-next>
      <div v-else-if="props.filter" class="q-ma-md text-caption">
        Filter <em>'{{ props.filter }}'</em> did not match anything inside this collection. Click 'Enter' to search in
        all your collections.
      </div>
      <div v-else-if="props.tabset?.folders.length === 0 && useTabsetsStore().allTabsCount > 0">
        <div class="q-pa-sm fit">
          <q-card class="my-card fit">
            <q-card-section class="text-caption text-center">
              Empty Tabset<br />
              Click the
              <span class="cursor-pointer" @click="useUiStore().startButtonAnimation('addtab')">action menu</span>
              to add a new tab<br />
            </q-card-section>
          </q-card>
        </div>
      </div>
    </q-list>

    <audio id="myAudio">
      <source src="/mp3/click.mp3" type="audio/mp3" />
    </audio>
  </div>
</template>

<script lang="ts" setup>
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { ViewContext } from 'src/core/models/ViewContext'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import SidePanelTabListHelper from 'src/tabsets/layouts/SidePanelTabListHelper.vue'
import { IndexedTab } from 'src/tabsets/models/IndexedTab'
import { Tab, TabSorting } from 'src/tabsets/models/Tab'
import { Tabset, TabsetType } from 'src/tabsets/models/Tabset'
import TabsetService from 'src/tabsets/services/TabsetService'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useUiStore } from 'src/ui/stores/uiStore'
import { PropType, ref, watch } from 'vue'
import { VueDraggableNext } from 'vue-draggable-next'

const props = defineProps({
  hideMenu: { type: Boolean, default: false },
  sorting: { type: String as PropType<TabSorting>, default: TabSorting.CUSTOM },
  type: { type: String, default: 'sidepanel' },
  showTabsets: { type: Boolean, default: false },
  tabset: { type: Object as PropType<Tabset>, required: false },
  tabsCount: { type: Number, default: -1 },
  activeFolder: { type: String, required: false },
  filter: { type: String, required: false },
  viewContext: { type: String as PropType<ViewContext>, default: 'default' },
})

const emits = defineEmits(['tabs-found'])

const tabs = ref<IndexedTab[]>([])
const pinnedTabs = ref<IndexedTab[]>([])

watch(
  () => props.filter,
  (a: string | undefined, b: string | undefined) => {
    tabs.value = tabsForColumn()
    emits('tabs-found', tabs.value.length)
  },
)

watch(
  () => props.tabset?.tabs || [],
  (a: Tab[], b: Tab[]) => {
    tabs.value = tabsForColumn()
    emits('tabs-found', tabs.value.length)
  },
)

const handleDragAndDrop = async (event: any) => {
  //console.log('SidePanelPageTabList d&d event:', event, props)
  const { moved, added } = event
  if (moved) {
    //console.log(`moved event: '${moved.element.tab.id}' ${moved.oldIndex} -> ${moved.newIndex} (${props.activeFolder})`)
    const tabsInColumn = tabsForColumn()
    const movedElement: Tab = tabsInColumn[moved.oldIndex]!.tab
    const realNewIndex = tabsInColumn[moved.newIndex]!.index
    //console.log(`             '${movedElement.id}' ${moved.oldIndex} -> ${realNewIndex}`)
    await TabsetService.moveTo(movedElement.id, realNewIndex, props.activeFolder)
  }
  if (added) {
    //console.log(`added event: '${added.element.tab.id}' ${added.oldIndex} -> ${added.newIndex}`)
    const tabsInColumn = tabsForColumn()
    const movedElement: Tab = added.element.tab
    const realNewIndex = added.newIndex < tabsInColumn.length ? tabsInColumn[added.newIndex]!.index : 0
    //console.log(`             '${added.element.tab.id}' ${added.oldIndex} -> ${realNewIndex}`)
    //movedElement.columnId = column.id
    await useTabsetService().saveCurrentTabset()
  }
}

const tabsForColumn = (): IndexedTab[] => {
  function filterMatches(property: string | undefined): boolean {
    if (!property) {
      return false
    }
    return property.toLowerCase().indexOf(props.filter!.toLowerCase()) >= 0
  }

  return (props.tabset?.tabs as Tab[])
    .filter((t: Tab) => {
      if (!props.filter || props.filter.trim() === '') {
        return true
      }
      const res =
        filterMatches(t.url) || filterMatches(t.description) || filterMatches(t.name) || filterMatches(t.title)
      return res
    })
    .sort((a: Tab, b: Tab) => {
      return props.tabset && props.tabset.type === TabsetType.RSS_FOLDER ? b.created - a.created : 0
    })
    .map((t: Tab, index: number) => new IndexedTab(index, t))
}

const calcPinnedTabs = (): IndexedTab[] => {
  const result: IndexedTab[] = []
  if (!props.tabset || !useFeaturesStore().hasFeature(FeatureIdent.PIN_TAB)) {
    return result
  }
  const activeFolder = useTabsetsStore().getActiveFolder(props.tabset)
  if (!activeFolder) {
    return result
  }
  const folderChain = useTabsetsStore().getFolderChain(activeFolder.id)
  //console.log('folderChain', folderChain)
  if (folderChain.length > 0) {
    const rootTabset = useTabsetsStore().getTabset(folderChain[folderChain.length - 1]!)
    for (var i = 1; i < folderChain.length; i++) {
      const parentFolder = useTabsetsStore().getActiveFolder(rootTabset!, folderChain[i])
      const pinnedInListTabs = parentFolder?.tabs
        .filter((t: Tab) => t.pinnedInList)
        .map((t: Tab, index: number) => new IndexedTab(index, t))
      if (pinnedInListTabs) {
        result.push(...pinnedInListTabs)
      }
    }
  }
  return result
}

tabs.value = tabsForColumn()
pinnedTabs.value = calcPinnedTabs()

// console.log('---')
emits('tabs-found', tabs.value.length)
</script>

<style>
.q-expansion-item--popup > .q-expansion-item__container {
  border: 0 solid rgba(0, 0, 0, 0.12) !important;
}

.q-list--separator > .q-item-type + .q-item-type,
.q-list--separator > .q-virtual-scroll__content > .q-item-type + .q-item-type {
  border-top: 0 solid rgba(100, 0, 0, 0.12) !important;
}
</style>
