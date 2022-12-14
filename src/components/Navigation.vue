<template>
  <div class="column" style="height:96%">
    <div class="col">

      <q-toolbar class="text-primary lightgrey" v-if="tabsStore.tabsets.size > 0">
        <div class="row fit">
          <div class="col-xs-12 col-md-5">
            <q-toolbar-title>
              <div class="row justify-start items-baseline">
                Tabsets
              </div>
            </q-toolbar-title>
          </div>
          <div class="col-xs-12 col-md-7 text-right">

            <q-btn
              @click="addTabset(false)"
              style="cursor: context-menu"
              flat round dense icon="add" color="primary">
              <q-tooltip
                class="tooltip"
                :delay="200"
                anchor="center left" self="center right">
                Click here to add new tabsets.<br>
                Check the context menu for additional options
              </q-tooltip>
            </q-btn>
            <q-menu :v-model="false" context-menu :offset="[-10,-30]">
              <q-list style="min-width: 100px" dense>
                <q-item clickable v-close-popup>
                  <q-item-section @click="addTabset(true)">Add empty tabset</q-item-section>
                </q-item>
              </q-list>
            </q-menu>

          </div>
        </div>
      </q-toolbar>


      <q-splitter
        v-model="splitterModel"
        separator-class="bg-white"
        horizontal
        class="bg-grey-1 fit"
        unit="px"
        reverse>

        <template v-slot:before>
          <q-list class="q-mt-none greyBorderTop">
            <NavTabsetsListWidget :tabsets="tabsets(true)"/>

            <q-separator v-if="tabsets(true).length > 0"/>
            <NavTabsetsListWidget :tabsets="tabsets(false)"/>

            <!--    <q-separator v-if="archivedTabsets().length > 0"/>-->
            <!--    <NavTabsetsListWidget :tabsets="archivedTabsets()" :useExpansion=true />-->
          </q-list>
        </template>

        <!--        <template v-slot:separator>-->
        <!--          <q-avatar color="primary" text-color="white" size="40px" icon="drag_indicator"/>-->
        <!--        </template>-->

        <template v-slot:after>
          <TabInfo v-if="notificationStore.selectedTab"/>
          <TabsetInfo v-else-if="tabsStore.currentTabsetId"/>

        </template>

      </q-splitter>

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
import {Tabset, TabsetStatus} from "src/models/Tabset";
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import {useSpacesStore} from "stores/spacesStore";
import NewTabsetDialog from "components/dialogues/NewTabsetDialog.vue";
import NavTabsetsListWidget from "components/widgets/NavTabsetsListWidget.vue"
import TabInfo from "components/layouts/TabInfo.vue";
import {useUiStore} from "stores/uiStore";
import {useNotificationsStore} from "stores/notificationsStore";
import TabsetInfo from "components/layouts/TabsetInfo.vue";

const router = useRouter()
const tabsStore = useTabsStore()
const featuresStore = useFeatureTogglesStore()
const spacesStore = useSpacesStore()
const notificationStore = useNotificationsStore()

const $q = useQuasar();
const localStorage = $q.localStorage

const newTabsetName = ref('')
const merge = ref(false)
const splitterModel = ref(350)

$q.loadingBar.setDefaults({
  color: 'green',
  size: '10px',
  position: 'bottom'
})

const tabsets = (isFavorite: boolean) => {
  let tabsets = [...tabsStore.tabsets.values()]
  if (featuresStore.isEnabled('spaces') && spacesStore.spaces && spacesStore.spaces.size > 0) {
    if (spacesStore.space && spacesStore.space.id && spacesStore.space.id.length > 0) {
      tabsets = _.filter(tabsets, ts => ts.status !== TabsetStatus.ARCHIVED && ts.spaces && ts.spaces.indexOf(spacesStore.space.id) >= 0)
    } else {
      tabsets = _.filter(tabsets, ts => ts.status !== TabsetStatus.ARCHIVED && ts.spaces && ts.spaces.length === 0)
    }
  }
  return _.sortBy(_.filter(tabsets, (ts: Tabset) =>
    ts.status !== TabsetStatus.ARCHIVED &&
    ts.status !== TabsetStatus.DELETED &&
    ts.status === (isFavorite ? TabsetStatus.FAVORITE : TabsetStatus.DEFAULT)), ['name'])
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

const addTabset = (empty: boolean) => $q.dialog({
  component: NewTabsetDialog, componentProps: {
    setAddAutomaticByDefault: !empty//useUiStore().addTabsAutomaticallyDefault
  }
})

</script>

