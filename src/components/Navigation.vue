<template>


  <q-list class="q-mt-md">

    <q-item-label header>Tabsets</q-item-label>

    <div class="text-body2 q-pa-lg" v-if="tabsStore.tabsets.size === 0">
      Currently, you do not have any tabsets defined. Click on "new tabset" to get started.
    </div>

    <q-item clickable v-ripple v-for="tabset in tabsets()"
            @click="selectTabset(tabset.id)"
            @mouseover="showDeleteButton.set(tabset.id, true)"
            @mouseleave="showDeleteButton.set(tabset.id, false)"
            :style="tabset.id === tabsStore.currentTabsetId ? 'background-color:#efefef' : 'border:0px solid #bfbfbf'">
      <q-item-section>
        <q-item-label
          v-text="tabset.tabs?.length > 1 ? tabset.name + ' (' + tabset.tabs?.length + ' tabs)' : tabset.name + ' (' + tabset.tabs?.length + ' tab)'"/>
      </q-item-section>
      <q-item-section avatar v-if="showDeleteButton.get(tabset.id)">
        <q-icon name="delete_outline" color="negative" size="2em" @click="deleteDialog">
          <q-tooltip>Delete this tabset</q-tooltip>
        </q-icon>
      </q-item-section>
    </q-item>


  </q-list>

</template>

<script setup lang="ts">

import TabsetService from "src/services/TabsetService";
import {useRouter} from "vue-router";
import {useTabsStore} from "stores/tabsStore";
import _ from "lodash"
import {ref} from "vue";
import {useQuasar} from "quasar";

const router = useRouter()
const tabsStore = useTabsStore()
const newTabsetName = ref('new name')
const showDeleteButton = ref<Map<string,boolean>>(new Map())
const $q = useQuasar();

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
    .then((result: object) => {
      //@ts-ignore
      const replaced = result.replaced
      //@ts-ignore
      const merged = result.merged
      let message = 'Tabset ' + newName + ' created successfully'
      if (replaced && merged) {
        message = 'Tabset ' + newName + ' was updated'
      } else if (replaced) {
        message = 'Tabset ' + newName + ' was overwritten'
      }
      router.push("/tabset")
      $q.notify({
        message: message,
        type: 'positive'
      })
    }).catch((ex: any) => {
    console.error("ex", ex)
    $q.notify({
      message: 'There was a problem creating the tabset ' + newName,
      type: 'warning',
    })

  })
}

const deleteDialog = () => {
  $q.dialog({
    title: 'Deleting Tabset',
    message: 'Would you like to delete this tabset?',
    cancel: true,
    persistent: true
  }).onOk((data: any) => {
    TabsetService.delete(tabsStore.currentTabsetId)
    router.push("/browser")
  }).onCancel(() => {
  }).onDismiss(() => {
  })


}

</script>
