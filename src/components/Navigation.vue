<template>
  <q-list style="max-width: 318px" class="q-mt-md">
    <q-expansion-item
      expand-separator
      icon="home"
      label="Browser"
      default-opened
    >
      <q-item clickable v-ripple>
        <q-item-section>
          <q-item clickable v-ripple @click="selectTabset('current')"
                  :style="'current' === tabsStore.currentTabsetId ? 'background-color:#efefef' : 'border:0px solid #bfbfbf'">
            <q-item-section>
              <q-item-label overline
                            v-text="tabsStore.tabs.length > 1 ? 'Open tabs (' + tabsStore.tabs.length + ' tabs)' : 'Open tabs (' + tabsStore.tabs.length + ' tab)'"/>
            </q-item-section>
          </q-item>
        </q-item-section>
      </q-item>

    </q-expansion-item>
  </q-list>

  <q-list style="max-width: 318px" class="q-mt-md">
    <q-expansion-item
      expand-separator
      icon="tabs"
      label="Tabsets"
      default-opened
    >

      <q-item clickable v-ripple v-for="tabset in tabsets()" @click="selectTabset(tabset.id)"
              :style="tabset.id === tabsStore.currentTabsetId ? 'background-color:#efefef' : 'border:0px solid #bfbfbf'">
        <q-item-section>
          <q-item-label overline :class="tabsStore.contextId === tabset.id ? 'text-blue-9' : ''"
                        v-text="tabset.tabs?.length > 1 ? tabset.name + ' (' + tabset.tabs?.length + ' tabs)' : tabset.name + ' (' + tabset.tabs?.length + ' tab)'"/>
        </q-item-section>
      </q-item>


    </q-expansion-item>
  </q-list>

</template>

<script setup lang="ts">

import TabsetService from "src/services/TabsetService";
import {useRouter} from "vue-router";
import {useTabsStore} from "stores/tabsStore";
import _ from "lodash"

const router = useRouter()
const tabsStore = useTabsStore()

const selectTabset = (tabsetId: string) => {
  if ('current' === tabsetId) {
    router.push("/browser")
    return
  }
  if ('pending' === tabsetId) {
    router.push("/pending")
    return
  }
  TabsetService.selectTabset(tabsetId)
  router.push("/tabset")
}

const tabsets = () => {
  return _.sortBy([...tabsStore.tabsets.values()], ['name'])
}

</script>
