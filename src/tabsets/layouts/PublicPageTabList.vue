<template>
  <!-- PublicPageTabList -->
  <div style="width: 100%; max-width: 100%">
    <q-list class="q-ma-none">
      <PublicPageTabListHelper
        v-for="tab in tabsForColumn() as Array<IndexedTab>"
        :tab="tab.tab as Tab"
        :index="0"
        :type="props.type"
        :sorting="props.tabset?.type === TabsetType.RSS_FOLDER ? TabSorting.TITLE : props.sorting"
        :tabset="props.tabset!"
        :hide-menu="props.hideMenu" />
    </q-list>
  </div>
</template>

<script setup lang="ts">
import PublicPageTabListHelper from 'src/tabsets/layouts/PublicPageTabListHelper.vue'
import { IndexedTab } from 'src/tabsets/models/IndexedTab'
import { Tab, TabSorting } from 'src/tabsets/models/Tab'
import { Tabset, TabsetType } from 'src/tabsets/models/Tabset'
import { PropType, ref, watchEffect } from 'vue'

const props = defineProps({
  hideMenu: { type: Boolean, default: false },
  sorting: { type: String as PropType<TabSorting>, default: TabSorting.CUSTOM },
  type: { type: String, default: 'sidepanel' },
  tabset: { type: Object as PropType<Tabset>, required: false },
  tabsCount: { type: Number, default: -1 },
  activeFolder: { type: String, required: false },
})

const tabs = ref<Tab[]>([])

watchEffect(() => {
  if (props.tabset) {
    tabs.value = props.tabset.tabs // useTabsetService().tabsToShow(props.tabset)
  } else {
    console.warn('could not determine tabset...')
    tabs.value = []
  }
})

const tabsForColumn = (): IndexedTab[] => {
  return (tabs.value as Tab[])
    .sort((a: Tab, b: Tab) => {
      return props.tabset && props.tabset.type === TabsetType.RSS_FOLDER ? b.created - a.created : 0
    })
    .map((t: Tab, index: number) => new IndexedTab(index, t))
}
</script>
