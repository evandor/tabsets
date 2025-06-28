<template>
  <!-- SidePanelTabListHelper -->
  <!--  @dragstart="startDrag($event, tab)" -->
  <q-item
    clickable
    v-ripple
    class="q-mt-xs q-mx-xs q-mb-none q-pr-none q-pl-none q-pb-none q-pt-none darkColors lightColors"
    :style="itemStyle()"
    @dragstart="startDrag($event, tab)"
    :key="'paneltablist_' + tab.id">
    <PanelTabListElementWidget2
      :key="'ptlew__' + tab.id"
      :view-context="props.viewContext"
      :tab="tab"
      :tabset="props.tabset!"
      :filter="props.filter || ''">
      <template v-for="(slot, index) of Object.keys($slots)" :key="index" v-slot:[slot]>
        <slot :name="slot"></slot>
      </template>
    </PanelTabListElementWidget2>
  </q-item>

  <!--  <q-item-->
  <!--    clickable-->
  <!--    v-ripple-->
  <!--    class="q-mt-xs q-mx-xs q-mb-none q-pr-none q-pl-none q-pb-none q-pt-none darkColors lightColors"-->
  <!--    :style="itemStyle()"-->
  <!--    @dragstart="startDrag($event, tab)"-->
  <!--    :key="'paneltablist_' + tab.id">-->
  <!--    <PanelTabListElementWidget-->
  <!--      :key="'ptlew__' + tab.id"-->
  <!--      :tab="tab"-->
  <!--      :tabset="props.tabset!"-->
  <!--      :filter="props.filter || ''">-->
  <!--      <template v-for="(slot, index) of Object.keys($slots)" :key="index" v-slot:[slot]>-->
  <!--        <slot :name="slot"></slot>-->
  <!--      </template>-->
  <!--    </PanelTabListElementWidget>-->
  <!--  </q-item>-->
</template>

<script setup lang="ts">
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { ViewContext } from 'src/core/models/ViewContext'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import PanelTabListElementWidget2 from 'src/tabsets/widgets/PanelTabListElementWidget2.vue'
import { useUiStore } from 'src/ui/stores/uiStore'
import { PropType } from 'vue'

const props = defineProps({
  tab: { type: Object as PropType<Tab>, required: true },
  index: { type: Number, required: true },
  tabset: { type: Object as PropType<Tabset>, required: false },
  filter: { type: String, required: false },
  viewContext: { type: String as PropType<ViewContext>, default: 'default' },
})

const startDrag = (evt: any, tab: Tab) => {
  //console.log('start drag', evt, tab)
  if (evt.dataTransfer) {
    evt.dataTransfer.dropEffect = 'all'
    evt.dataTransfer.effectAllowed = 'all'
    evt.dataTransfer.setData('text/plain', tab.id)
    useUiStore().draggingTab(tab.id, evt)
  }
  //console.log("evt.dataTransfer.getData('text/plain')", evt.dataTransfer.getData('text/plain'))
}

const itemStyle = () => {
  let style = 'border-radius:3px;'
  if (props.tab.color && useFeaturesStore().hasFeature(FeatureIdent.COLOR_TAGS)) {
    style = style + 'border-left:3px solid ' + props.tab.color + ';border-radius:4px;'
  }
  return style
}
</script>

<style scoped lang="scss">
.q-item {
  min-height: 30px;
}
</style>
