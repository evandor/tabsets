<template>

  <div class="q-ma-none">

    <q-toolbar class="text-primary lightgrey">
      <div class="row fit">
        <q-toolbar-title>
          <div class="row">
            <div class="col-2">
              <q-icon name="chevron_left" class="cursor-pointer" @click="useUiStore().sidePanelSetActiveView(SidePanelView.MAIN)">
                <q-tooltip>Back</q-tooltip>
              </q-icon>
            </div>
            <div class="col-10">
              <div class="col-1"><span class="text-dark">Domain</span> <span
                class="text-primary">
              Domain List
            </span></div>
            </div>
            <div class="col-1 text-right">
            </div>
          </div>
        </q-toolbar-title>
      </div>
    </q-toolbar>

    <InfoMessageWidget
      :probability="1"
      ident="groupByDomain_atLeastTwo"
      hint="In this view, you will see your tabs grouped by Domain, for all domains having at least two entries"/>

    <div class="q-pa-none">
      <q-list>
        <q-item clickable v-ripple v-for="[host,val] in groupedTabs"
                @click="showByDomainPage(host)">
          <q-item-section>
            <q-item-label overline>{{ host }}</q-item-label>
            <q-item-label caption>{{ captionFor(val) }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </div>
</template>

<script lang="ts" setup>

import {useTabsStore} from "src/stores/tabsStore";
import _ from "lodash"
import {ref, watchEffect} from "vue";
import {Tab} from "src/models/Tab";
import {Tabset, TabsetStatus} from "src/models/Tabset";
import OpenTabCard from "components/layouts/OpenTabCard.vue";
import {useRouter} from "vue-router";
import InfoMessageWidget from "components/widgets/InfoMessageWidget.vue";
import {SidePanelView, useUiStore} from "stores/uiStore";

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

const captionFor = (t: any[]) => t.length + " tab(s)"

const showByDomainPage = (host: string) => {
  console.log("clicked", host)
  router.push("/sidepanel/bydomain/" + btoa(host))
}

</script>
