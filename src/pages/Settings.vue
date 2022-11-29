<template>
  <q-page padding>

    <div class="text-h5 q-mb-lg">
      Tabset Settings
    </div>

    <div class="text-h6">Dark Mode</div>
    <div>
      <q-radio v-model="darkMode" :val="true" label="Enabled"/>
      <q-radio v-model="darkMode" :val="false" label="Disabled"/>
    </div>

    <hr>
    <div class="text-h6">Ignored Urls</div>
    <div v-for="t in tabsStore.ignoredTabset?.tabs">
      {{ t.chromeTab.url }}
    </div>

    <hr>
    <div class="row q-mb-md">
      <div class="col-3 text-h6">
        Warning Thresholds
      </div>
      <div class="col-3">
        warnings start when minimum open tabs count is reached<br>
        Reaching the maximum will turn the bar red.
      </div>
      <div class="col-3">
        <q-range
          v-model="settingsStore.thresholds"
          :step=5
          marker-labels
          :min=0
          :max=100
        />
      </div>
    </div>

    <hr v-if="featuresStore.isEnabled('debug')">
    <div class="text-h6" v-if="featuresStore.isEnabled('debug')">Index DB</div>
    <div class="row" v-if="featuresStore.isEnabled('debug')">
      <div class="col-3">
        DB Name
      </div>
      <div class="col-3">
        {{ INDEX_DB_NAME }}
      </div>
    </div>

    <hr v-if="featuresStore.isEnabled('debug')">
    <div class="text-h6" v-if="featuresStore.isEnabled('debug')">Search Index</div>
    <div class="row" v-if="featuresStore.isEnabled('debug')">
      <div class="col-3">
        Search Index
      </div>
      <div class="col-3">
        Current Size: {{ indexSize }} Entries
      </div>
      <div class="col-3">
        <span class="text-blue cursor-pointer" @click="downloadIndex">[Download]</span>&nbsp;
        <span class="text-blue cursor-pointer" @click="clearIndex">[clear Index]</span>&nbsp;
      </div>
    </div>

    <hr v-if="featuresStore.isEnabled('debug')">
    <div class="text-h6" v-if="featuresStore.isEnabled('debug')">Simulate new Version</div>
    <div class="row" v-if="featuresStore.isEnabled('debug')">
      <div class="col-3">
        Version 0.1.2
      </div>
      <div class="col-3">

      </div>
      <div class="col-3">
        <span class="text-blue cursor-pointer" @click="simulateNewVersion('0.1.2')">Simulate</span>&nbsp;

      </div>
    </div>


    <hr>
    <div class="text-h6">Export Tabset Data</div>
    <div class="row">
      <div class="col-3">

      </div>
      <div class="col-3">
        <q-btn
          @click="showExportDialog"
          flat round dense icon="file_download" color="primary">
          <q-tooltip>Export your tabsets</q-tooltip>
        </q-btn>
      </div>
      <div class="col-3">

      </div>
    </div>

    <hr>
    <div class="text-h6">Import Tabset Data</div>
    <div class="row">
      <div class="col-3">

      </div>
      <div class="col-3">
        <q-btn
          @click="showImportDialog"
          flat round dense icon="file_upload" color="primary">
          <q-tooltip>Import your tabsets backup</q-tooltip>
        </q-btn>
      </div>
      <div class="col-3">

      </div>
    </div>

    <hr>
    <div class="text-h6">Feature Toggles</div>
    <div class="row q-mb-lg">
      <div class="col-3">
        Switch on experimental features (or off)
      </div>
      <div class="col-3">

      </div>
      <div class="col-3">

      </div>
    </div>
    <div class="row q-mb-md">
      <div class="col-3">
        debug
      </div>
      <div class="col-3">
        add some information (mainly on tooltips) to help debugging
      </div>
      <div class="col-3">
        <q-toggle v-model="debugEnabled"/>
      </div>
    </div>

    <div class="row q-mb-md">
      <div class="col-3">
        spaces
      </div>
      <div class="col-3">
        spaces can be used to organize tabsets - a tabset can belong to zero, one or many spaces.
        You decide first which space you want to work with.
      </div>
      <div class="col-3">
        <q-toggle v-model="spacesEnabled"/>
      </div>
    </div>

    <div class="row q-mb-md">
      <div class="col-3">
        sidebar
      </div>
      <div class="col-3">
        the sidebar shows the current tabs on the left and let's you open the tabs in an inline view.
      </div>
      <div class="col-3">
        <q-toggle v-model="sidebarEnabled"/>
      </div>
    </div>

    <div class="row q-mb-md">
      <div class="col-3">
        experimental views
      </div>
      <div class="col-3">
        add the views 'kanban' (a column layout) and 'canvas' (a freestlye 2D layout) to the tabsets page.
      </div>
      <div class="col-3">
        <q-toggle v-model="experimentalViewsEnabled"/>
      </div>
    </div>
    <div class="row q-mb-md">
      <div class="col-3">
        searchIndexWidget
      </div>
      <div class="col-3">

      </div>
      <div class="col-3">
        <q-toggle v-model="searchIndexWidgetEnabled"/>
      </div>
    </div>
  </q-page>

</template>

<script setup lang="ts">
import {useTabsStore} from "src/stores/tabsStore"
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import {useRouter} from "vue-router";
import {ref, watchEffect} from "vue";
import {useQuasar} from "quasar";
import {INDEX_DB_NAME} from "boot/constants"
import {useSearchStore} from "src/stores/searchStore";
import {useSettingsStore} from "src/stores/settingsStore";
import TabsetService from "src/services/TabsetService";
import NavigationService from "src/services/NavigationService";
import ExportDialog from "components/dialogues/ExportDialog.vue";
import ImportDialog from "components/dialogues/ImportDialog.vue";

const tabsStore = useTabsStore()
const featuresStore = useFeatureTogglesStore()
const searchStore = useSearchStore()
const settingsStore = useSettingsStore()

const router = useRouter()
const localStorage = useQuasar().localStorage
const $q = useQuasar()

const view = ref('grid')
const indexSize = ref(0)
// const thresholds = ref(localStorage.getItem('thresholds') || {
//   min: 10,
//   max: 40
// })

const debugEnabled = ref<boolean>(featuresStore.isEnabled('debug'))
const spacesEnabled = ref<boolean>(featuresStore.isEnabled('spaces'))
const sidebarEnabled = ref<boolean>(featuresStore.isEnabled('sidebar'))
const experimentalViewsEnabled = ref<boolean>(featuresStore.isEnabled('experimentalViews'))
const searchIndexWidgetEnabled = ref<boolean>(featuresStore.isEnabled('searchIndexWidget'))

const darkMode = ref<boolean>(localStorage.getItem('darkMode') || false)
const showBookmarks = ref<boolean>(localStorage.getItem('showBookmarks') || false)

watchEffect(() => {
  console.log("darkMode", darkMode.value, typeof darkMode.value)
  $q.dark.set(darkMode.value)
  localStorage.set('darkMode', darkMode.value)
})

watchEffect(() => {
  featuresStore.setFeatureToggle("debug", debugEnabled.value)
  featuresStore.setFeatureToggle("spaces", spacesEnabled.value)
  featuresStore.setFeatureToggle("sidebar", sidebarEnabled.value)
  featuresStore.setFeatureToggle("experimentalViews", experimentalViewsEnabled.value)
  featuresStore.setFeatureToggle("searchIndexWidget", searchIndexWidgetEnabled.value)
})

watchEffect(() => {
  localStorage.set("layout", view.value)
})

watchEffect(() => {
  //settingsStore.setThresholds(thresholds.value)
})

watchEffect(() => {
  // @ts-ignore
  indexSize.value = searchStore.getIndex().size()
})

const downloadIndex = () => {
  const data = JSON.stringify(searchStore.getIndex())
  return TabsetService.createFile(data, "tabsetIndex.json");
}

const clearIndex = () => searchStore.init()

const simulateNewVersion = (version: string) => NavigationService.updateAvailable({version: version})

const showExportDialog = () => $q.dialog({component: ExportDialog})
const showImportDialog = () => $q.dialog({component: ImportDialog})


</script>
