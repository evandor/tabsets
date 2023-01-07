<template>
  <q-expansion-item v-for="[host,val] in groupedTabs"
                    @click="showByDomainPage(host)"
                    expand-separator
                    :label="host"
                    :caption="captionFor(val)">
    <q-card v-for="tab in val">
      <q-card-section>
        <OpenTabCard :tab="tab"/>
      </q-card-section>
    </q-card>
  </q-expansion-item>
</template>

<script lang="ts" setup>

import {useTabsStore} from "stores/tabsStore";
import _ from "lodash"
import {ref, watchEffect} from "vue";
import {Tab} from "src/models/Tab";
import {Tabset, TabsetStatus} from "src/models/Tabset";
import OpenTabCard from "components/layouts/OpenTabCard.vue";
import {useRouter} from "vue-router";

const tabsStore = useTabsStore()
const router = useRouter()

const groupedTabs = ref<Map<String, Tab[]>>(new Map())

watchEffect(() => {
  console.log("checkin tabs....")
  const allTabs: Tab[] =
    _.orderBy(
      _.filter(
        _.flatMap(
          _.filter(
            _.map([...tabsStore.tabsets.values()],
              (ts: Tabset) => ts),
            (ts: Tabset) => ts.status === TabsetStatus.DEFAULT || ts.status === TabsetStatus.FAVORITE),
          (ts: Tabset) => ts.tabs), (t: Tab) => true),
      (t: Tab) => t.activatedCount, ['desc'])
  const r =
    //_.orderBy(

    _.groupBy(allTabs, (t: Tab) => {
      if (t.chromeTab.url) {
        try {
          const hostname = new URL(t.chromeTab.url).hostname
          const splits = hostname.split('.')
          switch (splits.length) {
            case 3:
              return hostname.substring(1 + hostname.indexOf("."))
            default:
              return hostname
          }
        } catch (e) {
          return 'bad url'
        }
      } else {
        return 'unknown url'
      }
    })

  const sortedMap = new Map<string, Tab[]>()
  for (let i in r) {
    sortedMap.set(i, r[i])
  }
  const map3 = new Map([...sortedMap.entries()].sort((a, b) => b[1].length - a[1].length))
  groupedTabs.value = new Map([...map3.entries()].filter((a) => a[1].length > 1))

})

const captionFor = (t: any[]) =>  t.length + " tab(s)"

const showByDomainPage = (host: string) => router.push("/bydomain/" + btoa(host))

</script>
