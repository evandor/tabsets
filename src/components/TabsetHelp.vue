<template>

  <q-separator></q-separator>




    <q-card class="my-card" flat @click="open('howto')">
      <q-card-section class="q-pt-xs cursor-pointer" style="width:100%;">
        <div class="row items-baseline">
          <div class="col-2">
            <q-img
              class="rounded-borders"
              width="20px"
              height="20px"
              src="https://tabsets.web.app/icons/favicon-96x96.png">
            </q-img>
          </div>
          <div class="col-9 text-body2 ellipsis">
            How to...
          </div>
          <div class="col-1">

          </div>
        </div>

      </q-card-section>
    </q-card>



</template>

<script setup lang="ts">

import {useTabsStore} from "src/stores/tabsStore"
import {ref, watchEffect} from "vue";
import {useRouter} from "vue-router";
import {Tab} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";

const tabsStore = useTabsStore()
const router = useRouter()

const tabs = ref<Tab[]>([])

watchEffect(()=> {
  tabs.value = tabsStore.getCurrentTabs
})


const open = (ident: string) => {
  router.push("/help/" + ident)
}


</script>
