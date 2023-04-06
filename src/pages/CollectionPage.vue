<template>

  <!-- toolbar -->
  <q-toolbar class="text-primary lightgrey">
    <div class="row fit">
      <div class="col-xs-12 col-md-6">
        <q-toolbar-title>
          <div class="row justify-start items-baseline">
            <div class="col-1"><span class="text-dark">Tabs of </span> <span
              class="text-primary text-weight-bold cursor-pointer"
              @mouseenter="showEditButton = true"
              @mouseout="showEditButton = false">
              {{ entitiesStore.currentCollectionName }}
<!--               <q-popup-edit :model-value="tabsStore.getCurrentTabset.name" v-slot="scope"-->
<!--                             @update:model-value="val => setNewName(  val)">-->
<!--                 <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set"/>-->
<!--               </q-popup-edit>-->
            </span>
              <q-icon v-if="showEditButton" style="position:relative;top:-11px;left:-5px" color="primary" name="edit"
                      size="16px"/>
              <q-icon v-else size="16px"/>

              <q-icon v-if="tabsStore.tabsets.size > 9 && tabsStore.getCurrentTabset?.status === TabsetStatus.DEFAULT"
                      @click="markAsFavorite()"
                      class="q-ml-md cursor-pointer"
                      color="warning" name="o_grade" size="20px">
                <q-tooltip class="tooltip">Mark this tabset as a favorite one</q-tooltip>
              </q-icon>

              <q-icon v-if="tabsStore.tabsets.size > 9 && tabsStore.getCurrentTabset?.status === TabsetStatus.FAVORITE"
                      @click="markAsDefault()"
                      class="q-ml-md cursor-pointer"
                      color="warning" name="grade" size="20px">
                <q-tooltip class="tooltip">Undo marking this tabset as favorite</q-tooltip>
              </q-icon>

              <q-icon
                v-if="tabsStore.tabsets.size > 9 && tabsStore.getCurrentTabset?.type === TabsetType.DEFAULT && tabsStore.getCurrentTabset?.status !== TabsetStatus.DELETED"
                @click="archiveTabset()"
                class="q-ml-md cursor-pointer"
                color="primary" name="o_inventory_2" size="20px">
                <q-tooltip class="tooltip">Archive this tabset</q-tooltip>
              </q-icon>

              <q-icon v-if="tabsStore.getCurrentTabs?.length > 0 && inBexMode()"
                      @click="restoreDialog"
                      class="q-ml-md cursor-pointer"
                      color="primary" name="o_open_in_browser" size="20px">
                <q-tooltip
                  class="tooltip"
                  :delay="200">
                  Open all the tabs from this tabset in a new window
                </q-tooltip>
              </q-icon>


            </div>
          </div>
        </q-toolbar-title>
      </div>
      <div class="col-xs-12 col-md-6 text-right">

        <q-btn v-if="showSorting()"
               @click="toggleSorting()"
               style="width:14px"
               class="q-mr-sm" size="10px"
               outline
               icon="o_sort_by_alpha">
          <q-tooltip>Toggle through sorting</q-tooltip>
        </q-btn>

        <q-btn v-if="showSorting()"
               :disable="tabsStore.getCurrentTabset?.sorting === 'custom'"
               @click="toggleOrder()"
               style="width:14px"
               class="q-mr-xl" size="10px"
               outline
               :icon="orderDesc ? 'arrow_drop_up' : 'arrow_drop_down'">
          <q-tooltip>Sorting descending or ascending, currently {{ orderDesc }}</q-tooltip>
        </q-btn>


        <q-btn v-if="tabsStore.getCurrentTabset?.tabs.length > 0"
               @click="setView('group')"
               style="width:14px"
               class="q-mr-sm" size="8px"
               :flat="tabsStore.getCurrentTabset?.view !== 'group'"
               :outline="tabsStore.getCurrentTabset?.view === 'group'"
               icon="view_week">
          <q-tooltip class="tooltip">Use group layout to visualize your tabs</q-tooltip>
        </q-btn>

        <!-- default view, no need to show if there is no alternative -->
        <q-btn v-if="tabsStore.getCurrentTabset?.tabs.length > 0"
               @click="setView('list')"
               style="width:14px"
               class="q-mr-sm" size="10px"
               :flat="tabsStore.getCurrentTabset?.view !== 'list'"
               :outline="tabsStore.getCurrentTabset?.view === 'list'"
               icon="o_list">
          <q-tooltip class="tooltip">Use the list layout to visualize your tabs</q-tooltip>
        </q-btn>

        <q-btn
          v-if="permissionsStore.hasFeature(FeatureIdent.EXPERIMENTAL_VIEWS) && tabsStore.getCurrentTabset?.tabs.length > 0"
          @click="setView('canvas')"
          style="width:14px"
          class="q-mr-sm" size="10px"
          :flat="tabsStore.getCurrentTabset?.view !== 'canvas'"
          :outline="tabsStore.getCurrentTabset?.view === 'canvas'"
          icon="o_shape_line">
          <q-tooltip>Use the canvas freestyle layout to visualize your tabs</q-tooltip>
        </q-btn>

        <q-btn
          v-if="permissionsStore.hasFeature(FeatureIdent.EXPERIMENTAL_VIEWS) && tabsStore.getCurrentTabset?.tabs.length > 0"
          @click="setView('exporter')"
          style="width:14px"
          class="q-mr-sm" size="10px"
          :flat="tabsStore.getCurrentTabset?.view !== 'exporter'"
          :outline="tabsStore.getCurrentTabset?.view === 'exporter'"
          icon="o_ios_share">
          <q-tooltip>Use the exporter layout if you want to copy and paste the urls of this tabset</q-tooltip>
        </q-btn>

        <q-btn v-if="tabsStore.currentTabsetId !== '' && tabsStore.getTabset(tabsStore.currentTabsetId)"
               data-testid="addUrlDialogBtn"
               @click="addUrlDialog"
               class="q-ml-xl"
               label="new Tab"
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

const route = useRoute();
const router = useRouter();
const localStorage = useQuasar().localStorage
const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()
const settingsStore = useSettingsStore()
const permissionsStore = usePermissionsStore()
const entitiesStore = useEntitiesStore()

const {inBexMode} = useUtils()

const tabsetname = ref(tabsStore.currentTabsetName)
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


const setNewName = (newValue: string) => useCommandExecutor().executeFromUi(new RenameTabsetCommand(tabsStore.currentTabsetId, newValue))


function getOrder() {
  if (tabsStore.getCurrentTabset) {
    switch (tabsStore.getCurrentTabset?.sorting) {
      case 'alphabeticalUrl':
        return (t: Tab) => t.chromeTab.url?.replace("https://", "").replace("http://", "").toUpperCase()
        break
      case 'alphabeticalTitle':
        return (t: Tab) => t.chromeTab.title?.toUpperCase()
        break
      default:
        return (t: Tab) => 1
    }
    return (t: Tab) => 1
  }
}


function tabsForGroup(groupId: number): Tab[] {
  return _.orderBy(
    _.filter(
      tabsStore.getTabset(collectionId.value)?.tabs,
      // @ts-ignore
      (t: Tab) => t?.chromeTab.groupId === groupId),
    getOrder(), [orderDesc.value ? 'desc' : 'asc'])
}

const update = (tabsetIdent: object) => {
  console.log("selected tabset now: ", tabsetIdent)
  tabsetname.value = tabsetIdent['label' as keyof object]
  tabsStore.selectCurrentTabset(tabsetIdent['value' as keyof object])
}

const formatLength = (length: number, singular: string, plural: string) => {
  return (length > 1 || length === 0) ? length + ' ' + plural : length + ' ' + singular
}

const selectedCount = ref(0)

const updateSelectionCount = () => {
  selectedCount.value = TabsetService.getSelectedPendingTabs().length
}


const filteredTabs = () => {
  const noDupliatesTabs = _.filter(tabsStore.pendingTabset?.tabs, (t: Tab) => !t.isDuplicate)
  if (filter.value && filter.value.trim() !== '') {
    return _.filter(noDupliatesTabs, (t: Tab) =>
      (t?.chromeTab.url && t?.chromeTab.url.indexOf(filter.value) >= 0) ||
      (t?.chromeTab.title && t?.chromeTab.title.indexOf(filter.value) >= 0))
  }
  return noDupliatesTabs
}

const restoreDialog = () => $q.dialog({component: RestoreTabsetDialog})
const addUrlDialog = () => $q.dialog({component: AddUrlDialog})


const setView = (view: string) => TabsetService.setView(collectionId.value, view)

const specialView = (): boolean =>
  tabsStore.getCurrentTabset?.view === 'kanban' || tabsStore.getCurrentTabset?.view === 'canvas'

const markAsFavorite = () => useCommandExecutor().executeFromUi(new MarkTabsetAsFavoriteCommand(tabsStore.currentTabsetId))
const markAsDefault = () => useCommandExecutor().executeFromUi(new MarkTabsetAsDefaultCommand(tabsStore.currentTabsetId))
const archiveTabset = () => useCommandExecutor().executeFromUi(new MarkTabsetAsArchivedCommand(tabsStore.currentTabsetId))

const stopSession = () => useCommandExecutor().executeFromUi(new StopSessionCommand(tabsStore.getCurrentTabset))

const toggleSorting = () => useCommandExecutor().executeFromUi(new ToggleSortingCommand(collectionId.value))

const toggleOrder = () => orderDesc.value = !orderDesc.value

const sortingInfo = (): string => {
  switch (tabsStore.getCurrentTabset?.sorting) {
    case 'custom':
      return ", sorted by Index" + (orderDesc.value ? ', descending' : '')
      break
    case 'alphabeticalUrl':
      return ", sorted by URL" + (orderDesc.value ? ', descending' : '')
      break
    case 'alphabeticalTitle':
      return ", sorted by Title" + (orderDesc.value ? ', descending' : '')
      break
    default:
      return "";
      break
  }
}

const showSorting = () => tabsStore.getCurrentTabs.length > 10

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
