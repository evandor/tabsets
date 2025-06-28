<template>
  <!-- PanelTabListElementWidget left part: icon plus various -->
  <q-item-section
    @mouseover="hoveredTab = tab.id"
    @mouseleave="hoveredTab = undefined"
    class="q-mr-none q-mt-xs text-left"
    style="justify-content: start; width: 36px; max-width: 36px">
    <TabListIconItem :tabset="props.tabset!" :tab="tab" :detail-level="props.detailLevel" />
  </q-item-section>

  <!-- middle part: name, title, description, url && note -->
  <q-item-section
    class="q-mb-xs q-mt-xs q-mx-none q-pa-none"
    @mouseover="hoveredTab = tab.id"
    @mouseleave="hoveredTab = undefined">
    <TabListMainItem
      :header="props.header"
      :tabset="props.tabset"
      :filter="props.filter || undefined"
      :tab="tab"
      :showCommentsForMinimalDetails="showCommentList"
      :detail-level="props.detailLevel" />
  </q-item-section>

  <!-- right part -->
  <slot name="actionPart">
    <!--    <q-item-section-->
    <!--      class="q-ma-none q-pa-none text-right"-->
    <!--      @mouseover="hoveredTab = tab.id"-->
    <!--      @mouseleave="hoveredTab = undefined"-->
    <!--      :style="TabService.isCurrentTab(props.tab) ? 'border-right:3px solid #1565C0;border-radius:3px' : ''"-->
    <!--      style="justify-content: start; width: 30px; max-width: 30px">-->
    <!--      <TabListActionsItem :tabset="props.tabset!" :tab="tab" :detail-level="props.detailLevel" />-->
    <!--    </q-item-section>-->
    <q-item-section side style="justify-content: start">
      <span>
        <q-icon
          v-if="props.tab.pinnedInList && useUiStore().folderStyle === 'goInto'"
          name="sym_o_keep"
          size="16px"
          class="q-ma-none q-pa-none"
          style="cursor: default"
          color="primary">
          <q-tooltip class="tooltip-small">This tab is pinned, i.e. it appears in all subfolders</q-tooltip>
        </q-icon>
        <q-icon
          v-if="showReadingMode()"
          name="o_menu_book"
          size="16px"
          class="q-ma-none q-pa-none"
          color="primary"
          @click.stop="showInReadingMode()">
          <q-tooltip class="tooltip-small">Click here to open in Reading Mode</q-tooltip>
        </q-icon>

        <q-icon
          v-if="(props.tab as Tab).comments && (props.tab as Tab).comments.length > 0"
          name="o_chat"
          size="16px"
          color="primary"
          style="position: relative; top: 1px"
          class="q-ma-none q-pa-none q-ml-xs"
          @click.stop="toggleShowWith('comments')">
          <q-tooltip class="tooltip-small">There are comments for this tab</q-tooltip>
        </q-icon>

        <TabListActionsItem
          :tabset="props.tabset!"
          :tab="tab"
          :detail-level="props.detailLevel"
          :view-context="'default'" />
      </span>
    </q-item-section>
  </slot>
</template>

<script setup lang="ts">
import BrowserApi from 'src/app/BrowserApi'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { TabReferenceType } from 'src/content/models/TabReference'
import { useNavigationService } from 'src/core/services/NavigationService'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { Suggestion } from 'src/suggestions/domain/models/Suggestion'
import { useSuggestionsStore } from 'src/suggestions/stores/suggestionsStore'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import TabListActionsItem from 'src/tabsets/widgets/tabListItems/TabListActionsItem.vue'
import TabListIconItem from 'src/tabsets/widgets/tabListItems/TabListIconItem.vue'
import TabListMainItem from 'src/tabsets/widgets/tabListItems/TabListMainItem.vue'
import { ListDetailLevel, useUiStore } from 'src/ui/stores/uiStore'
import { PropType, ref, watchEffect } from 'vue'

const props = defineProps({
  tab: { type: Object as PropType<Tab>, required: true },
  tabset: { type: Object as PropType<Tabset>, required: false },
  header: { type: String, required: false },
  filter: { type: String, required: false },
  detailLevel: { type: String as PropType<ListDetailLevel>, required: false },
})

const hoveredTab = ref<string | undefined>(undefined)
const suggestion = ref<Suggestion | undefined>(undefined)
const doShowDetails = ref(false)
const showCommentList = ref(false)
const showPlaceholderList = ref(false)

watchEffect(() => {
  if (props.tab.url) {
    suggestion.value = useSuggestionsStore().getSuggestionForUrl(props.tab.url)
  }
})

const showInReadingMode = () =>
  useNavigationService().browserTabFor(chrome.runtime.getURL(`/www/index.html#/mainpanel/readingmode/${props.tab.id}`))

const showReadingMode = () => {
  if (props.tab) {
    const t: Tab = Object.assign(new Tab(props.tab.id, BrowserApi.createChromeTabObject('', '')), props.tab)
    return useFeaturesStore().hasFeature(FeatureIdent.READING_MODE) && t.hasTabReference(TabReferenceType.READING_MODE)
  }
  return false
}

const toggleLists = (ident: string) => {
  switch (ident) {
    case 'annotations':
      showCommentList.value = false
      break
    case 'comments':
      showCommentList.value = !showCommentList.value
      console.log('showCommentList set to', showCommentList.value)
      break
    case 'placeholder':
      showPlaceholderList.value = !showPlaceholderList.value
      break
    default:
      console.log('undefined ident for toggle lists', ident)
      break
  }
}

const toggleShowWith = (ident: string | undefined) => {
  doShowDetails.value = !doShowDetails.value
  if (ident) {
    toggleLists(ident)
  }
}
</script>

<style lang="scss" src="src/tabsets/widgets/css/panelTabListElementWidget.scss" />
