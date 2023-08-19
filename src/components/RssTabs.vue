<template>

  <q-separator></q-separator>

  <div
    class="col-12 q-pa-xs items-center justify-center" style="width:100%; max-width: 300px;cursor: move"
    v-for="rssTab in rssTabs">

    <q-card class="my-card" flat @click="open(rssTab)">
      <q-card-section class="q-pt-xs cursor-pointer" style="width:100%;">
        <div class="row items-baseline">
          <div class="col-2">
            <TabFaviconWidget :tab="rssTab" width="20px" height="20px" />
          </div>
          <div class="col-9 text-body2 ellipsis">
            {{ rssTab.title }}
          </div>
          <div class="col-1">
            <q-icon name="close"/>
          </div>
        </div>

      </q-card-section>
    </q-card>
  </div>


</template>

<script setup lang="ts">

import {useTabsStore} from "src/stores/tabsStore"
import {ref, watchEffect} from "vue";
import {useRouter} from "vue-router";
import {Tab} from "src/models/Tab";
import TabFaviconWidget from "components/widgets/TabFaviconWidget.vue";

const tabsStore = useTabsStore()
const router = useRouter()

const rssTabs = ref<Tab[]>([])

watchEffect(() => rssTabs.value = tabsStore.rssTabs)


const open = (tab: Tab) => {
  if (tab.url) {
    router.push("/rss/" + btoa(tab.url))
  }
}


</script>
