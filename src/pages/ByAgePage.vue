<template>

  <!-- toolbar -->
  <q-toolbar class="text-primary lightgrey">
    <div class="row fit">
      <div class="col-xs-12 col-md-5">
        <q-toolbar-title>
          <div class="row justify-start items-baseline">
            <div class="col-1"><span class="text-dark">Age</span> <span
              class="text-primary">
              {{ age }}
            </span></div>
          </div>
        </q-toolbar-title>
      </div>
      <div class="col-xs-12 col-md-7 text-right">

      </div>
    </div>
  </q-toolbar>

  {{ groupedTabs}}
  <!-- rest: neither pinned, grouped, or pending -->
  <q-expansion-item
    icon="tabs"
    default-opened
    data-testid="expansion_item_unpinnedNoGroup"
    header-class="text-black"
    expand-icon-class="text-black"
    expand-separator>
    <template v-slot:header="{ expanded }">
      <q-item-section>
        <div>
          <span class="text-weight-bold">Tabs </span>
          <div class="text-caption ellipsis"></div>
        </div>
      </q-item-section>
    </template>

    <q-card>
      <q-card-section>

        <TabList :tabs="groupedTabs"/>

      </q-card-section>

    </q-card>
  </q-expansion-item>

  <q-card v-if="tabsStore.getCurrentTabset?.view === 'kanban'">
    <q-card-section>

      <TabColumns/>

    </q-card-section>
  </q-card>

  <q-card v-if="tabsStore.getCurrentTabset?.view === 'canvas'">
    <q-card-section>

      <TabsCanvas :key="'tabCanvas_' + tabsStore.currentTabsetId"/>

    </q-card-section>
  </q-card>

</template>

<script setup lang="ts">
import {ref, watchEffect} from 'vue'
import {useRoute, useRouter} from "vue-router";
import {useQuasar} from "quasar";
import TabColumns from "src/components/layouts/TabColumns.vue";
import TabsCanvas from "src/components/layouts/TabsCanvas.vue";
import _ from "lodash"
import {useTabsStore} from "src/stores/tabsStore";
import {useTabGroupsStore} from "src/stores/tabGroupsStore";
import {Tab} from "src/models/Tab";
import {Tabset, TabsetStatus} from "src/models/Tabset";
import TabList from "components/layouts/TabList.vue";
import {useSettingsStore} from "stores/settingsStore"

const route = useRoute();
const router = useRouter();
const localStorage = useQuasar().localStorage
const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()
const featuresStore = useSettingsStore()

const tabsetname = ref(tabsStore.currentTabsetName)
const filter = ref('')
const $q = useQuasar()

const highlightUrl = ref('')

const age = ref(null as unknown as string)

//age.value = atob(route.params.encodedAge as string)

watchEffect(() => {
  age.value = route.params.encodedAge as string
  if (age.value) {
    age.value = atob(age.value)
  }
})

const groupedTabs = ref<Tab[]>([])

watchEffect(() => {
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
  console.log("checkin tabs2....", allTabs)
  groupedTabs.value =
    _.filter(allTabs, (t: Tab) => {
      if (t.chromeTab.url) {
        try {
          const hostname = new URL(t.chromeTab.url).hostname
          console.log("comparing", hostname, age.value)
          const splits = hostname.split('.')
          switch (splits.length) {
            case 3:
              return hostname.substring(1 + hostname.indexOf(".")) === age.value
            default:
              return hostname === age.value
          }
        } catch (e) {
          return false
        }
      } else {
        return false
      }
    })


})


</script>

<style lang="sass" scoped>

.lightgrey
  background-color: $lightgrey

.greyBorderTop
  border-top: 1px solid $bordergrey

</style>
