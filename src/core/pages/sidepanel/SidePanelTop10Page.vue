<template>
  <q-page style="padding-top: 50px">
    <div class="q-mt-md q-ma-none q-pa-none">
      <InfoMessageWidget :probability="1" ident="sidePanelTop10Page_overview">
        This is the <b>top 10 list</b> of your most often accessed tabs as well of a list of tabs sorted by reading
        time.
      </InfoMessageWidget>
    </div>

    <q-tabs v-model="tab" dense class="text-grey" active-color="primary" indicator-color="primary" narrow-indicator>
      <q-tab name="by_count" label="Count" />
      <q-tab name="by_reading_time" label="Reading Time" />
    </q-tabs>

    <div class="row q-ma-lg fit items-center justify-center" v-if="loading">
      <q-spinner-dots color="primary" size="2em" />
    </div>

    <q-tab-panels v-model="tab" animated>
      <q-tab-panel name="by_count">
        <div v-if="!loading" class="row q-ma-none q-pa-none">
          <div class="col-12 q-ma-none q-pa-none">
            <q-list class="q-ma-none">
              <q-item v-for="tabAndTabsetId in top10" clickable v-ripple class="q-ma-none q-pa-sm">
                <PanelTabListElementWidget
                  :header="
                    'accessed ' + (tabAndTabsetId.tab.activatedCount !== 1)
                      ? tabAndTabsetId.tab.activatedCount + ' times'
                      : tabAndTabsetId.tab.activatedCount + ' time'
                  "
                  :tab="tabAndTabsetId.tab"
                  :detail-level="'MINIMAL'">
                  <template v-slot:actionPart>
                    <q-item-section
                      class="q-ma-none q-pa-none text-right"
                      style="justify-content: start; width: 30px; max-width: 30px">
                      <q-icon
                        name="sym_o_cancel_presentation"
                        size="xs"
                        color="grey-7"
                        class="cursor-pointer"
                        @click="
                          clearCounter(tabAndTabsetId, (t: Tab) => {
                            t.activatedCount = 0
                          })
                        ">
                        <q-tooltip class="tooltip-small">Clear Counter</q-tooltip>
                      </q-icon>
                    </q-item-section>
                  </template>
                </PanelTabListElementWidget>
              </q-item>
            </q-list>
          </div>
        </div>
      </q-tab-panel>
      <q-tab-panel name="by_reading_time">
        <div v-if="!loading" class="row q-ma-none q-pa-none">
          <div class="col-12 q-ma-none q-pa-none">
            <q-list class="q-ma-none">
              <q-item v-for="tabAndTabsetId in top10ReadingTime" clickable v-ripple class="q-ma-none q-pa-sm">
                <PanelTabListElementWidget
                  :header="formatReadingTime(tabAndTabsetId.tab.readingTime)"
                  :tab="tabAndTabsetId.tab"
                  :detail-level="'MINIMAL'">
                  <template v-slot:actionPart>
                    <q-item-section
                      class="q-ma-none q-pa-none text-right"
                      style="justify-content: start; width: 30px; max-width: 30px">
                      <q-icon
                        name="sym_o_cancel_presentation"
                        size="xs"
                        color="grey-7"
                        class="cursor-pointer"
                        @click="
                          clearCounter(tabAndTabsetId, (t: Tab) => {
                            t.readingTime = 0
                          })
                        ">
                        <q-tooltip class="tooltip-small">Clear Counter</q-tooltip>
                      </q-icon>
                    </q-item-section>
                  </template>
                </PanelTabListElementWidget>
              </q-item>
            </q-list>
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">
      <ViewToolbarHelper title="'Top 10' Tabs" />
    </q-page-sticky>
  </q-page>
</template>

<script lang="ts" setup>
import _ from 'lodash'
import ViewToolbarHelper from 'src/core/pages/sidepanel/helper/ViewToolbarHelper.vue'
import { useUtils } from 'src/core/services/Utils'
import Analytics from 'src/core/utils/google-analytics'
import { Tab } from 'src/tabsets/models/Tab'
import { TabAndTabsetId } from 'src/tabsets/models/TabAndTabsetId'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import PanelTabListElementWidget from 'src/tabsets/widgets/PanelTabListElementWidget.vue'
import InfoMessageWidget from 'src/ui/widgets/InfoMessageWidget.vue'
import { onMounted, ref } from 'vue'

const { formatReadingTime } = useUtils()

const top10 = ref<TabAndTabsetId[]>([])
const top10ReadingTime = ref<TabAndTabsetId[]>([])
const loading = ref(true)
const tab = ref('by_count')

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelTop10Page', document.location.href)
})

// https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
// https://medium.com/@adamorlowskipoland/outside-main-thread-heavy-task-calculations-in-vue-25a600350db9
//const bgCalc = new Worker("../background-calc-worker.js", { type: "module" });
//console.log("bgCalc", bgCalc)

setTimeout(() => {
  calcData()
}, 500)

const calcData = () => {
  loading.value = true
  const r: TabAndTabsetId[] = _.flatMap([...useTabsetsStore().tabsets.values()] as Tabset[], (tabset: Tabset) => {
    return _.map(
      _.filter(tabset.tabs, (t: Tab) => t.url !== undefined && t.url.trim() !== ''),
      (t: Tab) => new TabAndTabsetId(t, tabset.id),
    )
  })
  top10.value = _.take(
    _.orderBy(r, (t: TabAndTabsetId) => t.tab.activatedCount || 0, 'desc'),
    25,
  )
  top10ReadingTime.value = _.filter(
    _.take(
      _.orderBy(r, (t: TabAndTabsetId) => t.tab.readingTime || 0, 'desc'),
      25,
    ),
    (t: TabAndTabsetId) => t.tab.readingTime !== undefined,
  )
  loading.value = false
}

const clearCounter = (tabAndTabsetId: TabAndTabsetId, clearFkt: (tab: Tab) => void) => {
  const ts = useTabsetsStore().getTabset(tabAndTabsetId.tabsetId)
  if (ts) {
    // tabAndTabsetId.tab.activatedCount = 0
    clearFkt(tabAndTabsetId.tab)
    useTabsetsStore().saveTabset(ts)
    calcData()
  }
}
</script>
