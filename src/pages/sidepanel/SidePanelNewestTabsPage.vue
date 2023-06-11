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
              Newest Tabs
            </div>
          </div>
        </q-toolbar-title>
      </div>
    </q-toolbar>

    <div class="row q-ma-none q-pa-none">
      <div class="col-12 q-ma-none q-pa-none q-pt-lg">

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
  </q-page>
</template>

<script lang="ts" setup>

import {SidePanelView, useUiStore} from "stores/uiStore";
import {useTabsStore} from "stores/tabsStore";
import _ from "lodash"
import {Tabset} from "src/models/Tabset";
import {Tab} from "src/models/Tab";
import PanelTabListElementWidget from "components/widgets/PanelTabListElementWidget.vue";
import {formatDistance} from "date-fns";

const tabsStore = useTabsStore()

const newestTabs = () =>
  _.orderBy(
    _.flatMap([...tabsStore.tabsets.values()],
      (tabset: Tabset) =>
        _.flatMap(tabset.tabs)),
    (t: Tab) => t.created, "desc")

const formatDate = (timestamp: number | undefined) =>
  timestamp ? formatDistance(timestamp, new Date(), {addSuffix: true}) : ""

</script>
