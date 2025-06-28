<template>
  <!-- SidePanelTabListHelper -->
  <!--  @dragstart="startDrag($event, tab)" -->
  <q-item
    clickable
    v-ripple
    class="q-mt-xs q-mx-xs q-mb-none q-pr-none q-pl-sm q-pb-none q-pt-none darkColors lightColors"
    :style="itemStyle()"
    :key="'paneltablist_' + tab.id">
    <PublicPageListElementWidget :key="'ptlew__' + tab.id" :tab="tab" :type="props.type" :tabset="props.tabset!" />
  </q-item>
</template>

<script setup lang="ts">
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { Tab, TabSorting } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import PublicPageListElementWidget from 'src/tabsets/widgets/PublicPageListElementWidget.vue'
import { PropType } from 'vue'

const props = defineProps({
  tab: { type: Object as PropType<Tab>, required: true },
  index: { type: Number, required: true },
  hideMenu: { type: Boolean, default: false },
  sorting: { type: String as PropType<TabSorting>, default: TabSorting.CUSTOM },
  type: { type: String, default: 'sidepanel' },
  tabset: { type: Object as PropType<Tabset>, required: false },
  preventDragAndDrop: { type: Boolean, default: false },
})

const itemStyle = () => {
  let style = 'border-radius:3px;'
  if (props.tab.color && useFeaturesStore().hasFeature(FeatureIdent.COLOR_TAGS)) {
    style = style + 'border-left:3px solid ' + props.tab.color + ';border-radius:4px;'
  }
  return style
}
</script>
