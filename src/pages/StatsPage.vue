<template>


  <q-toolbar class="text-primary lightgrey" v-if="tabsStore.tabsets.size > 0">
    <div class="row fit">
      <q-toolbar-title>
        <div class="row justify-start items-baseline">
          Tabsets Stats
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

const tabsStore = useTabsStore()
const featuresStore = useFeatureTogglesStore()
const searchStore = useSearchStore()

const router = useRouter()
const localStorage = useQuasar().localStorage
const $q = useQuasar()

const view = ref('grid')

const options = {
  chart: {
    id: 'vuechart-example'
  },
  xaxis: {
    categories: [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998]
  }
}
const series = [{
  name: 'series-1',
  data: [30, 40, 45, 50, 49, 60, 70, 91]
}]

const tab = ref('tabs')


</script>

<style lang="sass" scoped>

.lightgrey
  background-color: $lightgrey

.greyBorderTop
  border-top: 1px solid $bordergrey

</style>
