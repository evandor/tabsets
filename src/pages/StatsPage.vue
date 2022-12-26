<template>


  <q-toolbar class="text-primary lightgrey" v-if="tabsStore.tabsets.size > 0">
    <div class="row fit">
      <q-toolbar-title>
        <div class="row justify-start items-baseline">
          Tabsets Stats (experimental)
        </div>
      </q-toolbar-title>
    </div>
  </q-toolbar>

  <div class="justify-start items-start greyBorderTop">
    <q-tabs align="left" class="bg-grey-1"
            v-model="tab"
            no-caps>
      <q-tab name="tabs" label="Tabs"/>
      <!--      <q-tab name="ignored" label="Ignored Urls"/>-->

    </q-tabs>
  </div>

  <div v-if="tab === 'tabs'">
    <vue-apex-charts width="500" type="bar" :options="options" :series="series"></vue-apex-charts>
    <vue-apex-charts width="500" type="line" :options="options" :series="series2"></vue-apex-charts>

    {{ stats }}
    <hr>
    {{ tabsetsCount }}
    <hr>
    {{ series2 }}
  </div>

  <div v-if="tab === 'ignored'">

  </div>


</template>

<script setup lang="ts">
import {useTabsStore} from "src/stores/tabsStore"
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import {useRouter} from "vue-router";
import {ref} from "vue";
import {useQuasar} from "quasar";
import {useSearchStore} from "src/stores/searchStore";
import VueApexCharts from 'vue3-apexcharts'
import {useQueryExecutor} from "src/services/QueryExecutor";
import {LogsQuery} from "src/domain/queries/LogsQuery";
import {StatsQuery} from "src/domain/queries/StatsQuery";
import {useLoggingServicee} from "src/services/useLoggingService";
import {StatsEntry} from "src/models/StatsEntry";
import _ from "lodash"

const {logger} = useLoggingServicee()
const tabsStore = useTabsStore()
const featuresStore = useFeatureTogglesStore()
const searchStore = useSearchStore()

const router = useRouter()
const localStorage = useQuasar().localStorage
const $q = useQuasar()

const view = ref('grid')
const stats = ref<StatsEntry[]>([])
const tabsetsCount = ref<number[]>([])
const series2 = ref<any[]>([])

const options = {
  chart: {
    id: 'tabsets-count'
  },
  xaxis: {
    categories: [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998]
  }
}
const series = [{
  name: 'tabsets',
  data: tabsetsCount.value
}]

const tab = ref('tabs')

useQueryExecutor()
  .queryFromUi(new StatsQuery())
  .then(res => {
    const entries: StatsEntry[] = res.result // TODO sorted by date?
    series2.value.push({name: 'tabsets', data: _.map(entries, entry => entry.tabsets)})
    series2.value.push({name: 'openTabsCount', data: _.map(entries, entry => entry.openTabsCount)})
    stats.value = res.result
  })
  .catch((err) => logger.warning(err))


</script>

<style lang="sass" scoped>

.lightgrey
  background-color: $lightgrey

.greyBorderTop
  border-top: 1px solid $bordergrey

</style>
