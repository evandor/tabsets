<template>
  <q-page style="padding-top: 50px">
    <div class="q-mt-md q-ma-none q-pa-none">
      <InfoMessageWidget
        :probability="1"
        ident="sidePanelNewestTabsPage_overview"
        hint="Here you can check the 100 newest of your tabs sorted by creation date." />
    </div>

    <q-tabs v-model="tab" dense class="text-grey" active-color="primary" indicator-color="primary" narrow-indicator>
      <q-tab name="latest_by_access" label="Accessed" />
      <q-tab name="latest_by_creation" label="Created" />
    </q-tabs>

    <q-tab-panels v-model="tab" animated>
      <q-tab-panel name="latest_by_access">
        <template v-for="range in dateRanges">
          <div
            class="text-subtitle2"
            :class="filterDate(byAccess, range.start, range.end).length > 0 ? 'text-black' : 'text-grey'">
            {{ range.name }}
          </div>
          <q-list class="q-ma-none">
            <q-item
              v-for="tab in filterDate(byAccess, range.start, range.end)"
              clickable
              v-ripple
              class="q-ma-none q-pa-sm">
              <PanelTabListElementWidget :header="'opened: ' + formatDate(tab.lastActive)" :tab="tab" />
            </q-item>
          </q-list>
        </template>
      </q-tab-panel>

      <q-tab-panel name="latest_by_creation">
        <template v-for="range in dateRanges">
          <div
            class="text-subtitle2"
            :class="filterDate(byCreation, range.start, range.end).length > 0 ? 'text-black' : 'text-grey'">
            {{ range.name }}
          </div>
          <q-list class="q-ma-none">
            <q-item
              v-for="tab in filterDate(byCreation, range.start, range.end)"
              clickable
              v-ripple
              class="q-ma-none q-pa-sm">
              <PanelTabListElementWidget :header="'created: ' + formatDate(tab.created)" :tab="tab" />
            </q-item>
          </q-list>
        </template>
      </q-tab-panel>
    </q-tab-panels>

    <div class="row q-ma-none q-pa-none">
      <div class="col-12 q-ma-none q-pa-none"></div>
    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">
      <FirstToolbarHelper2 title="Latest Tabs">
        <template v-slot:iconsRight>
          <SidePanelToolbarTabNavigationHelper />
          <CloseSidePanelViewButton />
        </template>
      </FirstToolbarHelper2>
    </q-page-sticky>
  </q-page>
</template>

<script lang="ts" setup>
import { formatDistance } from 'date-fns'
import _ from 'lodash'
import FirstToolbarHelper2 from 'pages/sidepanel/helper/FirstToolbarHelper2.vue'
import Analytics from 'src/core/utils/google-analytics'
import SidePanelToolbarTabNavigationHelper from 'src/opentabs/pages/SidePanelToolbarTabNavigationHelper.vue'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import PanelTabListElementWidget from 'src/tabsets/widgets/PanelTabListElementWidget.vue'
import CloseSidePanelViewButton from 'src/ui/components/CloseSidePanelViewButton.vue'
import InfoMessageWidget from 'src/ui/widgets/InfoMessageWidget.vue'
import { onMounted, ref, watchEffect } from 'vue'

const tab = ref('latest_by_access')
const byAccess = ref<_.Dictionary<Tab[]> | undefined>(undefined)
const byCreation = ref<_.Dictionary<Tab[]> | undefined>(undefined)

const dateRanges = [
  { name: 'Today', start: 0, end: 0 },
  { name: 'Yesterday', start: -1, end: -1 },
  { name: 'Last Week', start: -7, end: -2 },
  { name: 'Last 30 days', start: -30, end: -8 },
]

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelNewestTabsPage', document.location.href)
})

watchEffect(() => {
  byAccess.value = _.groupBy(
    _.orderBy(
      _.flatMap([...useTabsetsStore().tabsets.values()] as Tabset[], (tabset: Tabset) => _.flatMap(tabset.tabs)),
      (t: Tab) => t.lastActive,
      'desc',
    ),
    (t: Tab) => {
      const date = new Date(t.lastActive || 0)
      return date.setHours(0, 0, 0, 0)
    },
  )
})

watchEffect(() => {
  byCreation.value = _.groupBy(
    _.orderBy(
      _.flatMap([...useTabsetsStore().tabsets.values()] as Tabset[], (tabset: Tabset) => _.flatMap(tabset.tabs)),
      (t: Tab) => t.created,
      'desc',
    ),
    (t: Tab) => {
      const date = new Date(t.created || 0)
      return date.setHours(0, 0, 0, 0)
    },
  )
})

const formatDate = (timestamp: number | undefined) =>
  timestamp ? formatDistance(timestamp, new Date(), { addSuffix: true }) : '?'

const filterDate = (base: _.Dictionary<Tab[]> | undefined, starting: number, ending: number): Tab[] => {
  if (!base) {
    return []
  }
  let res: Tab[] = []
  for (let i = starting; i <= ending; i++) {
    const day = new Date()
    day.setDate(new Date().getDate() + i)
    day.setHours(0, 0, 0, 0)
    const tabs = base[day.getTime()] as Tab[]
    if (tabs) {
      res = res.concat(tabs)
    }
  }
  return res
}
</script>
