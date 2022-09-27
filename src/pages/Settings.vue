<template>
  <q-page padding>

    <div class="text-h5 q-ma-md">
      Tabset Settings
    </div>

    <div class="text-h6">Ignored Urls</div>
    <div v-for="t in tabsStore.ignoredTabset?.tabs">
      {{ t.chromeTab.url }}
    </div>

    <div class="text-h6">Views</div>
    <div class="row">
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
    <div class="text-h6">Index DB</div>
    <div class="row">
      <div class="col-3">
        DB Name
      </div>
      <div class="col-3">
        {{ INDEX_DB_NAME }}
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

const tabsStore = useTabsStore()
const featuresStore = useFeatureTogglesStore()
const router = useRouter()
const localStorage = useQuasar().localStorage

const view = ref('grid')

watchEffect(() => {
  localStorage.set("layout", view.value)
})

if (!featuresStore.settingsEnabled) {
  router.push("/about")
}


</script>
