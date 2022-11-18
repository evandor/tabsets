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

    <hr v-if="featuresStore.debugEnabled">
    <div class="text-h6" v-if="featuresStore.debugEnabled">Views</div>
    <div class="row" v-if="featuresStore.debugEnabled">
      <div class="col-3">
        Select the tabset view style
      </div>
      <div class="col-3">
        <q-radio v-model="view" val="grid" label="Default (Grid)"/>
        <q-radio :disable="!featuresStore.listviewEnabled" v-model="view" val="list" label="List View"/>
        <!--        <q-radio v-model="shape" val="line" label="Line" />-->
        <!--        <q-radio v-model="shape" val="rectangle" label="Rectangle" />-->
        <!--        <q-radio v-model="shape" val="ellipse" label="Ellipse" />-->
        <!--        <q-radio v-model="shape" val="polygon" label="Polygon" />-->
      </div>
    </div>

    <hr>
    <div class="text-h6">Ignored Urls</div>
    <div v-for="t in tabsStore.ignoredTabset?.tabs">
      {{ t.chromeTab.url }}
    </div>

    <hr v-if="featuresStore.debugEnabled">
    <div class="text-h6" v-if="featuresStore.debugEnabled">Index DB</div>
    <div class="row" v-if="featuresStore.debugEnabled">
      <div class="col-3">
        DB Name
      </div>
      <div class="col-3">
        {{ INDEX_DB_NAME }}
      </div>
    </div>

    <hr v-if="featuresStore.debugEnabled">
    <div class="text-h6" v-if="featuresStore.debugEnabled">Search Index</div>
    <div class="row" v-if="featuresStore.debugEnabled">
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

    <hr v-if="featuresStore.debugEnabled">
    <div class="text-h6" v-if="featuresStore.debugEnabled">Simulate new Version</div>
    <div class="row" v-if="featuresStore.debugEnabled">
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
import TabsetService from "src/services/TabsetService";
import Navigation from "src/services/Navigation";
import ExportDialog from "components/dialogues/ExportDialog.vue";
import ImportDialog from "components/dialogues/ImportDialog.vue";

const tabsStore = useTabsStore()
const featuresStore = useFeatureTogglesStore()
const searchStore = useSearchStore()

const router = useRouter()
const localStorage = useQuasar().localStorage
const $q = useQuasar()

const view = ref('grid')
const indexSize = ref(0)
const darkMode = ref<boolean>(localStorage.getItem('darkMode') || false)
const showBookmarks = ref<boolean>(localStorage.getItem('showBookmarks') || false)

watchEffect(() => {
  console.log("darkMode", darkMode.value, typeof darkMode.value)
  $q.dark.set(darkMode.value)
  localStorage.set('darkMode', darkMode.value)
})

watchEffect(() => {
  localStorage.set("layout", view.value)
})
watchEffect(() => {
  // @ts-ignore
  indexSize.value = searchStore.fuse.getIndex().size()
})

const downloadIndex = () => {
  const data = JSON.stringify(searchStore.fuse.getIndex())
  return TabsetService.createFile(data, "tabsetIndex.json");
}

const clearIndex = () => searchStore.init()

const simulateNewVersion = (version: string) => Navigation.updateAvailable({version: version})

const showExportDialog = () => {
  $q.dialog({component: ExportDialog})
}

const showImportDialog = () => {
  $q.dialog({component: ImportDialog})
}

</script>
