<template>
  <q-list  class="q-mt-md">
    <q-expansion-item
      expand-separator
      icon="window"
      header-class="text-primary"
      label="Browser"
      default-opened
    >
      <q-item clickable v-ripple @click="selectTabset('current')"
              :style="'current' === tabsStore.currentTabsetId ? 'background-color:#efefef' : 'border:0px solid #bfbfbf'">
        <q-item-section>
          <q-item-label overline
                        v-text="tabsStore.tabs.length > 1 ? 'Open tabs (' + tabsStore.tabs.length + ' tabs)' : 'Open tabs (' + tabsStore.tabs.length + ' tab)'"/>
        </q-item-section>
      </q-item>

    </q-expansion-item>
  </q-list>

  <q-list  class="q-mt-md">
    <q-expansion-item
      expand-separator
      icon="tabs"
      label="Tabsets"
      header-class="text-primary"
      default-opened
    >

      <q-item clickable v-ripple v-for="tabset in tabsets()" @click="selectTabset(tabset.id)"
              :style="tabset.id === tabsStore.currentTabsetId ? 'background-color:#efefef' : 'border:0px solid #bfbfbf'">
        <q-item-section>
          <q-item-label overline :class="tabsStore.contextId === tabset.id ? 'text-blue-9' : ''"
                        v-text="tabset.tabs?.length > 1 ? tabset.name + ' (' + tabset.tabs?.length + ' tabs)' : tabset.name + ' (' + tabset.tabs?.length + ' tab)'"/>
        </q-item-section>
      </q-item>

      <q-separator/>

      <q-item clickable v-ripple>
        <q-item-section avatar>
          <q-icon color="primary" name="add"/>
        </q-item-section>

        <q-item-section>
          <q-item-label overline v-text="'new tabset'"/>
          <q-popup-edit :model-value="newTabsetName" v-slot="scope" buttons
                        @update:model-value="val => createNewTabset( val)">
            <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set"/>
          </q-popup-edit>
        </q-item-section>
      </q-item>

    <q-separator />

    </q-expansion-item>
  </q-list>

</template>

<script setup lang="ts">

import TabsetService from "src/services/TabsetService";
import {useRouter} from "vue-router";
import {useTabsStore} from "stores/tabsStore";
import _ from "lodash"
import {ref} from "vue";

const router = useRouter()
const tabsStore = useTabsStore()
const newTabsetName = ref('new name')

const selectTabset = (tabsetId: string) => {
  TabsetService.selectTabset(tabsetId)
  if ('current' === tabsetId) {
    router.push("/browser")
    return
  }
  if ('pending' === tabsetId) {
    router.push("/pending")
    return
  }
  router.push("/tabset")
}

const tabsets = () => {
  return _.sortBy([...tabsStore.tabsets.values()], ['name'])
}

const createNewTabset = (newName: string) => {
  TabsetService.saveOrReplace(newName, [], true)
}

</script>
