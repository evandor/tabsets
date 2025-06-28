<template>
  <q-toolbar>
    <div class="row fit">
      <div class="col-xs-12 col-md-8 q-mt-xs">
        <q-toolbar-title> Overview (all Tabsets) </q-toolbar-title>
      </div>
      <div class="col-xs-12 col-md-4 text-right">
        <q-btn
          v-if="tabset?.tabs.length > 0"
          @click="setView('grid')"
          style="width: 14px"
          class="q-mr-sm"
          size="8px"
          :flat="tabset?.view !== 'grid'"
          :outline="tabset?.view === 'grid'"
          icon="grid_on">
          <q-tooltip class="tooltip">Use grid layout to visualize your tabs</q-tooltip>
        </q-btn>

        <!-- default view, no need to show if there is no alternative -->
        <q-btn
          v-if="tabset?.tabs.length > 0"
          @click="setView('list')"
          style="width: 14px"
          class="q-mr-sm"
          size="10px"
          :flat="tabset?.view !== 'list'"
          :outline="tabset?.view === 'list'"
          icon="o_list">
          <q-tooltip class="tooltip">Use the list layout to visualize your tabs</q-tooltip>
        </q-btn>
      </div>
    </div>
  </q-toolbar>

  <div class="row fit greyBorderTop"></div>

  <q-tabs
    v-model="tab"
    dense
    class="text-grey q-ma-none q-pa-none"
    active-color="primary"
    indicator-color="primary"
    align="left"
    narrow-indicator>
    <q-tab name="tabset" label="Tabs" />
  </q-tabs>

  <q-tab-panels v-model="tab" animated>
    <q-tab-panel class="q-ma-none q-pa-none" name="tabset">
      <template v-for="ts in allTabsets">
        <div v-if="_.filter(ts.tabs, (t: Tab) => t.favorite && t.favorite !== TabFavorite.NONE).length > 0">
          <div class="text-subtitle2 q-ma-md">{{ ts.name }}</div>
          <!--  @was-clicked="updateGrids()"-->
          <!--          <TabGrid2-->
          <!--            coordinates-identifier="grid-alltabsets"-->
          <!--            :tabset="ts as Tabset"-->
          <!--            :tabs="_.filter(ts.tabs, (t: Tab) => t.favorite && t.favorite !== TabFavorite.NONE)"/>-->
        </div>
      </template>
    </q-tab-panel>
  </q-tab-panels>
</template>

<script setup lang="ts">
import _ from 'lodash'
import { uid } from 'quasar'
import Analytics from 'src/core/utils/google-analytics'
import TabGrid2 from 'src/tabsets/layouts/TabGrid2.vue'
import { Tab, TabFavorite } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import TabsetService from 'src/tabsets/services/TabsetService'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { onMounted, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const tabsetId = ref(null as unknown as string)
const tabset = ref<Tabset>(new Tabset(uid(), 'empty', []))
const allTabsets = ref<Tabset[]>([])
const tab = ref('tabset')

onMounted(() => {
  Analytics.firePageViewEvent('MainPanelTabsetsOverviewPage', document.location.href)
})

watchEffect(() => {
  allTabsets.value = [...useTabsetsStore().tabsets.values()]
})

watchEffect(() => {
  if (!route || !route.params) {
    return
  }
  tabsetId.value = route?.params.tabsetId as string
  tabset.value = useTabsetsStore().getTabset(tabsetId.value) || new Tabset(uid(), 'empty', [])
  console.log('watch effect in tabsetpage', tabsetId.value)
  tab.value = route.query['tab'] ? (route.query['tab'] as string) : 'tabset'
})

const setView = (view: string) => TabsetService.setView(tabsetId.value, view)
</script>

<script setup lang="ts"></script>
