<template>

  <q-list class="q-mt-md">

    <q-item-label header>
      Tabsets <span v-if="tabsStore.tabsets.size > 3">({{ tabsStore.tabsets.size }})</span>
    </q-item-label>

    <div class="text-body2 q-pa-lg" v-if="tabsStore.tabsets.size === 0">
      <q-banner rounded class="bg-amber-1">
        No Tabsets (yet)
      </q-banner>
    </div>

    <q-item
      v-for="tabset in tabsets()"
      :key="'local_' + tabset.id"
      clickable v-ripple
      @click="selectTabset(tabset.id)"
      @mouseover="showButtons(tabset.id, true)"
      @mouseleave="showButtons(tabset.id, false)"
      :style="tabset.id === tabsStore.currentTabsetId ? 'background-color:#efefef' : 'border:0px solid #bfbfbf'">

      <q-item-section avatar v-if="remoteAndLocalTabsets">
        <q-icon name="cloud_queue" color="red">
          <q-tooltip>
            This tabset is stored only locally and cannot be accessed from anywhere.<br>
            You might want to synchronize it to add it to your cloud storage.
          </q-tooltip>
        </q-icon>
      </q-item-section>

      <q-item-section
        @drop="onDrop($event, tabset.id)"
        @dragover.prevent
        @dragenter.prevent>
        <q-item-label v-text="tabsetLabel(tabset)"/>
      </q-item-section>

      <q-item-section avatar v-if="showEditButton.get(tabset.id)">
        <q-icon name="edit" color="positive" size="2em" @click="editDialog(tabset)">
          <q-tooltip>Edit the tabset's name...</q-tooltip>
        </q-icon>
      </q-item-section>
      <q-item-section avatar v-show="showDeleteButton.get(tabset.id)">
        <q-icon name="delete_outline" color="negative" size="18px" @click="deleteDialog">
          <q-tooltip>Delete this tabset...</q-tooltip>
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
import { useQuasar} from "quasar";
import {Tabset} from "src/models/Tabset";
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import EditTabset from "src/components/dialogues/EditTabset.vue"

const router = useRouter()
const tabsStore = useTabsStore()
const featuresStore = useFeatureTogglesStore()

const showDeleteButton = ref<Map<string, boolean>>(new Map())
const showEditButton = ref<Map<string, boolean>>(new Map())
const $q = useQuasar();

const newTabsetName = ref('')
const merge = ref(false)

const remoteAndLocalTabsets = ref(false)

$q.loadingBar.setDefaults({
  color: 'green',
  size: '10px',
  position: 'bottom'
})

const selectTabset = (tabsetId: string) => {
  TabsetService.selectTabset(tabsetId)
  router.push("/tabset")
}

const tabsets = () => {
  return _.sortBy([...tabsStore.tabsets.values()], ['name'])
}

const onDrop = (evt: DragEvent, tabsetId: string) => {
  if (evt.dataTransfer && tabsetId) {
    const tabId = evt.dataTransfer.getData('text/plain')
    TabsetService.moveToTabset(tabId, tabsetId)
  } else {
    console.log("got error dropping tab", tabsetId)
  }
}

const tabsetLabel = (tabset: Tabset) => {
  return tabset.tabs?.length > 1 ? tabset.name + ' (' + tabset.tabs?.length + ' tabs)' : tabset.name + ' (' + tabset.tabs?.length + ' tab)'
}


const tabNameExists = () => tabsStore.nameExistsInContextTabset(newTabsetName.value)

const showButtons = (tabsetId: string, show: boolean) => {
  showDeleteButton.value.set(tabsetId, show)
  showEditButton.value.set(tabsetId, show)
}

const deleteDialog = () => {
  $q.dialog({
    title: 'Deleting Tabset',
    message: 'Would you like to delete this tabset?',
    cancel: true,
    persistent: true
  }).onOk(() => {
    TabsetService.delete(tabsStore.currentTabsetId)
    router.push("/about")
  }).onCancel(() => {
  }).onDismiss(() => {
  })
}

const editDialog = (tabset: Tabset) =>
  $q.dialog({
    component: EditTabset,
    componentProps: {
      tabsetId: tabset.id,
      tabsetName: tabset.name
    }})


</script>

<style lang="sass" scoped>
.drop-zone
  background-color: #eee
  margin-bottom: 10px
  padding: 10px

.v-enter-active,
.v-leave-active
  transition: opacity 0.5s ease

.v-enter-from,
.v-leave-to
  opacity: 0

</style>
