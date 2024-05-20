<template>
  <template v-if="useFeaturesStore().hasFeature(FeatureIdent.OPEN_TABS)">
    <SidePanelToolbarButton
        icon="chevron_left"
        tooltip="Back to last tab"
        :disable="useTabsStore2().chromeTabsHistoryPosition === 0"
        :color="useTabsStore2().chromeTabsHistoryPosition === 0 ? 'grey' : 'primary'"
        @click="NavigationService.backOneTab()"/>

    <SidePanelToolbarButton
        icon="chevron_right"
        tooltip="Return to tab before"
        :disable="useTabsStore2().chromeTabsHistoryPosition === useTabsStore2().chromeTabsHistory.length-1"
        :color="useTabsStore2().chromeTabsHistoryPosition === useTabsStore2().chromeTabsHistory.length-1 ? 'grey' : 'primary'"
        @click="NavigationService.forwardOneTab()"/>

    <span class="q-ma-none q-pa-none q-mx-sm text-grey-5">|</span>
  </template>
</template>
<script setup lang="ts">
import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/FeatureIdent";
import NavigationService from "src/services/NavigationService";
import SidePanelToolbarButton from "components/buttons/SidePanelToolbarButton.vue";
import {useFeaturesStore} from "src/features/stores/featuresStore";
import {useTabsStore2} from "src/tabsets/stores/tabsStore2";
</script>
