<template>
  <q-toolbar class="text-primary q-pa-none q-pl-sm q-pr-xs q-pb-none">
    <q-toolbar-title>
      <div class="row q-ma-none q-pa-none">

        <!-- we have spaces -->
        <div v-if="usePermissionsStore().hasFeature(FeatureIdent.SPACES)"
             class="col-8 q-ma-none q-pa-none">
          <template v-if="!props.showBackButton">

            <SearchWithTransitionHelper v-if="searching"/>

            <template v-else>
              <div class="column q-ma-none q-pa-none">
                <div class="col q-ma-none q-pa-none cursor-pointer text-black text-subtitle1"
                     @click.stop="router.push('/sidepanel/spaces')">

                  <slot name="title">{{ props.title }}</slot>

                </div>
              </div>
            </template>
          </template>

          <template v-else>
            <template v-if="searching">
              <SearchWithTransitionHelper/>
            </template>
            <template v-else>
              <div class="row">
                <div class="col-12 text-black text-subtitle1">
                  <q-icon
                    size="18px" color="primary"
                    name="chevron_left" class="cursor-pointer"
                    @click.stop="emits('wasClicked')">
                    <q-tooltip>Back</q-tooltip>
                  </q-icon>

                  <slot name="title">{{ props.title }}</slot>

                </div>
              </div>
            </template>
          </template>
        </div>

        <!-- no spaces here -->
        <div v-else class="col-8 q-ma-none q-pa-none">

          <!-- no spaces && searching -->
          <SearchWithTransitionHelper v-if="searching"/>

          <!-- no spaces && not searching -->
          <template v-else>

            <!-- no spaces && not searching && showBackButton -->
            <div class="row" v-if="props.showBackButton">
              <div class="col-12 text-black text-subtitle1">
                <q-icon
                  size="18px" color="primary"
                  name="chevron_left" class="cursor-pointer"
                  @click.stop="emits('wasClicked')">
                  <q-tooltip>Back</q-tooltip>
                </q-icon>

                <slot name="title">{{ props.title }}</slot>

              </div>
            </div>

            <!-- no spaces && not searching && not showBackButton -->
            <div v-else class="col q-ml-none text-black text-subtitle1">
              <slot name="title">{{ props.title }}</slot>
            </div>


          </template>
        </div>

        <!-- spaces or not, here's the icons on the right side -->
        <div class="col-4 text-right q-pr-sm">

          <slot name="iconsRight">
            <q-btn v-if="showSearchIcon()"
                   id="toggleSearchBtn"
                   icon="search"
                   flat
                   class="q-ma-none q-pa-xs cursor-pointer"
                   style="max-width:20px"
                   size="11px"
                   @click="toggleSearch">
              <q-tooltip class="tooltip">Search</q-tooltip>
            </q-btn>

            <q-btn
              v-if="showFilterIcon()"
              flat
              class="q-ma-none q-pa-xs cursor-pointer"
              style="width:20px;max-width:220px"
              size="11px"
              :text-color="useUiStore().tabsFilter ? 'warning' : 'primary'"
              :disable="tabsStore.getCurrentTabset?.type === TabsetType.DYNAMIC"
              icon="o_filter_alt">
              <q-popup-edit
                ref="popupEditRef"
                :model-value="useUiStore().tabsFilter" v-slot="scope"
                @save="(val, initial)=> setFilter(val)"
                @update:model-value="val => setFilter(  val)">
                <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set">
                  <template v-slot:append>
                    <q-icon class="cursor-pointer" name="clear" @click="clearFilter()" size="xs"/>
                  </template>
                </q-input>
              </q-popup-edit>
              <q-tooltip
                class="tooltip"
                :delay="200"
                anchor="center left" self="center right">
                {{ useUiStore().tabsFilter ? 'Filtering for "' + useUiStore().tabsFilter + '"' : 'Filter this tabset' }}
              </q-tooltip>
            </q-btn>

            <q-btn v-if="showSortIcon()"
                   flat
                   size="10px"
                   class="q-ma-none q-pa-xs cursor-pointer"
                   style="max-width:20px"
                   text-color="primary"
                   @click="toggleSorting()"
                   outline
                   icon="o_sort">
              <q-tooltip class="tooltip">Toggle through sorting</q-tooltip>
            </q-btn>

            <q-btn
              v-if="showToggleSessionIcon()"
              flat
              style="max-width:20px"
              size="10px"
              class="q-ma-none q-pa-xs cursor-pointer"
              :color="existingSession ? (tabsStore.getCurrentTabset?.type === TabsetType.SESSION ? 'red':'grey-5') :'primary'"
              :icon="existingSession ? 'o_stop_circle':'o_play_circle'"
              @click="toggleSessionState">
              <q-tooltip class="tooltip" v-if="existingSession">Stop Session</q-tooltip>
              <q-tooltip class="tooltip" v-else>Start new Session</q-tooltip>
            </q-btn>

            <q-btn
              v-if="useUiStore().sidePanelActiveViewIs(SidePanelView.MAIN) && usePermissionsStore().hasFeature(FeatureIdent.WEBSITE_CLIP) && webClipActive()"
              icon="filter_center_focus"
              flat
              class="q-ma-none q-pa-xs cursor-pointer"
              style="max-width:20px"
              size="10px"
              @click="createClip">
              <q-tooltip class="tooltip">{{ createWebsiteClipTooltip() }}</q-tooltip>
            </q-btn>
            <q-btn
              v-if="useUiStore().sidePanelActiveViewIs(SidePanelView.MAIN) && usePermissionsStore().hasFeature(FeatureIdent.WEBSITE_CLIP) && !webClipActive()"
              icon="filter_center_focus"
              color="grey-5"
              flat
              class="q-ma-none q-pa-xs cursor-pointer"
              style="max-width:20px"
              size="10px">
              <q-tooltip class="tooltip">cannot create web clip for this tab</q-tooltip>
            </q-btn>
          </slot>
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
import {ref, watchEffect} from "vue";
import NavigationService from "src/services/NavigationService";
import {SidePanelView, useUiStore} from "stores/uiStore";
import NewTabsetDialog from "components/dialogues/NewTabsetDialog.vue";
import {QInput, QPopupEdit, useQuasar} from "quasar";
import {Tabset, TabsetType} from "src/models/Tabset";
import JsUtils from "src/utils/JsUtils";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {ToggleSortingCommand} from "src/domain/tabsets/ToggleSorting";
import NewSessionDialog from "components/dialogues/NewSessionDialog.vue";
import _ from "lodash";
import {StopSessionCommand} from "src/domain/commands/StopSessionCommand";
import ChromeApi from "src/services/ChromeApi";
import SearchWithTransitionHelper from "pages/sidepanel/helper/SearchWithTransitionHelper.vue";

const props = defineProps({
  title: {type: String, default: "My Tabsets"},
  forceTitle: {type: Boolean, default: false},
  showBackButton: {type: Boolean, default: false},
  showSearchBox: {type: Boolean, default: false}
})

const emits = defineEmits(['wasClicked'])


const $q = useQuasar()
const router = useRouter()
const tabsStore = useTabsStore()

const searching = ref(false)
const popupEditRef = ref<QPopupEdit>()
const existingSession = ref(false)

const toggleSearch = () => searching.value = !searching.value

watchEffect(() => {
  if (props.showSearchBox && !searching.value) {
    searching.value = true
  }
})

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

const cloudIconColor = () => {
  return useUiStore().sidePanel.activeView?.ident === SidePanelView.PUBLIC_TABSETS.ident ? 'warning' : 'primary'
}

const titleForSpaces = () => {
  if (props.title && props.forceTitle) {
    return props.title
  }
  return useSpacesStore().space ? useSpacesStore().space.label : 'no space selected'
}

const setFilter = (newValue: string) => {
  console.log("filtering tabs", newValue)
  const useValue = newValue && newValue.trim().length > 0 ? newValue.trim() : undefined
  useUiStore().tabsFilter = useValue
  useUiStore().setHighlightTerm(useValue)
  JsUtils.runCssHighlight()
}

const clearFilter = () => {
  useUiStore().tabsFilter = undefined
  popupEditRef.value?.set()
  useUiStore().setHighlightTerm(undefined)
  JsUtils.runCssHighlight()
}

const toggleSorting = () => useCommandExecutor().executeFromUi(new ToggleSortingCommand(tabsStore.currentTabsetId))

const toggleSessionState = () => existingSession ? stopSession() : startSession()

const startSession = () => $q.dialog({
  component: NewSessionDialog,
  componentProps: {replaceSession: false, inSidePanel: true}
})

const stopSession = () => {
  const tabsetWithSession = _.filter([...tabsStore.tabsets.values()], (ts: Tabset) => ts.type === TabsetType.SESSION)
  console.log("tabsetWithSession", tabsetWithSession)
  if (tabsetWithSession && tabsetWithSession.length > 0) { // should be one at most
    useCommandExecutor().executeFromUi(new StopSessionCommand(tabsetWithSession[0]))
  }
}

const createWebsiteClipTooltip = () => "Create Website Clip for tab " + tabsStore.currentChromeTab?.url

const webClipActive = () => tabsStore.currentChromeTab

const createClip = () => {
  if (tabsStore.currentChromeTab.id) {
    ChromeApi.executeClippingJS(tabsStore.currentChromeTab.id)
  }
}

const showSortIcon = () => useUiStore().sidePanelActiveViewIs(SidePanelView.MAIN) &&
  !props.showBackButton &&
  tabsStore.getCurrentTabs.length > 3 &&
  useUiStore().tabsetsExpanded

const showFilterIcon = () => !props.showBackButton &&
  useUiStore().sidePanelActiveViewIs(SidePanelView.MAIN) &&
  tabsStore.tabsets.size > 1 &&
  useUiStore().tabsetsExpanded

const showSearchIcon = () => !props.showBackButton && tabsStore.tabsets.size > 1

const showToggleSessionIcon = () => !props.showBackButton &&
  useUiStore().sidePanelActiveViewIs(SidePanelView.MAIN) &&
  usePermissionsStore().hasFeature(FeatureIdent.SESSIONS)

</script>

<style scoped>

.v-enter-active,
.v-leave-active {
  transition: opacity 3.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
