<template>
  <div class="column" style="height:96%">
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

            <q-btn
              @click="addTabset"
              label="create"
              unelevated
              size="0.8em"
              color="warning">
              <q-tooltip
                class="tooltip"
                :delay="200"
                anchor="center left" self="center right">
                Click here to add a new tabset
              </q-tooltip>
            </q-btn>


          </div>
        </div>
      </q-toolbar>


<!--      <q-splitter-->
<!--        v-model="splitterModel"-->
<!--        separator-class="bg-white"-->
<!--        horizontal-->
<!--        class="bg-grey-1 fit"-->
<!--        unit="px"-->
<!--        reverse>-->

<!--        <template v-slot:before>-->
          <q-list class="q-mt-none greyBorderTop">

<!--            <InfoMessageWidget-->
<!--              v-if="tabsStore.tabsets.size > 9"-->
<!--              :probability="0.5"-->
<!--              ident="navigation_archiveTabsets"-->
<!--              hint="You can click on the inventory icon to archive your tabset. It will not appear here any more, but can be restored in the settings."/>-->

            <NavTabsetsListWidget :tabsets="tabsets(true)"/>

            <q-separator v-if="tabsets(true).length > 0"/>
            <NavTabsetsListWidget :tabsets="tabsets(false)"/>
          </q-list>
<!--        </template>-->

<!--        <template v-slot:after v-if="permissonsStore.hasFeature('details')">-->
<!--&lt;!&ndash;          <TabInfo v-if="notificationStore.selectedTab"/>&ndash;&gt;-->
<!--          <TabsetInfo v-if="tabsStore.currentTabsetId"/>-->
<!--        </template>-->

<!--      </q-splitter>-->

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
import {useSpacesStore} from "src/stores/spacesStore";
import NewTabsetDialog from "components/dialogues/NewTabsetDialog.vue";
import NavTabsetsListWidget from "components/widgets/NavTabsetsListWidget.vue"
import TabInfo from "components/layouts/TabInfo.vue";
import {useUiStore} from "src/stores/uiStore";
import {useNotificationsStore} from "src/stores/notificationsStore";
import TabsetInfo from "components/layouts/TabsetInfo.vue";
import {usePermissionsStore} from "src/stores/permissionsStore";
import InfoMessageWidget from "components/widgets/InfoMessageWidget.vue";

const router = useRouter()
const tabsStore = useTabsStore()
const featuresStore = useFeatureTogglesStore()
const spacesStore = useSpacesStore()
const notificationStore = useNotificationsStore()
const permissonsStore = usePermissionsStore()

const $q = useQuasar();
const localStorage = $q.localStorage

const newTabsetName = ref('')
const merge = ref(false)
const splitterModel = ref(permissonsStore.hasFeature('details') ? 350 : 1)

$q.loadingBar.setDefaults({
  color: 'green',
  size: '10px',
  position: 'bottom'
})

const tabsets = (isFavorite: boolean) => {
  let tabsets = [...tabsStore.tabsets.values()]
  if (usePermissionsStore().hasFeature('spaces') && spacesStore.spaces && spacesStore.spaces.size > 0) {
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

