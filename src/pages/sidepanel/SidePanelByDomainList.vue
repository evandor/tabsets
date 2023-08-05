<template>

  <q-page padding style="padding-top: 45px">

    <div class="q-ma-none">

      <InfoMessageWidget
        :probability="1"
        ident="groupByDomain_atLeastTwo"
        hint="In this view, you will see your tabs grouped by Domain, for all domains having at least two entries"/>


      <div class="q-ma-none">
        <div class="row q-ma-none q-pa-none">
          <div class="col-12 q-ma-none q-pa-none q-pt-lg">

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

      </div>

    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" style="background-color:white">
      <FirstToolbarHelper title="Domain List">

        <template v-slot:iconsRight>
          <q-btn
              icon="close"
              @click="useUiStore().sidePanelSetActiveView(SidePanelView.MAIN)"
              color="black"
              flat
              class="q-ma-none q-pa-xs cursor-pointer"
              style="max-width:20px"
              size="10px">
            <q-tooltip class="tooltip">Close this view</q-tooltip>
          </q-btn>
        </template>

      </FirstToolbarHelper>
    </q-page-sticky>

  </q-page>

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
import {SidePanelView, useUiStore} from "src/stores/uiStore";
import PanelTabListElementWidget from "components/widgets/PanelTabListElementWidget.vue";
import FirstToolbarHelper from "pages/sidepanel/helper/FirstToolbarHelper.vue";
import SecondToolbarHelper from "pages/sidepanel/helper/SecondToolbarHelper.vue";

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
      if (t.url) {
        try {
          const hostname = new URL(t.url).hostname
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
