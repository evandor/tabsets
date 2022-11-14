<template>

  <q-separator></q-separator>


  <div
    class="col-12 q-pa-xs items-center justify-center" style="width:100%; max-width: 300px;cursor: move"
    v-for="mhtml in mhtmls">

    <q-card class="my-card" flat @click="open(mhtml.id)">
      <q-card-section class="q-pt-xs cursor-pointer" style="width:100%;">
        <div class="row items-baseline">
          <div class="col-2">
            <q-img
              class="rounded-borders"
              width="20px"
              height="20px"
              :src="mhtml.favIconUrl">
            </q-img>
          </div>
          <div class="col-9 text-body2 ellipsis">
            {{ mhtml.title }}
          </div>
          <div class="col-1">
            <q-icon name="close" @click.stop="deleteMHtml(mhtml)"/>
          </div>
        </div>

      </q-card-section>
    </q-card>
  </div>


</template>

<script setup lang="ts">

import {useTabsStore} from "src/stores/tabsStore"
import {MHtml} from "src/models/MHtml";
import MHtmlService from "src/services/MHtmlService";
import {ref} from "vue";
import {useRouter} from "vue-router";

const tabsStore = useTabsStore()
const router = useRouter()

const mhtmls = ref<MHtml[]>([])


MHtmlService.getMHtmls()
  .then((res: MHtml[]) => {
    mhtmls.value = res
  })

const open = (url: string) => {
  router.push("/mhtml/" + url)
}

const deleteMHtml = () => {
  console.log("deleting...")
}

</script>
