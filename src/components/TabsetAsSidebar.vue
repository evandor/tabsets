<template>

  <q-separator></q-separator>


  <div
    class="col-12 q-pa-xs items-center justify-center" style="width:100%; max-width: 300px;cursor: move"
    v-for="tab in tabs">

    <q-card class="my-card" flat @click="open(tab.id)">
      <q-card-section class="q-pt-xs cursor-pointer" style="width:100%;">
        <div class="row items-baseline">
          <div class="col-2">
            <q-img
              class="rounded-borders"
              width="20px"
              height="20px"
              :src="tab.chromeTab.favIconUrl">
            </q-img>
          </div>
          <div class="col-9 text-body2 ellipsis">
            {{ tab.chromeTab.title }}
          </div>
          <div class="col-1">

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

const tabsStore = useTabsStore()
const router = useRouter()

const tabs = ref<Tab[]>([])

watchEffect(()=> {
  tabs.value = tabsStore.getCurrentTabs
})


const open = (id: string) => {
  router.push("/iframe/" + id)
}


</script>
