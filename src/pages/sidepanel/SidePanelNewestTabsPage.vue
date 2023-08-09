<template>

  <q-page style="padding-top: 25px">

    <div class="q-mt-md q-ma-none q-pa-none">
      <InfoMessageWidget
        :probability="1"
        ident="sidePanelNewestTabsPage_overview"
        hint="Here you can check the 100 newest of your tabs sorted by creation date."/>
    </div>

    <div class="row q-ma-none q-pa-none">
      <div class="col-12 q-ma-none q-pa-none">

        <q-list separator class="q-ma-none">
          <q-item v-for="tab in newestTabs()"
                  clickable
                  v-ripple
                  class="q-ma-none q-pa-sm">

            <PanelTabListElementWidget
              :header="'created ' + formatDate(tab.created)"
              :tab="tab"/>

          </q-item>
        </q-list>

      </div>
    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" style="background-color:white">

      <FirstToolbarHelper title="Newest Tabs">

        <template v-slot:iconsRight>
          <q-btn
            icon="close"
            @click="useUiStore().sidePanelSetActiveView(SidePanelView.MAIN)"
            color="black"
            flat
            class="q-ma-none q-pa-xs cursor-pointer"
            style="max-width:20px"
            size="10px">
            <q-tooltip class="tooltip">Close this view</q-tooltip>
          </q-btn>
        </template>

      </FirstToolbarHelper>

    </q-page-sticky>

  </q-page>


</template>

<script lang="ts" setup>

import {SidePanelView, useUiStore} from "stores/uiStore";
import {useTabsStore} from "stores/tabsStore";
import _ from "lodash"
import {Tabset, TabsetType} from "src/models/Tabset";
import {Tab} from "src/models/Tab";
import PanelTabListElementWidget from "components/widgets/PanelTabListElementWidget.vue";
import {formatDistance} from "date-fns";
import PanelTabList from "components/layouts/PanelTabList.vue";
import SidePanelDynamicTabset from "components/layouts/sidepanel/SidePanelDynamicTabset.vue";
import SidePanelTabInfo from "pages/sidepanel/SidePanelTabInfo.vue";
import FirstToolbarHelper from "pages/sidepanel/helper/FirstToolbarHelper.vue";
import SecondToolbarHelper from "pages/sidepanel/helper/SecondToolbarHelper.vue";
import InfoMessageWidget from "components/widgets/InfoMessageWidget.vue";

const tabsStore = useTabsStore()

const newestTabs = () =>
  _.take(_.orderBy(
    _.flatMap([...tabsStore.tabsets.values()],
      (tabset: Tabset) =>
        _.flatMap(tabset.tabs)),
    (t: Tab) => t.created, "desc"), 100)

const formatDate = (timestamp: number | undefined) =>
  timestamp ? formatDistance(timestamp, new Date(), {addSuffix: true}) : ""

</script>
