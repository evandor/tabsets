<template>
  <div class="column" style="height:100%;background-color: #f9f9f9">
    <div class="col">

      <q-toolbar class="text-primary lightgrey">
        <div class="row fit">
          <div class="col-xs-12 col-md-6">
            <q-toolbar-title>
              <div class="row justify-start items-baseline">
                Your Tabsets
              </div>
            </q-toolbar-title>
          </div>
          <div class="col-xs-12 col-md-6 text-right">

            <q-icon
              class="cursor-pointer" size="1.3em"
              style="position: relative;top:5px;right:-2px"
              name="add" @click="addTabset">
              <q-tooltip
                class="tooltip"
                :delay="200"
                anchor="center left" self="center right">
                Click here to add a new tabset
              </q-tooltip>
            </q-icon>

          </div>
        </div>
      </q-toolbar>


      <q-list class="q-mt-none greyBorderTop">
        <NavTabsetsListWidgetNonBex :tabsets="tabsets()"/>
      </q-list>

      <q-separator v-if="tabsetsWithTypes([TabsetType.SPECIAL]).length > 0"/>

      <NavTabsetsListWidget :tabsets="tabsetsWithTypes([TabsetType.SPECIAL])"/>

    </div>
  </div>


</template>

<script setup lang="ts">

import TabsetService from "src/services/TabsetService";
import {useRouter} from "vue-router";
import {useTabsStore} from "src/stores/tabsStore";
import _ from "lodash"
import {ref} from "vue";
import {useQuasar} from "quasar";
import {Tabset, TabsetStatus, TabsetType} from "src/models/Tabset";
import {useSpacesStore} from "src/stores/spacesStore";
import NewTabsetDialog from "components/dialogues/NewTabsetDialog.vue";
import NavTabsetsListWidget from "components/widgets/NavTabsetsListWidget.vue"
import {useUiStore} from "src/stores/uiStore";
import {useNotificationsStore} from "src/stores/notificationsStore";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {useUtils} from "src/services/Utils";
import NavTabsetsListWidgetNonBex from "components/widgets/NavTabsetsListWidgetNonBex.vue";
import {FeatureIdent} from "src/models/AppFeature";
import {useSettingsStore} from "src/stores/settingsStore"

const router = useRouter()
const tabsStore = useTabsStore()
const featuresStore = useSettingsStore()
const spacesStore = useSpacesStore()
const notificationStore = useNotificationsStore()
const permissonsStore = usePermissionsStore()

const $q = useQuasar();
const localStorage = $q.localStorage

const {inBexMode} = useUtils()

const newTabsetName = ref('')
const merge = ref(false)
const splitterModel = ref(permissonsStore.hasFeature(FeatureIdent.DETAILS) ? 350 : 1)

$q.loadingBar.setDefaults({
  color: 'green',
  size: '10px',
  position: 'bottom'
})

const tabsets = ():Tabset[] => {
  let tabsets = [...tabsStore.tabsets.values()]
  if (usePermissionsStore().hasFeature(FeatureIdent.SPACES) && spacesStore.spaces && spacesStore.spaces.size > 0) {
    if (spacesStore.space && spacesStore.space.id && spacesStore.space.id.length > 0) {
      tabsets = _.filter(tabsets, ts => ts.status !== TabsetStatus.ARCHIVED && ts.spaces && ts.spaces.indexOf(spacesStore.space.id) >= 0)
    } else {
      tabsets = _.filter(tabsets, ts => ts.status !== TabsetStatus.ARCHIVED && ts.spaces && ts.spaces.length === 0)
    }
  }
  return _.sortBy(_.filter(tabsets, (ts: Tabset) =>
      ts.type !== TabsetType.SPECIAL &&
      ts.status !== TabsetStatus.ARCHIVED &&
      ts.status !== TabsetStatus.DELETED),
    [
      function (o) {
        return o.status === TabsetStatus.FAVORITE ? 0 : 1
      },
      function (o) {
        return o.name.toLowerCase()
      }
    ])
}

const tabsetsWithTypes = (types: TabsetType[]) => {
  let tabsets = [...tabsStore.tabsets.values()]
  return _.sortBy(
    _.filter(tabsets, (ts: Tabset) =>
      types.findIndex(t => ts.type === t && TabsetStatus.DELETED !== ts.status) >= 0),
    ['name'])
}

const onDrop = (evt: DragEvent, tabsetId: string) => {
  console.log("onDrop", evt, tabsetId)
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

const addTabset = () => $q.dialog({
  component: NewTabsetDialog, componentProps: {
    setEmptyByDefault: useUiStore().newTabsetEmptyByDefault
  }
})

const setGroupedTabsCaption = (msg: string) => {
  console.log("received caption", msg)
  //groupedTabsCaption.value = msg
}

</script>

