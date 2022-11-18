<template>

  <q-list class="q-mt-md">

<!--      <q-btn-->
<!--        @click="addTabset"-->
<!--        flat round dense icon="add" color="positive">-->
<!--        <q-tooltip>Click here to add new tabsets</q-tooltip>-->
<!--      </q-btn>-->

    <q-toolbar v-if="tabsStore.tabsets.size > 0">
      <q-toolbar-title style="font-size:16px">
        <span>Tabsets</span>
        <span v-if="tabsStore.tabsets.size > 3">({{ tabsStore.tabsets.size }})</span>
      </q-toolbar-title>
      <q-btn
        @click="addTabset"
        flat round dense icon="add" color="positive">
        <q-tooltip>Click here to add new tabsets</q-tooltip>
      </q-btn>
    </q-toolbar>

    <q-toolbar v-else>
      <q-toolbar-title style="font-size:16px">
        <Transition name="delayed-appear" appear>
          <q-btn class="fit" outline @click="addTabset" label="create your first tabset"></q-btn>
        </Transition>
      </q-toolbar-title>
    </q-toolbar>

    <q-item
      v-for="(tabset,index) in tabsets()"
      :key="'local_' + tabset.id"
      :data-testid="'navigation_tabset_' +  index"
      clickable v-ripple
      @click="selectTabset(tabset.id)"
      @mouseover="showButtons(tabset.id, true)"
      @mouseleave="showButtons(tabset.id, false)"
      :style="tabset.id === tabsStore.currentTabsetId ? 'background-color:#efefef' : 'border:0px solid #bfbfbf'">

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
      <q-item-section
        avatar v-if="showDeleteButton.get(tabset.id)"
        :data-testid="'navigation_tabset_delete_' +  index">
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
import {useTabsStore} from "src/stores/tabsStore";
import _ from "lodash"
import {ref} from "vue";
import {useQuasar} from "quasar";
import {Tabset} from "src/models/Tabset";
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import EditTabset from "src/components/dialogues/EditTabsetDialog.vue"
import {useSpacesStore} from "stores/spacesStore";
import NewTabsetDialog from "components/dialogues/NewTabsetDialog.vue";

const router = useRouter()
const tabsStore = useTabsStore()
const featuresStore = useFeatureTogglesStore()
const spacesStore = useSpacesStore()

const showDeleteButton = ref<Map<string, boolean>>(new Map())
const showEditButton = ref<Map<string, boolean>>(new Map())
const $q = useQuasar();
const localStorage = $q.localStorage

const newTabsetName = ref('')
const merge = ref(false)

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
  let tabsets = [...tabsStore.tabsets.values()]
  if (spacesStore.spaces && spacesStore.spaces.size > 0) {
    if (spacesStore.space && spacesStore.space.id && spacesStore.space.id.length > 0) {
      tabsets = _.filter(tabsets, ts => ts.spaces && ts.spaces.indexOf(spacesStore.space.id) >= 0)
    } else {
      tabsets = _.filter(tabsets, ts => ts.spaces && ts.spaces.length === 0)
    }
  }
  return _.sortBy(tabsets, ['name'])
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
    }
  })

// const showNewTabsetDialog = ref(false)
const addTabset = () => {
  $q.dialog({
    component: NewTabsetDialog
  }).onDismiss(() => {
    // showNewTabsetDialog.value = false
  })
}

</script>

<style lang="sass" scoped>

.delayed-appear-enter-active
  transition: all 2s ease-in
  transition-delay: 1s

.delayed-appear-enter-from,
.delayed-appear-leave-to
  opacity: 0

</style>
