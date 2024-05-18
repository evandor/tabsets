<template>

  <!-- toolbar -->
  <q-toolbar class="text-primary lightgrey" v-if="!tabsStore.currentTabsetId">
    <div class="row fit">
      <q-toolbar-title>
        <div class="row justify-start items-baseline">
          <div class="col-1"><span class="text-dark">Tabs</span> (no tabset selected)</div>
        </div>
      </q-toolbar-title>
    </div>
  </q-toolbar>
  <q-toolbar class="text-primary lightgrey" v-else>
    <div class="row fit">
      <div class="col-xs-12 col-md-6">
        <q-toolbar-title>
          <div class="row justify-start items-baseline">
            <div class="col-1"><span class="text-dark">Tabs of !</span> <span
              class="text-primary text-weight-bold cursor-pointer"
              @mouseenter="showEditButton = true"
              @mouseout="showEditButton = false">
              {{ useTabsetsStore().currentTabsetName }}
               <q-popup-edit :model-value="useTabsetsStore().getCurrentTabset?.name" v-slot="scope"
                             @update:model-value="val => setNewName(  val)">
                 <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set"/>
               </q-popup-edit>
            </span>
              <q-icon v-if="showEditButton" style="position:relative;top:-11px;left:-5px" color="primary" name="edit"
                      size="16px"/>
              <q-icon v-else size="16px"/>

              <q-icon v-if="useTabsetsStore().tabsets.size > 9 && useTabsetsStore().getCurrentTabset?.status === TabsetStatus.DEFAULT"
                      @click="markAsFavorite()"
                      class="q-ml-sm cursor-pointer"
                      color="warning" name="o_grade" size="20px">
                <q-tooltip class="tooltip">Mark this tabset as a favorite one</q-tooltip>
              </q-icon>

              <q-icon v-if="useTabsetsStore().tabsets.size > 9 && useTabsetsStore().getCurrentTabset?.status === TabsetStatus.FAVORITE"
                      @click="markAsDefault()"
                      class="q-ml-sm cursor-pointer"
                      color="warning" name="grade" size="20px">
                <q-tooltip class="tooltip">Undo marking this tabset as favorite</q-tooltip>
              </q-icon>

              <q-icon v-if="useTabsetsStore().getCurrentTabs?.length > 0 && inBexMode()"
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
               :disable="useTabsetsStore().getCurrentTabset?.sorting === 'custom'"
               @click="toggleOrder()"
               style="width:14px"
               class="q-mr-xl" size="10px"
               outline
               :icon="orderDesc ? 'arrow_drop_up' : 'arrow_drop_down'">
          <q-tooltip>Sorting descending or ascending, currently {{ orderDesc }}</q-tooltip>
        </q-btn>

        <q-btn v-if="useFeaturesStore().hasFeature(FeatureIdent.EXPERIMENTAL_VIEWS)"
               @click="setView('grid')"
               style="width:14px"
               class="q-mr-sm" size="8px"
               :flat="useTabsetsStore().getCurrentTabset?.view !== 'grid'"
               :outline="useTabsetsStore().getCurrentTabset?.view === 'grid'"
               icon="grid_on">
          <q-tooltip>Use grid layout to visualize your tabs</q-tooltip>
        </q-btn>

        <!-- default view, no need to show if there is no alternative -->
        <q-btn v-if="useFeaturesStore().hasFeature(FeatureIdent.EXPERIMENTAL_VIEWS)"
               @click="setView('list')"
               style="width:14px"
               class="q-mr-sm" size="10px"
               :flat="useTabsetsStore().getCurrentTabset?.view !== 'list'"
               :outline="useTabsetsStore().getCurrentTabset?.view === 'list'"
               icon="o_list">
          <q-tooltip>Use the list layout to visualize your tabs</q-tooltip>
        </q-btn>

        <q-btn v-if="useFeaturesStore().hasFeature(FeatureIdent.EXPERIMENTAL_VIEWS)"
               @click="setView('canvas')"
               style="width:14px"
               class="q-mr-sm" size="10px"
               :flat="useTabsetsStore().getCurrentTabset?.view !== 'canvas'"
               :outline="useTabsetsStore().getCurrentTabset?.view === 'canvas'"
               icon="o_shape_line">
          <q-tooltip>Use the canvas freestyle layout to visualize your tabs</q-tooltip>
        </q-btn>

<!--        <q-btn-->
<!--          v-if="tabsStore.currentTabsetId !== '' && tabsStore.getTabset(tabsStore.currentTabsetId) && useSettingsStore().isEnabled('newTab')"-->
<!--          flat dense icon="o_create_new_folder"-->
<!--          color="primary" :label="$q.screen.gt.sm ? 'Set as New Tab Page' : ''"-->
<!--          class="q-ml-md q-mr-md"-->
<!--          @click="setAsNewTabPage">-->
<!--          <q-tooltip>Choose this tabset to be shown whenever you open a new tab in your browser</q-tooltip>-->
<!--        </q-btn>-->

      </div>
    </div>
  </q-toolbar>

  <div class="row fit greyBorderTop"></div>


  <!-- rest: neither pinned, grouped, or pending -->
  <!--    v-if="!specialView() && tabsStore.currentTabsetId"-->
  <q-expansion-item
    icon="tabs"
    default-opened>
    <template v-slot:header="{ expanded }">
      <q-item-section>
        <div>
          <span class="text-weight-bold">{{
              dynamicTabset?.tabs.length
            }} {{ dynamicTabset?.tabs.length === 1 ? 'Tab' : 'Tabs' }}</span><span class="text-caption">{{
            sortingInfo()
          }}</span>
          <div class="text-caption ellipsis"></div>
        </div>
      </q-item-section>
    </template>

    <q-card>
      <q-card-section>

        <TabList v-if="useTabsetsStore().getCurrentTabset?.view === 'list'"
                 group="otherTabs"
                 :tabs="dynamicTabset?.tabs || []"/>

        <Tabcards v-else
                  :tabs="dynamicTabset?.tabs" group="otherTabs"/>

      </q-card-section>


    </q-card>
  </q-expansion-item>



</template>

<script setup lang="ts">
import {ref, watchEffect} from 'vue'
import {useRoute, useRouter} from "vue-router";
import {uid, useQuasar} from "quasar";
import Tabcards from "src/components/layouts/Tabcards.vue";
import TabThumbs from "src/components/layouts/TabThumbs.vue";
import TabColumns from "src/components/layouts/TabColumns.vue";
import TabsCanvas from "src/components/layouts/TabsCanvas.vue";
import _ from "lodash"
import {useTabGroupsStore} from "src/stores/tabGroupsStore";
import TabsetService from "src/services/TabsetService";
import {Tab} from "src/tabsets/models/Tab";
import RestoreTabsetDialog from "src/tabsets/dialogues/RestoreTabsetDialog.vue";
import AddUrlDialog from "components/dialogues/AddUrlDialog.vue";
import {usePermissionsStore} from "src/stores/permissionsStore";
import TabList from "components/layouts/TabList.vue";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {RenameTabsetCommand} from "src/tabsets/commands/RenameTabset";
import {Tabset, TabsetStatus, TabsetType} from "src/tabsets/models/Tabset";
import {MarkTabsetAsFavoriteCommand} from "src/tabsets/commands/MarkTabsetAsFavorite";
import {MarkTabsetAsDefaultCommand} from "src/tabsets/commands/MarkTabsetAsDefault";
import {MarkTabsetAsArchivedCommand} from "src/tabsets/commands/MarkTabsetAsArchived";
import {useUtils} from "src/services/Utils";
import {api} from "boot/axios";
import {FeatureIdent} from "src/models/FeatureIdent";
import {useSettingsStore} from "src/stores/settingsStore";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {useFeaturesStore} from "stores/linkedFeaturesStore";

const route = useRoute();

const {inBexMode} = useUtils()

const tabsetname = ref(useTabsetsStore().currentTabsetName)
const filter = ref('')
const $q = useQuasar()

const highlightUrl = ref('')

const tabsetId = ref(null as unknown as string)
const orderDesc = ref(false)
const showEditButton = ref(false)
const dynamicTabs = ref<Tab[]>([])
const dynamicTabset = ref<Tabset | undefined>(undefined)

let oldTabsetId: string | undefined = undefined // why  neccessary?


watchEffect(() => {
  tabsetId.value = route.params.tabsetId as string
  if (tabsetId.value !== oldTabsetId) {
    console.debug("got tabset id", tabsetId.value)
    oldTabsetId = tabsetId.value
    const backendUrl = "https://us-central1-tabsets-backend-prd.cloudfunctions.net/app"
    api.get(`${backendUrl}/dts/wikipedia/lists/List_of_most_visited_websites`, {
      params: {
        url: "domainName",
        title: "site",
        note: "category"
      }
    })
      .then((res) => {
        console.log("res", res)
        dynamicTabset.value = res.data as unknown as Tabset
      })

    // wiki.page("List_of_most_visited_websites")
    // // wiki.page("List_of_most_expensive_domain_names")
    //   .then((page) => {
    //     page.tables().then((tables) => {
    //       console.log("tables", tables)
    //       if (tables && tables.length > 0) {
    //         const arr = tables[0]
    //         arr.forEach((a:any) => {
    //           dynamicTabs.value.push(new Tab(uid(), {
    //             id: 10000,
    //             url: "https://" + a.domainName,
    //             title: a.site,
    //             index: 1,
    //             pinned: false,
    //             highlighted: false,
    //             windowId: 1,
    //             active: false,
    //             incognito: false,
    //             selected: false,
    //             discarded: false,
    //             autoDiscardable: false
    //           }))
    //         })
    //       }
    //     })
    //   })

  }
})

const setNewName = (newValue: string) => useCommandExecutor().executeFromUi(new RenameTabsetCommand(tabsStore.currentTabsetId, newValue))


function getOrder() {
  if (useTabsetsStore().getCurrentTabset) {
    switch (useTabsetsStore().getCurrentTabset?.sorting) {
      case 'alphabeticalUrl':
        return (t: Tab) => t.url?.replace("https://", "").replace("http://", "").toUpperCase()
        break
      case 'alphabeticalTitle':
        return (t: Tab) => t.title?.toUpperCase()
        break
      default:
        return (t: Tab) => 1
    }
    return (t: Tab) => 1
  }
}


const update = (tabsetIdent: object) => {
  console.log("selected tabset now: ", tabsetIdent)
  tabsetname.value = tabsetIdent['label' as keyof object]
  useTabsetsStore().selectCurrentTabset(tabsetIdent['value' as keyof object])
}

const formatLength = (length: number, singular: string, plural: string) => {
  return (length > 1 || length === 0) ? length + ' ' + plural : length + ' ' + singular
}

const selectedCount = ref(0)

const updateSelectionCount = () => {
  selectedCount.value = TabsetService.getSelectedPendingTabs().length
}

// const filteredTabs = () => {
//   const noDupliatesTabs = _.filter(tabsStore.pendingTabset?.tabs, (t: Tab) => true)
//   if (filter.value && filter.value.trim() !== '') {
//     return _.filter(noDupliatesTabs, (t: Tab) =>
//       (t?.url && t?.url.indexOf(filter.value) >= 0) ||
//       (t?.title && t?.title.indexOf(filter.value) >= 0))
//   }
//   return noDupliatesTabs
// }

const restoreDialog = () => $q.dialog({component: RestoreTabsetDialog})
const addUrlDialog = () => $q.dialog({component: AddUrlDialog})

const setAsNewTabPage = () => {
  //useUiService().setTabsetForNewTabPage(tabsetId.value)
}


const setView = (view: string) => TabsetService.setView(tabsetId.value, view)

const specialView = (): boolean =>
  useTabsetsStore().getCurrentTabset?.view === 'kanban' || useTabsetsStore().getCurrentTabset?.view === 'canvas'

const markAsFavorite = () => useCommandExecutor().executeFromUi(new MarkTabsetAsFavoriteCommand(useTabsetsStore().currentTabsetId))
const markAsDefault = () => useCommandExecutor().executeFromUi(new MarkTabsetAsDefaultCommand(useTabsetsStore().currentTabsetId))
const archiveTabset = () => useCommandExecutor().executeFromUi(new MarkTabsetAsArchivedCommand(useTabsetsStore().currentTabsetId))

const toggleSorting = () => TabsetService.toggleSorting(tabsetId.value)
const toggleOrder = () => orderDesc.value = !orderDesc.value

const sortingInfo = (): string => {
  switch (useTabsetsStore().getCurrentTabset?.sorting) {
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

const showSorting = () => useTabsetsStore().getCurrentTabs.length > 10

</script>

<style>
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0,
  'wght' 400,
  'GRAD' 0,
  'opsz' 48
}
</style>
