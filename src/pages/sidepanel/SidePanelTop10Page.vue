<template>

  <q-page style="padding-top: 50px">

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

        <q-list class="q-ma-none">
          <q-item v-for="tabAndTabsetId in top10"
                  clickable
                  v-ripple
                  class="q-ma-none q-pa-sm">

            <PanelTabListElementWidget
              :header="'accessed ' + (tabAndTabsetId.tab.activatedCount !== 1) ?   tabAndTabsetId.tab.activatedCount + ' times' : tabAndTabsetId.tab.activatedCount + ' time'"
              :tab="tabAndTabsetId.tab"
              :tabsetId="tabAndTabsetId.tabsetId"
            />

          </q-item>
        </q-list>

      </div>
    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">

      <FirstToolbarHelper title="'Top 10' Tabs">

        <template v-slot:iconsRight>
          <SidePanelToolbarTabNavigationHelper/>
          <CloseSidePanelViewButton/>
        </template>

      </FirstToolbarHelper>

    </q-page-sticky>

  </q-page>

</template>

<script lang="ts" setup>

import _ from "lodash"
import {Tabset} from "src/tabsets/models/Tabset";
import {Tab} from "src/tabsets/models/Tab";
import PanelTabListElementWidget from "src/tabsets/widgets/PanelTabListElementWidget.vue";
import FirstToolbarHelper from "pages/sidepanel/helper/FirstToolbarHelper.vue";
import InfoMessageWidget from "src/ui/widgets/InfoMessageWidget.vue";
import {onMounted, ref, watchEffect} from "vue";
import Analytics from "src/core/utils/google-analytics";
import SidePanelToolbarTabNavigationHelper from "src/opentabs/pages/SidePanelToolbarTabNavigationHelper.vue";
import CloseSidePanelViewButton from "src/ui/components/CloseSidePanelViewButton.vue";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {TabAndTabsetId} from "src/tabsets/models/TabAndTabsetId";

const top10 = ref<TabAndTabsetId[]>([])
const loading = ref(true)

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelTop10Page', document.location.href);
})

// https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
// https://medium.com/@adamorlowskipoland/outside-main-thread-heavy-task-calculations-in-vue-25a600350db9
//const bgCalc = new Worker("../background-calc-worker.js", { type: "module" });
//console.log("bgCalc", bgCalc)

watchEffect(() => {
  loading.value = true
  setTimeout(() => {
    const r: TabAndTabsetId[] = _.flatMap([...useTabsetsStore().tabsets.values()] as Tabset[], (tabset: Tabset) => {
      return _.map(
        _.filter(tabset.tabs, (t: Tab) => t.url !== undefined && t.url.trim() !== ''),
        (t: Tab) => new TabAndTabsetId(t, tabset.id))
    })
    top10.value = _.take(_.orderBy(r, (t: TabAndTabsetId) => t.tab.activatedCount || 0, "desc"), 25)
    loading.value = false
  }, 500)
})

</script>
