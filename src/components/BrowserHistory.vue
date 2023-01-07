<template>

  <q-expansion-item v-for="[host,val] in groupedHistory"
                    expand-separator
                    :label="host"
                    :caption="val.length">
    <q-card v-for="h in val">
      <q-card-section>
        {{h.url}}
      </q-card-section>
    </q-card>
  </q-expansion-item>

<!--  <div class="row" v-for="h in historyList">-->
<!--    <div class="col">-->
<!--      {{h.url}}<br>-->
<!--      {{formatDate(h.lastVisitTime)}}-->
<!--    </div>-->
<!--  </div>-->


</template>

<script setup lang="ts">

import {useTabsStore} from "src/stores/tabsStore"
import {ref, watchEffect} from "vue";
import {useRouter} from "vue-router";
import {Tab} from "src/models/Tab";
import {useUtils} from "src/services/Utils"
import _ from "lodash"

const tabsStore = useTabsStore()
const router = useRouter()
const {formatDate} = useUtils()

const historyList = ref<chrome.history.HistoryItem[]>([])
const groupedHistory = ref<Map<String, chrome.history.HistoryItem[]>>(new Map())
const done = ref(false)

//watchEffect(() => scheduledTabs.value = tabsStore.scheduledTabs)

const open = (tab: Tab) => {
  if (tab.chromeTab?.url) {
    router.push("/rss/" + btoa(tab.chromeTab?.url))
  }
}

chrome.history.search(
  {text: ''},
  (results: chrome.history.HistoryItem[]) => {
    console.log("history", results)
    historyList.value = results//_.map(results, (h:chrome.history.HistoryItem) => )

    const grouped = _.groupBy(results, (h: chrome.history.HistoryItem) => {
      return formatDate(h.lastVisitTime)
    })

    const sortedMap = new Map<string, chrome.history.HistoryItem[]>()
    for (let i in grouped) {
      sortedMap.set(i, grouped[i])
    }
    const map3 = new Map([...sortedMap.entries()].sort((a, b) => b[1].length - a[1].length))
    groupedHistory.value = new Map([...map3.entries()].filter((a) => a[1].length > 1))
  }
)

</script>
