<template>

  <q-page style="padding-top: 25px">

    <div class="q-mt-md q-ma-none q-pa-none">
      <InfoMessageWidget
        :probability="1"
        ident="sidePanelTop10Page_overview">
        This is the <b>top 10 list</b> of your most often accessed tabs
      </InfoMessageWidget>
    </div>

    <div class="row q-ma-lg fit items-center justify-center" v-if="loading">
      <q-spinner-dots
        color="primary"
        size="2em"
      />
    </div>

    <div v-if="!loading" class="row q-ma-none q-pa-none">
      <div class="col-12 q-ma-none q-pa-none">

        <q-list separator class="q-ma-none">
          <q-item v-for="tab in top10"
                  clickable
                  v-ripple
                  class="q-ma-none q-pa-sm">

            <PanelTabListElementWidget
              :header="'accessed ' + (tab.activatedCount !== 1) ?   tab.activatedCount + ' times' : tab.activatedCount + ' time'"
              :tab="tab"/>

          </q-item>
        </q-list>

      </div>
    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" style="background-color:white">

      <FirstToolbarHelper title="'Top 10' Tabs">

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
import {Tabset} from "src/models/Tabset";
import {Tab} from "src/models/Tab";
import PanelTabListElementWidget from "components/widgets/PanelTabListElementWidget.vue";
import FirstToolbarHelper from "pages/sidepanel/helper/FirstToolbarHelper.vue";
import SecondToolbarHelper from "pages/sidepanel/helper/SecondToolbarHelper.vue";
import InfoMessageWidget from "components/widgets/InfoMessageWidget.vue";
import {ref, watchEffect} from "vue";

const tabsStore = useTabsStore()

const top10 = ref<Tab[]>([])
const loading = ref(true)

// https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
// https://medium.com/@adamorlowskipoland/outside-main-thread-heavy-task-calculations-in-vue-25a600350db9
//const bgCalc = new Worker("../background-calc-worker.js", { type: "module" });
//console.log("bgCalc", bgCalc)

watchEffect(() => {
  loading.value = true
  setTimeout(() => {
    top10.value = _.orderBy(
      _.flatMap([...tabsStore.tabsets.values()],
        (tabset: Tabset) =>
          _.flatMap(tabset.tabs)),
      (t: Tab) => t.activatedCount, "desc")
    loading.value = false
  }, 500)
})

</script>
