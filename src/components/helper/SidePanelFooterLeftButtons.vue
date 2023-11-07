<template>

  <q-btn v-if="props.showSuggestionIcon"
         @click.stop="emits('wasClicked')"
         icon="o_lightbulb"
         class="q-my-xs q-ml-xs q-px-xs"
         flat
         color="warning"
         size="9px">
    <q-tooltip class="tooltip">{{ suggestionsLabel() }}</q-tooltip>
  </q-btn>

  <SidePanelFooterLeftButton
      :side-panel-view="SidePanelView.TABS_LIST" icon="o_playlist_add"
      tooltip="All your browser's open tabs"/>

  <SidePanelFooterLeftButton :side-panel-view="SidePanelView.BOOKMARKS"
                             icon="bookmark"
                             :size="buttonSize"
                             tooltip="Show the Bookmarks Browser"/>
  <SidePanelFooterLeftButton :side-panel-view="SidePanelView.TAGS_LIST"
                             icon="o_label"
                             :size="buttonSize"
                             tooltip="List of all tags sorted by prevalence"/>
  <SidePanelFooterLeftButton :side-panel-view="SidePanelView.BY_DOMAIN_LIST"
                             icon="o_dns"
                             :size="buttonSize"
                             tooltip="List all your tabs URLs by domain"/>
  <SidePanelFooterLeftButton :side-panel-view="SidePanelView.RSS_LIST"
                             icon="o_rss_feed"
                             tooltip="List all your RSS feeds"/>
  <SidePanelFooterLeftButton :side-panel-view="SidePanelView.NEWEST_TABS_LIST"
                             icon="o_schedule"
                             :size="buttonSize"
                             tooltip="Newest Tabs List"/>
  <SidePanelFooterLeftButton :side-panel-view="SidePanelView.TOP_10_TABS_LIST"
                             icon="o_workspace_premium"
                             :size="buttonSize"
                             tooltip="Top 10 Tabs List"/>

  <span class="q-ma-none"
        v-if="permissionsStore.hasFeature(FeatureIdent.OPENTABS_THRESHOLD) && tabsStore.tabsets?.size > 0">
            <OpenTabsThresholdWidget :showLabel="false" :in-side-panel="true">
              <q-tooltip>{{ tabsStore.tabs?.length }} open tabs</q-tooltip>
            </OpenTabsThresholdWidget>
          </span>

</template>
<script setup lang="ts">
import {SidePanelView, useUiStore} from "stores/uiStore";
import {FeatureIdent} from "src/models/AppFeature";
import SidePanelFooterLeftButton from "components/helper/SidePanelFooterLeftButton.vue";
import OpenTabsThresholdWidget from "components/widgets/OpenTabsThresholdWidget.vue";
import {usePermissionsStore} from "stores/permissionsStore";
import {useTabsStore} from "stores/tabsStore";
import {useSuggestionsStore} from "stores/suggestionsStore";
import {ref, watchEffect} from "vue";

const props = defineProps({
  showSuggestionIcon: {type: Boolean, required: true}
})

const emits = defineEmits(['wasClicked'])

const permissionsStore = usePermissionsStore()
const tabsStore = useTabsStore()

const buttonSize = ref('15px')

watchEffect(() => {
  buttonSize.value = useUiStore().getButtonSize('sidePanelFooter')
})

const suggestionsLabel = () => {
  const suggestions = useSuggestionsStore().getSuggestions()
  return suggestions.length === 1 ?
      suggestions.length + " New Suggestion" :
      suggestions.length + " New Suggestions"

}

</script>