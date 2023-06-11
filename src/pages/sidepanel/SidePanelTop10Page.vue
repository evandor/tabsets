<template>
  <q-page>
    <q-toolbar class="text-primary lightgrey">
      <div class="row fit">
        <q-toolbar-title>
          <div class="row">
            <div class="col-1">
              <q-icon name="chevron_left" class="cursor-pointer"
                      @click="useUiStore().sidePanelSetActiveView(SidePanelView.MAIN)">
                <q-tooltip>Back</q-tooltip>
              </q-icon>
            </div>
            <div class="col">
              Top 10 Most Accessed Tabs
            </div>
          </div>
        </q-toolbar-title>
      </div>
    </q-toolbar>

    <div class="row q-ma-none q-pa-none">
      <div class="col-12 q-ma-none q-pa-none q-pt-lg">

        <!--<PanelTabList :tabs="top10Tabs()" />-->

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
  </q-page>
</template>

<script lang="ts" setup>

import {SidePanelView, useUiStore} from "stores/uiStore";
import {useTabsStore} from "stores/tabsStore";
import _ from "lodash"
import {Tabset} from "src/models/Tabset";
import {Tab} from "src/models/Tab";
import PanelTabListElementWidget from "components/widgets/PanelTabListElementWidget.vue";

const tabsStore = useTabsStore()

const top10Tabs = () =>
  _.orderBy(
    _.flatMap([...tabsStore.tabsets.values()],
      (tabset: Tabset) =>
        _.flatMap(tabset.tabs)),
    (t: Tab) => t.activatedCount, "desc")


</script>
