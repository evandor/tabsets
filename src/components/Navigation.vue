<template>


  <q-list class="q-mt-md">

    <q-item-label header>Tabsets</q-item-label>

    <div class="text-body2 q-pa-lg" v-if="tabsStore.tabsets.size === 0">
      Currently, you do not have any tabsets defined. Click on "new tabset" to get started.
    </div>

    <q-item clickable v-ripple v-for="tabset in tabsets()"
            :key="tabset.id"
            @click="selectTabset(tabset.id)"
            @mouseover="showDeleteButton.set(tabset.id, true)"
            @mouseleave="showDeleteButton.set(tabset.id, false)"

            :style="tabset.id === tabsStore.currentTabsetId ? 'background-color:#efefef' : 'border:0px solid #bfbfbf'">
      <q-item-section
        @drop="onDrop($event, tabset.id)"
        @dragover.prevent
        @dragenter.prevent>
        <q-item-label
          v-text="tabset.tabs?.length > 1 ? tabset.name + ' (' + tabset.tabs?.length + ' tabs)' : tabset.name + ' (' + tabset.tabs?.length + ' tab)'"/>
      </q-item-section>
      <!--      <q-item-section avatar v-if="showDeleteButton.get(tabset.id)">-->
      <!--        <q-icon name="arrow_downward" color="positive" size="2em" @click.stop="showTabset(tabset)" >-->
      <!--          <q-tooltip>Show Tabs...</q-tooltip>-->
      <!--        </q-icon>-->
      <!--      </q-item-section>-->
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
import {Tabset} from "src/models/Tabset";
import {Tab} from "src/models/Tab";

const router = useRouter()
const tabsStore = useTabsStore()
const newTabsetName = ref('new name')
const showDeleteButton = ref<Map<string, boolean>>(new Map())
const $q = useQuasar();
const tabsetToShow = ref<Tabset>(null as unknown as Tabset)

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

const showTabset = (tabset: Tabset) => {
  console.log("showingTabset", tabset)
  tabsetToShow.value = tabset
}

const onDrop = (evt: DragEvent, tabsetId: string) => {
  if (evt.dataTransfer && tabsetId) {
    const tabId = evt.dataTransfer.getData('text/plain')
    TabsetService.moveToTabset(tabId, tabsetId)
  } else {
    console.log("got error dropping tab", tabsetId)
  }
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

<style lang="sass" scoped>
.drop-zone
  background-color: #eee
  margin-bottom: 10px
  padding: 10px
</style>
