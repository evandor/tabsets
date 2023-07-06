<template>
  <q-toolbar class="text-primary q-pa-none q-pl-sm q-pr-xs q-pb-none">
    <q-toolbar-title>
      <div class="row q-ma-none q-pa-none">

        <!-- we have spaces -->
        <div v-if="usePermissionsStore().hasFeature(FeatureIdent.SPACES)"
             class="col-8 q-ma-none q-pa-none">
          <template v-if="!props.showBackButton">
            <SearchWidget v-if="searching"
                          :fromPanel="true"
                          style="position: absolute; left:5px;top:5px;max-width:240px"/>
            <div class="column q-ma-none q-pa-none" v-else>
              <div class="col q-ma-none q-pa-none cursor-pointer"
                   @click="router.push('/sidepanel/spaces')">
                {{ titleForSpaces() }}
              </div>
            </div>
          </template>

          <template v-else>
            <template v-if="searching">
              <SearchWidget v-if="searching"
                            :fromPanel="true"
                            style="position: absolute; left:5px;top:5px;max-width:240px"/>
            </template>
            <template v-else>
              <div class="row">
                <div class="col-2">
                  <q-icon
                    size="md"
                    name="chevron_left" class="cursor-pointer"
                    @click="useUiStore().sidePanelSetActiveView(SidePanelView.MAIN)">
                    <q-tooltip>Back</q-tooltip>
                  </q-icon>
                </div>
                <div class="col text-black text-subtitle1">
                  {{ props.title }}
                </div>
              </div>
            </template>
          </template>
        </div>

        <!-- no spaces here -->
        <div v-else class="col-8 q-ma-none q-pa-none">

          <!-- no spaces && searching -->
          <SearchWidget v-if="searching"
                        :fromPanel="true"
                        style="position: absolute; left:5px;top:5px;max-width:240px"/>

          <!-- no spaces && not searching -->
          <template v-else>

            <!-- no spaces && not searching && showBackButton -->
            <div class="row" v-if="props.showBackButton">
              <div class="col-2">
                <q-icon
                  size="md"
                  name="chevron_left" class="cursor-pointer"
                  @click="useUiStore().sidePanelSetActiveView(SidePanelView.MAIN)">
                  <q-tooltip>Back</q-tooltip>
                </q-icon>
              </div>
              <div class="col text-black text-subtitle1">
                {{ props.title }}
              </div>
            </div>

            <!-- no spaces && not searching && not showBackButton -->
            <div v-else class="col q-ml-none text-black text-subtitle1">
              {{ props.title }} <q-btn
                  icon="o_add_circle"
                  color="primary"
                  flat
                  class="q-ma-none q-pa-xs cursor-pointer"
                  style="max-width:20px"
                  size="10px"
                  @click="openNewTabsetDialog()">
                  <q-tooltip class="tooltip">Add new Tabset</q-tooltip>
                </q-btn>
            </div>


          </template>
        </div>
        <div class="col-4 text-right">

          <q-btn v-if="tabsStore.tabsets.size > 1"
                 icon="search"
                 flat
                 class="q-ma-none q-pa-xs cursor-pointer"
                 style="max-width:20px"
                 size="11px"
                 @click="toggleSearch">
            <q-tooltip class="tooltip">Search</q-tooltip>
          </q-btn>

          <q-btn
            v-if="usePermissionsStore().hasFeature(FeatureIdent.CATEGORIZATION)"
            icon="o_cloud"
            :color="cloudIconColor()"
            flat
            class="q-ma-none q-pa-xs cursor-pointer"
            style="max-width:20px"
            size="11px"
            @click="toggleRemote()">
            <q-tooltip class="tooltip">Show Tabset Suggestions</q-tooltip>
          </q-btn>



<!--          <q-btn-->
<!--            v-if="tabsStore.tabsets.size > 1 && useSettingsStore().isEnabled('dev')"-->
<!--            icon="o_keyboard_double_arrow_right"-->
<!--            flat-->
<!--            class="q-ma-none q-pa-xs cursor-pointer"-->
<!--            style="max-width:20px"-->
<!--            size="11px"-->
<!--            @click="openTabsetPage()">-->
<!--            <q-tooltip class="tooltip">Open this Tabset as Standalone page</q-tooltip>-->
<!--          </q-btn>-->

        </div>
      </div>
    </q-toolbar-title>
  </q-toolbar>
</template>

<script lang="ts" setup>

import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {useSpacesStore} from "stores/spacesStore";
import SearchWidget from "components/widgets/SearchWidget.vue";
import {useTabsStore} from "stores/tabsStore";
import {useRouter} from "vue-router";
import {ref} from "vue";
import NavigationService from "src/services/NavigationService";
import {SidePanelView, useUiStore} from "stores/uiStore";
import NewTabsetDialog from "components/dialogues/NewTabsetDialog.vue";
import {useQuasar} from "quasar";

const props = defineProps({
  title: {type: String, default: "My Tabsets"},
  forceTitle: {type: Boolean, default: false},
  showBackButton: {type: Boolean, default: false}
})

const $q = useQuasar()
const router = useRouter()
const tabsStore = useTabsStore()

const searching = ref(false)

const toggleSearch = () => searching.value = !searching.value

const toggleRemote = () => {
  useUiStore().sidePanel.activeView?.ident === SidePanelView.MAIN.ident ?
    useUiStore().sidePanelSetActiveView(SidePanelView.PUBLIC_TABSETS) :
    useUiStore().sidePanelSetActiveView(SidePanelView.MAIN)
}

const openTabsetPage = () => {
  const tabsetId = tabsStore.getCurrentTabset?.id
  if (tabsetId) {
    const extensionUrl = chrome.runtime.getURL('www/index.html#/mainpanel/tabsets/' + tabsetId)
    NavigationService.openOrCreateTab(extensionUrl)
  }
  router.push("/sidepanel/spaces")
}

const openNewTabsetDialog = () => {
  $q.dialog({
    component: NewTabsetDialog,
    componentProps: {
      tabsetId: tabsStore.currentTabsetId,
      fromPanel: true
    }
  })
}

const cloudIconColor = () => {
  return useUiStore().sidePanel.activeView?.ident === SidePanelView.PUBLIC_TABSETS.ident ? 'warning' : 'primary'
}

const titleForSpaces = () => {
  if (props.title && props.forceTitle) {
    return props.title
  }
  return useSpacesStore().space ? useSpacesStore().space.label : 'no space selected'
}
</script>
