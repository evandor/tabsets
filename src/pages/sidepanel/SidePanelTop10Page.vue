<template>

  <q-page padding style="padding-top: 45px">

    <div class="q-ma-none">

      <div class="q-ma-none">
        <div class="row q-ma-none q-pa-none">
          <div class="col-12 q-ma-none q-pa-none q-pt-lg">

            <q-list separator class="q-ma-none">

              <q-item v-for="tab in top10Tabs()"
                      clickable
                      v-ripple
                      class="q-ma-none q-pa-sm">

                <PanelTabListElementWidget
                  :header="'accessed ' + tab.activatedCount !== 1 ?   tab.activatedCount + ' times' : tab.activatedCount + ' time'"
                  :tab="tab"/>

              </q-item>
            </q-list>

          </div>
        </div>

      </div>

    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" style="background-color:white">
      <FirstToolbarHelper title="'Top 10' Tabs" :show-back-button="true"/>
    </q-page-sticky>

  </q-page>

</template>

<script lang="ts" setup>

import {SidePanelView, useUiStore} from "stores/uiStore";
import {useTabsStore} from "stores/tabsStore";
import _ from "lodash"
import {Tabset} from "src/models/Tabset";
import {Tab} from "src/models/Tab";
import PanelTabListElementWidget from "components/widgets/PanelTabListElementWidget.vue";
import FirstToolbarHelper from "pages/sidepanel/helper/FirstToolbarHelper.vue";
import SecondToolbarHelper from "pages/sidepanel/helper/SecondToolbarHelper.vue";

const tabsStore = useTabsStore()

const top10Tabs = () =>
  _.orderBy(
    _.flatMap([...tabsStore.tabsets.values()],
      (tabset: Tabset) =>
        _.flatMap(tabset.tabs)),
    (t: Tab) => t.activatedCount, "desc")


</script>
