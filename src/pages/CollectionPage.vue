<template>

  <!-- toolbar -->
  <q-toolbar class="text-primary lightgrey">
    <div class="row fit">
      <div class="col-xs-12 col-md-6">
        <q-toolbar-title>
          <div class="row justify-start items-baseline">
            <div class="col-1"><span class="text-dark">Entities: {{useUiStore().entityType}}</span> <span
              class="text-primary text-weight-bold cursor-pointer"
              @mouseenter="showEditButton = true"
              @mouseout="showEditButton = false">
              {{ entitiesStore.currentCollectionName }}
            </span>

            </div>
          </div>
        </q-toolbar-title>
      </div>
      <div class="col-xs-12 col-md-6 text-right">


        <q-btn v-if="entitiesStore.currentCollection?.entities?.length > 0"
               @click="setView('group')"
               style="width:14px"
               class="q-mr-sm" size="8px"
               :flat="entitiesStore.currentCollection?.view !== 'group'"
               :outline="entitiesStore.currentCollection?.view === 'group'"
               icon="view_week">
          <q-tooltip class="tooltip">Use group layout to visualize your tabs</q-tooltip>
        </q-btn>

        <!-- default view, no need to show if there is no alternative -->
        <q-btn v-if="entitiesStore.currentCollection?.entities?.length > 0"
               @click="setView('list')"
               style="width:14px"
               class="q-mr-sm" size="10px"
               :flat="entitiesStore.currentCollection?.view !== 'list'"
               :outline="entitiesStore.currentCollection?.view === 'list'"
               icon="o_list">
          <q-tooltip class="tooltip">Use the list layout to visualize your tabs</q-tooltip>
        </q-btn>

        <q-btn
          v-if="permissionsStore.hasFeature(FeatureIdent.EXPERIMENTAL_VIEWS) && entitiesStore.currentCollection?.entities?.length > 0"
          @click="setView('canvas')"
          style="width:14px"
          class="q-mr-sm" size="10px"
          :flat="entitiesStore.currentCollection?.view !== 'canvas'"
          :outline="entitiesStore.currentCollection?.view === 'canvas'"
          icon="o_shape_line">
          <q-tooltip>Use the canvas freestyle layout to visualize your tabs</q-tooltip>
        </q-btn>

        <q-btn
          v-if="permissionsStore.hasFeature(FeatureIdent.EXPERIMENTAL_VIEWS) && entitiesStore.currentCollection?.entities?.length > 0"
          @click="setView('exporter')"
          style="width:14px"
          class="q-mr-sm" size="10px"
          :flat="entitiesStore.currentCollection?.view !== 'exporter'"
          :outline="entitiesStore.currentCollection?.view === 'exporter'"
          icon="o_ios_share">
          <q-tooltip>Use the exporter layout if you want to copy and paste the urls of this tabset</q-tooltip>
        </q-btn>

        <q-btn v-if="entitiesStore.currentCollection"
               @click="addUrlDialog"
               class="q-ml-xl"
               label="new Entity"
               unelevated
               size="0.8em"
               text-color="primary"
               color="warning">
          <q-tooltip
            class="tooltip"
            :delay="200"
            anchor="center left" self="center right">
            Copy and Paste or create a new Tab inside this tabset
          </q-tooltip>
        </q-btn>

      </div>
    </div>
  </q-toolbar>

  <div class="row fit greyBorderTop"></div>

  <CollectionPageCards/>


</template>

<script setup lang="ts">
import {ref, watchEffect} from 'vue'
import {useRoute, useRouter} from "vue-router";
import {useQuasar} from "quasar";
import Tabcards from "src/components/layouts/Tabcards.vue";
import TabThumbs from "src/components/layouts/TabThumbs.vue";
import TabColumns from "src/components/layouts/TabColumns.vue";
import TabsCanvas from "src/components/layouts/TabsCanvas.vue";
import _ from "lodash"
import {useTabsStore} from "src/stores/tabsStore";
import {useTabGroupsStore} from "src/stores/tabGroupsStore";
import TabsetService from "src/services/TabsetService";
import {Tab} from "src/models/Tab";
import RestoreTabsetDialog from "components/dialogues/RestoreTabsetDialog.vue";
import AddUrlDialog from "components/dialogues/AddUrlDialog.vue";
import {usePermissionsStore} from "src/stores/permissionsStore";
import TabList from "components/layouts/TabList.vue";
import InfoMessageWidget from "components/widgets/InfoMessageWidget.vue";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {RenameTabsetCommand} from "src/domain/tabsets/RenameTabset";
import {TabsetStatus, TabsetType} from "src/models/Tabset";
import {MarkTabsetAsFavoriteCommand} from "src/domain/tabsets/MarkTabsetAsFavorite";
import {MarkTabsetAsDefaultCommand} from "src/domain/tabsets/MarkTabsetAsDefault";
import {MarkTabsetAsArchivedCommand} from "src/domain/tabsets/MarkTabsetAsArchived";
import {StopSessionCommand} from "src/domain/commands/StopSessionCommand";
import {useUtils} from "src/services/Utils";
import TabTable from "components/layouts/TabTable.vue";
import {FeatureIdent} from "src/models/AppFeature";
import TabsExporter from "components/layouts/TabsExporter.vue";
import {useUiStore} from "src/stores/uiStore";
import TabGroups from "components/layouts/TabGroups.vue";
import {ToggleSortingCommand} from "src/domain/tabsets/ToggleSorting";
import {useSettingsStore} from "src/stores/settingsStore"
import PageForTabset from "components/layouts/PageForTabset.vue";
import TabsetPageCards from "pages/TabsetPageCards.vue";
import CollectionPageCards from "pages/CollectionPageCards.vue";
import {useEntitiesStore} from "stores/entitiesStore";
import {useEntitiesService} from "src/services/EntitiesService";
import NewEntityDialog from "components/dialogues/NewEntityDialog.vue";

const route = useRoute();
const router = useRouter();
const localStorage = useQuasar().localStorage
const entitiesStore = useEntitiesStore()
const tabGroupsStore = useTabGroupsStore()
const settingsStore = useSettingsStore()
const permissionsStore = usePermissionsStore()

const {inBexMode} = useUtils()

const filter = ref('')
const $q = useQuasar()

const collectionId = ref(null as unknown as string)
const collectionType = ref(null as unknown as string)
const orderDesc = ref(false)
const showEditButton = ref(false)

const tab = ref('tabset')

watchEffect(() => {
  if (!route || !route.params) {
    return
  }
  collectionId.value = route?.params.collectionId as string
  if (collectionId.value) {
    console.log("got collectionId id", collectionId.value)
    collectionType.value = route?.params.type as string
    if (collectionType.value) {
      console.log("got collectionType id", collectionType.value)
      useEntitiesService().selectCollection(collectionType.value, collectionId.value)
    }
  }
})


const formatLength = (length: number, singular: string, plural: string) => {
  return (length > 1 || length === 0) ? length + ' ' + plural : length + ' ' + singular
}

const selectedCount = ref(0)

const updateSelectionCount = () => {
  selectedCount.value = TabsetService.getSelectedPendingTabs()?.length
}


const restoreDialog = () => $q.dialog({component: RestoreTabsetDialog})
const addUrlDialog = () => $q.dialog({
  component: NewEntityDialog, componentProps: {
    type: useUiStore().entityType,
    heading: 'Create a new ' + useUiStore().entityType
  }
})


const setView = (view: string) => TabsetService.setView(collectionId.value, view)


const toggleSorting = () => useCommandExecutor().executeFromUi(new ToggleSortingCommand(collectionId.value))

const toggleOrder = () => orderDesc.value = !orderDesc.value

// const showPinnedTabsSection = () => usePermissionsStore().hasFeature('useGroups') && tabsStore.pinnedTabs?.length > 0 && !specialView()
</script>

<style>
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0,
  'wght' 400,
  'GRAD' 0,
  'opsz' 48
}
</style>
