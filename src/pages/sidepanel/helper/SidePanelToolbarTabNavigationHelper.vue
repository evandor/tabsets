<template>
  <template v-if="usePermissionsStore().hasFeature(FeatureIdent.OPEN_TABS)">
    <SidePanelToolbarButton
        icon="chevron_left"
        tooltip="Back to last tab"
        :disable="useTabsStore().chromeTabsHistoryPosition === 0"
        :color="useTabsStore().chromeTabsHistoryPosition === 0 ? 'grey' : 'black'"
        @click="NavigationService.backOneTab()"/>

    <SidePanelToolbarButton
        icon="chevron_right"
        tooltip="Return to tab before"
        :disable="useTabsStore().chromeTabsHistoryPosition === useTabsStore().chromeTabsHistory.length-1"
        :color="useTabsStore().chromeTabsHistoryPosition === useTabsStore().chromeTabsHistory.length-1 ? 'grey' : 'black'"
        @click="NavigationService.forwardOneTab()"/>

    <span class="q-ma-none q-pa-none q-mx-sm text-grey-5">|</span>
  </template>
</template>
<script setup lang="ts">
import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {useTabsStore} from "stores/tabsStore";
import NavigationService from "src/services/NavigationService";
import ToolbarButton from "components/buttons/SidePanelToolbarButton.vue";
import SidePanelToolbarButton from "components/buttons/SidePanelToolbarButton.vue";
</script>