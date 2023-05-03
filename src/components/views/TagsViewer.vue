<template>
  <div class="q-ma-none q-pa-none" style="max-width:300px">
    <q-list>
      <q-item v-for="(tag,index) in tags.keys()"
              dense-toggle dense hide-expand-icon
              class="darken-on-hover"
              header-class="q-ma-none q-pa-none q-ml-md q-mb-xs">

        <q-item-section class="cursor-pointer q-ma-none q-pa-none"
                        @click="selectTag(tag)">
          <q-item-label>
            <template v-slot>

              <div class="row">
                <div class="col-10 ellipsis">
                  {{ tag }}
                </div>
              </div>
            </template>
          </q-item-label>

        </q-item-section>
        <q-item-section class="text-right q-mx-sm cursor-pointer"
                        style="max-width:25px;font-size: 12px;color:#bfbfbf">
          {{ tags.get(tag) }}
        </q-item-section>

      </q-item>

    </q-list>
  </div>

</template>

<script lang="ts" setup>

import {ref, watchEffect} from "vue";
import {Tabset} from "src/models/Tabset";
import {useRouter} from "vue-router";
import {useQuasar} from "quasar";
import {useTabsStore} from "src/stores/tabsStore";
import {useNotificationHandler} from "src/services/ErrorHandler";
import {useUtils} from "src/services/Utils";
import _ from "lodash"
import {Tab} from "src/models/Tab";
import {useUiStore} from "stores/uiStore";

const {handleError, handleSuccess} = useNotificationHandler()
const {inBexMode} = useUtils()

const router = useRouter()
const tabsStore = useTabsStore()

const tags = ref<Map<string, number>>(new Map())
const $q = useQuasar();
const localStorage = $q.localStorage

watchEffect(() => {
  console.log("calculating tags")
  tags.value = new Map()
  _.forEach([...tabsStore.tabsets.values()], (tabset: Tabset) => {
    _.forEach(tabset.tabs, (tab: Tab) => {
      _.forEach(tab.tags, (tag: string) => {
        const newCount = (tags.value.get(tag) || 0) + 1
        tags.value.set(tag, newCount)
      })
    })
  })
  tags.value = new Map([...tags.value.entries()].sort((a, b) => b[1] - a[1]));
})


const selectTag = (tag: string) => {
  console.log("selecting", tag)
  useUiStore().setSelectedTag(tag)
  router.push("/tags")
}


</script>
