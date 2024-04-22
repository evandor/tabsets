<template>
  <div class="column" style="height:100%">
    <div class="col">

      <q-toolbar>
        <div class="row fit">
          <div class="col-xs-12 col-md-6">
            <q-toolbar-title>
              <div class="row justify-start items-baseline" v-if="usePermissionsStore().hasFeature(FeatureIdent.SPACES)">
                <SpacesSelectorWidget />
              </div>
              <div class="row justify-start items-baseline" v-else>
                My Tabsets
              </div>
            </q-toolbar-title>
          </div>
          <div class="col-xs-12 col-md-6 text-right">

            <q-icon
              class="cursor-pointer" size="22px" color="warning"
              style="position: relative;top:5px;right:-2px"
              name="add_circle" @click="addTabset">
              <q-tooltip
                class="tooltip"
                :delay="200"
                anchor="center left" self="center right">
                {{ usePermissionsStore().hasFeature(FeatureIdent.SPACES) ?
                  'Click here to add a new tabset to the current Space':
                  'Click here to add a new tabset'}}
              </q-tooltip>
            </q-icon>

          </div>
        </div>
      </q-toolbar>


      <q-list class="q-mt-none greyBorderTop">
        <NavTabsetsListWidgetNonBex :tabsets="tabsets()" :space-id="useSpacesStore().space?.id || undefined"/>
      </q-list>

      <q-separator v-if="tabsetsWithTypes([TabsetType.SPECIAL]).length > 0"/>

      <NavTabsetsListWidgetNonBex :tabsets="tabsetsWithTypes([TabsetType.SPECIAL])"/>

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
import {useSpacesStore} from "src/spaces/stores/spacesStore";
import NewTabsetDialog from "components/dialogues/NewTabsetDialog.vue";
import {useUiStore} from "src/stores/uiStore";
import {useNotificationsStore} from "src/stores/notificationsStore";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {useUtils} from "src/services/Utils";
import NavTabsetsListWidgetNonBex from "components/widgets/NavTabsetsListWidgetNonBex.vue";
import {FeatureIdent} from "src/models/AppFeature";
import {useSettingsStore} from "src/stores/settingsStore"
import SpacesSelectorWidget from "src/spaces/widgets/SpacesSelectorWidget.vue";

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
const splitterModel = ref(350)

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

</script>

