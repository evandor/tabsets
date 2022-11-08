<template>
  <q-page padding>

    <div class="text-h5 q-ma-md">
      Tabset Settings
    </div>

    <div class="text-h6">Dark Mode</div>
    <div>
      <q-radio v-model="darkMode" :val="true" label="Enabled"/>
      <q-radio v-model="darkMode" :val="false" label="Disabled"/>
    </div>

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

    <div class="text-h6">Ignored Urls</div>
    <div v-for="t in tabsStore.ignoredTabset?.tabs">
      {{ t.chromeTab.url }}
    </div>

    <div class="text-h6" v-if="featuresStore.debugEnabled">Index DB</div>
    <div class="row" v-if="featuresStore.debugEnabled">
      <div class="col-3">
        DB Name
      </div>
      <div class="col-3">
        {{ INDEX_DB_NAME }}
      </div>
    </div>

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

const clearIndex = () => {
  searchStore.init()
}

</script>
