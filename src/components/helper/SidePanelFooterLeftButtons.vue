<template>

  <q-btn v-if="props.showSuggestionIcon"
         @click.stop="emits('wasClicked')"
         icon="o_lightbulb"
         class="q-my-xs q-ml-xs q-px-xs"
         flat
         color="warning"
         :size="props.size">
    <q-tooltip class="tooltip-small">{{ suggestionsLabel() }}</q-tooltip>
  </q-btn>

  <q-btn v-if="showViewMenu()"
         icon="o_view_list"
         :size="props.size"
         class="q-my-xs q-ml-xs q-mr-none q-px-xs"
         flat>
    <q-menu>
      <q-list dense>
        <!--        <q-item dense clickable v-close-popup>-->
        <!--          <q-item-section>new window</q-item-section>-->
        <!--        </q-item>-->
        <SidePanelFooterViewMenuItem :side-panel-view="SidePanelViews.BY_DOMAIN_LIST"
                                     label="Tabs By Domain"
                                     icon="o_dns"
                                     :size="buttonSize"
                                     tooltip="List all your tabs URLs by domain"/>
        <SidePanelFooterViewMenuItem :side-panel-view="SidePanelViews.TAGS_LIST"
                                     icon="o_label"
                                     label="Tags List"
                                     :size="buttonSize"
                                     tooltip="List of all tags sorted by prevalence"/>
        <SidePanelFooterViewMenuItem :side-panel-view="SidePanelViews.NEWEST_TABS_LIST"
                                     label="Newest Tabs"
                                     icon="o_schedule"
                                     :size="buttonSize"
                                     tooltip="Latest Tabs List"/>
        <SidePanelFooterViewMenuItem :side-panel-view="SidePanelViews.TOP_10_TABS_LIST"
                                     label="Top 10 Tabs"
                                     icon="o_workspace_premium"
                                     :size="buttonSize"
                                     tooltip="Top 10 Tabs List"/>
        <SidePanelFooterViewMenuItem :side-panel-view="SidePanelViews.TABS_AS_TREE"
                                     label="Tabs as Tree"
                                     icon="o_account_tree"
                                     :size="buttonSize"
                                     tooltip="Show a tree view of your tabs"/>

        <!-- :disable="useUiStore().sidePanelActiveViewIs(SidePanelViews.MAIN)" -->
        <SidePanelFooterViewMenuItem :side-panel-view="SidePanelViews.MAIN"
                                     label="Default View"
                                     icon=""
                                     :size="buttonSize"
                                     tooltip="Back to Default View"/>

      </q-list>
    </q-menu>
  </q-btn>

  <template v-if="!showViewMenu()">

    <SidePanelFooterLeftButton
      :side-panel-view="SidePanelViews.BY_DOMAIN_LIST"
      :size="props.size"
      icon="o_dns"
      tooltip="List all your tabs URLs by domain"/>

    <SidePanelFooterLeftButton
      :side-panel-view="SidePanelViews.TAGS_LIST"
      :size="props.size"
      icon="o_label"
      tooltip="Tags List"/>

    <SidePanelFooterLeftButton
      :side-panel-view="SidePanelViews.NEWEST_TABS_LIST"
      :size="props.size"
      icon="o_schedule"
      tooltip="Latest Tabs List"/>

    <SidePanelFooterLeftButton
      :side-panel-view="SidePanelViews.TABS_AS_TREE"
      :size="props.size"
      icon="o_account_tree"
      tooltip="Show a tree view of your tabs"/>

    <SidePanelFooterLeftButton
      :side-panel-view="SidePanelViews.TOP_10_TABS_LIST"
      :size="props.size"
      icon="o_workspace_premium"
      tooltip="Top 10 Tabs List (by access)"/>

  </template>

  <SidePanelFooterLeftButton
    :side-panel-view="SidePanelViews.TABS_LIST"
    :size="props.size"
    icon="o_playlist_add"
    tooltip="All your browser's open tabs"/>

  <SidePanelFooterLeftButton v-if="unreadMessagesCount > 0"
                             :side-panel-view="SidePanelViews.MESSAGES"
                             icon="o_chat"
                             :size="props.size"
                             tooltip="Your messages">
    <q-badge color="red" floating v-if="unreadMessagesCount > 0">{{ unreadMessagesCount }}</q-badge>
  </SidePanelFooterLeftButton>

  <SidePanelFooterLeftButton :side-panel-view="SidePanelViews.BOOKMARKS"
                             icon="o_bookmark"
                             defaultColor="warning"
                             :class="{ shake: animateBookmarksButton }"
                             :size="props.size"
                             tooltip="Show the Bookmarks Browser"/>

  <SidePanelFooterLeftButton :side-panel-view="SidePanelViews.RSS_LIST"
                             icon="o_rss_feed"
                             :size="props.size"
                             tooltip="List all your RSS feeds"/>

  <span class="q-ma-none"
        v-if="useFeaturesStore().hasFeature(FeatureIdent.OPENTABS_THRESHOLD) && useTabsetsStore().tabsets?.size > 0">
            <OpenTabsThresholdWidget :showLabel="false" :in-side-panel="true">
              <q-tooltip>{{ useTabsStore2().browserTabs?.length }} open tabs</q-tooltip>
            </OpenTabsThresholdWidget>
          </span>

</template>
<script setup lang="ts">
import {useUiStore} from "src/ui/stores/uiStore";
import {FeatureIdent} from "src/app/models/FeatureIdent";
import {useSuggestionsStore} from "src/suggestions/stores/suggestionsStore";
import {ref, watchEffect} from "vue";
import {SuggestionState} from "src/suggestions/models/Suggestion";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {useFeaturesStore} from "src/features/stores/featuresStore";
import {SidePanelViews} from "src/models/SidePanelViews";
import OpenTabsThresholdWidget from "src/opentabs/widgets/OpenTabsThresholdWidget.vue";
import {useTabsStore2} from "src/tabsets/stores/tabsStore2";
import SidePanelFooterViewMenuItem from "src/ui/components/SidePanelFooterViewMenuItem.vue";
import SidePanelFooterLeftButton from "src/ui/components/SidePanelFooterLeftButton.vue";

const props = defineProps({
  showSuggestionIcon: {type: Boolean, required: true},
  size: {type: String, default: "10px"}
})

const emits = defineEmits(['wasClicked'])

const buttonSize = ref('15px')
const unreadMessagesCount = ref(0)
const animateBookmarksButton = ref(false)

watchEffect(() => {
  buttonSize.value = useUiStore().getButtonSize('sidePanelFooter')
})

watchEffect(() => {
  animateBookmarksButton.value = useUiStore().animateBookmarksButton
})

const suggestionsLabel = () => {
  const suggestions = useSuggestionsStore().getSuggestions([SuggestionState.NEW, SuggestionState.DECISION_DELAYED])
  return suggestions.length === 1 ?
    suggestions.length + " New Suggestion" :
    suggestions.length + " New Suggestions"

}

const showViewMenu = () => {
  if (useTabsetsStore().allTabsCount === 0) {
    return false
  }
  const activeViews = [
    useFeaturesStore().hasFeature(FeatureIdent.TABS_AS_TREE),
    useFeaturesStore().hasFeature(FeatureIdent.NEWEST_TABS),
    useFeaturesStore().hasFeature(FeatureIdent.GROUP_BY_DOMAIN),
    useFeaturesStore().hasFeature(FeatureIdent.TAGS),
    useFeaturesStore().hasFeature(FeatureIdent.TOP10)
  ]
  return activeViews.filter(Boolean).length > 3
}
</script>

<script setup lang="ts">
</script>
