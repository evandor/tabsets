<template>
  <q-page padding>

    <div class="row items-start">
      <div class="col-xs-12 col-sm-4 col-md-3 col-lg-2 q-ma-xs" v-for="tab in tabset.tabs">
        <q-card class="my-card" flat bordered style="height: 200px;max-height:200px; min-height: 200px;">
          <q-card-section horizontal>
            <q-card-section class="q-pt-xs">
              <div>
                <q-img
                  class="rounded-borders"
                  width="20px"
                  height="20px"
                  :src="tab.favIconUrl"
                />
              </div>
              <div class="text-overline">{{ getHost(tab.url) }}</div>
              <div class="text-h6 q-mt-sm q-mb-xs">{{ maxChar(20, tab.title) }}</div>
              <div class="text-caption text-grey wrap" style="overflow:hidden;">
                {{ maxChar(30, tab.url) }}
              </div>
            </q-card-section>

          </q-card-section>

          <q-separator/>

          <q-card-actions style="min-height:50px;max-height:50px">
            <q-btn flat round icon="event"/>
            <!--<q-btn flat>
              7:30PM
            </q-btn>
            <q-btn flat color="primary">
              Reserve
            </q-btn>-->
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import {defineComponent, onMounted, onUpdated, ref} from 'vue'
import {useRoute} from "vue-router";
import {TabsetApi} from "src/services/TabsetApi";
import {useQuasar} from "quasar";
import {Tabset} from "src/models/Tabset";

const route = useRoute();
const localStorage = useQuasar().localStorage
const tabsetApi = new TabsetApi(localStorage);

const tabsetId = ref('')
const tabset = ref<Tabset>(null as unknown as Tabset)

function init() {
  tabsetId.value = route.params.tabsetId as string
  tabset.value = tabsetApi.getTabset(tabsetId.value) || new Tabset("", "", [])
}

init()

onUpdated(() => {
  init()
})

function getHost(urlAsString: string): string {
  const url = new URL(urlAsString)
  return url.host
}

function maxChar(max: number, t: string): string {
  if (t.length > max - 3) {
    return t.substring(0, max-3) + "..."
  }
  return t;
}

// onMounted(() => {
//   console.log("mounting Tabset")
//   tabsetId = route.params.tabsetId || undefined
// })

</script>
