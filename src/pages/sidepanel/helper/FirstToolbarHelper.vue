<template>
  <q-toolbar class="text-primary q-pa-none q-pl-sm q-pr-xs q-pb-none greyBorderBottom">
    <q-toolbar-title>
      <div class="row q-ma-none q-pa-none">

        <!-- we have spaces -->
        <div v-if="usePermissionsStore().hasFeature(FeatureIdent.SPACES)" class="col-6 q-ma-none q-pa-none">

          <!-- spaces and no back button -->

          <SearchWithTransitionHelper v-if="searching"/>

          <template v-else>
            <div class="column q-ma-none q-pa-none">
              <!-- @click.stop="router.push('/sidepanel/spaces')" -->
              <div class="col q-ma-none q-pa-none cursor-pointer text-black text-subtitle1">
                <slot name="title">{{ props.title }}</slot>
              </div>
            </div>
          </template>
        </div>

        <!-- no spaces here -->
        <div v-else class="col q-ma-none q-pa-none">

          <!-- no spaces && searching -->
          <SearchWithTransitionHelper v-if="searching"
                                      :search-term="props.searchTerm"
                                      :search-hits="props.searchHits"/>

          <!-- no spaces && not searching -->
          <template v-else>

            <!-- no spaces && not searching -->
            <div class="col-12 text-black text-subtitle1">
              <slot name="title">{{ props.title }}</slot>
            </div>

          </template>
        </div>

        <!-- spaces or not, here's the icons on the right side -->
        <div class="col text-subtitle1 text-right q-ma-none q-pa-none q-pr-sm">

          <slot name="iconsRight">

            <ToolbarButton
                v-if="showToggleSessionIcon()"
                :color="existingSession ? (tabsStore.getCurrentTabset?.type === TabsetType.SESSION ? 'red':'grey-5') :'black'"
                :icon="existingSession ? 'o_stop_circle':'o_play_circle'"
                @click="toggleSessionState"
                :tooltip="existingSession ? 'Stop Session' : 'Start new Session'"/>

            <!--            <template v-if="showCreateClipButton()">-->
            <!--              <q-btn-->
            <!--                  icon="filter_center_focus"-->
            <!--                  color="black"-->
            <!--                  flat-->
            <!--                  class="q-ma-none q-pa-xs cursor-pointer"-->
            <!--                  style="max-width:20px"-->
            <!--                  size="10px"-->
            <!--                  @click="createClip">-->
            <!--                <q-tooltip class="tooltip">{{ createWebsiteClipTooltip() }}</q-tooltip>-->
            <!--              </q-btn>-->
            <!--              <span class="q-ma-none q-pa-none q-mx-sm text-grey-5">|</span>-->
            <!--            </template>-->

            <!--            <ToolbarButton-->
            <!--                v-if="showCreateClipButtonInActive()"-->
            <!--                icon="filter_center_focus"-->
            <!--                color="grey-5"-->
            <!--                tooltip="cannot create web clip for this tab" />-->

            <template v-if="showSearchIcon()">
              <q-btn
                  id="toggleSearchBtn"
                  icon="search"
                  color="black"
                  flat
                  class="q-ma-none q-pa-xs cursor-pointer"
                  style="max-width:20px"
                  size="11px"
                  @click="toggleSearch">
              </q-btn>
              <span class="q-ma-none q-pa-none q-mx-sm text-grey-5">|</span>
            </template>

            <SidePanelToolbarTabNavigationHelper/>

            <ToolbarButton
                icon="o_add_circle"
                :tooltip="newTabsetTooltip()"
                color="warning"
                data-testid="addTabsetBtn"
                @click="openNewTabsetDialog()"/>

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
import {useTabsStore} from "stores/tabsStore";
import {useRouter} from "vue-router";
import {ref, watchEffect} from "vue";
import {SidePanelView, useUiStore} from "stores/uiStore";
import NewTabsetDialog from "components/dialogues/NewTabsetDialog.vue";
import {useQuasar} from "quasar";
import {Tabset, TabsetType} from "src/models/Tabset";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {ToggleSortingCommand} from "src/domain/tabsets/ToggleSorting";
import NewSessionDialog from "components/dialogues/NewSessionDialog.vue";
import _ from "lodash";
import {StopSessionCommand} from "src/domain/commands/StopSessionCommand";
import ChromeApi from "src/services/ChromeApi";
import SearchWithTransitionHelper from "pages/sidepanel/helper/SearchWithTransitionHelper.vue";
import {useWindowsStore} from "../../../stores/windowsStore";
import NavigationService from "src/services/NavigationService";
import ToolbarButtons from "components/buttons/ToolbarButtons.vue";
import ToolbarButton from "components/buttons/ToolbarButton.vue";
import SidePanelToolbarTabNavigationHelper from "pages/sidepanel/helper/SidePanelToolbarTabNavigationHelper.vue";

const props = defineProps({
  title: {type: String, default: "My Tabsets"},
  forceTitle: {type: Boolean, default: false},
  showSearchBox: {type: Boolean, default: false},
  searchTerm: {type: String, default: ''},
  searchHits: {type: Number, required: false}
})

const emits = defineEmits(['wasClicked'])

const $q = useQuasar()
const router = useRouter()
const tabsStore = useTabsStore()

const searching = ref(false)
const existingSession = ref(false)

const toggleSearch = () => {
  searching.value = !searching.value
  if (searching.value) {
    // comment out for old search approach (plus SearchWidget2 -> SearchWidget)
    router.push("/sidepanel/search")
  }
}

watchEffect(() => {
  if (props.showSearchBox && !searching.value) {
    searching.value = true
  }
})

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

const createWebsiteClipTooltip = () => {
  const windowId = useWindowsStore().currentWindow.id || 0
  const currentChromeTab = useTabsStore().getCurrentChromeTab(windowId) || useTabsStore().currentChromeTab
  return "Create Website Clip for tab " + currentChromeTab.url
}

const webClipActive = () => tabsStore.currentChromeTab

const createClip = () => {
  const windowId = useWindowsStore().currentWindow.id || 0
  const currentChromeTab = useTabsStore().getCurrentChromeTab(windowId) || useTabsStore().currentChromeTab
  if (currentChromeTab && currentChromeTab.id) {
    ChromeApi.executeClippingJS(currentChromeTab.id)
  }
}

const showSearchIcon = () => tabsStore.tabsets.size > 1

const showToggleSessionIcon = () =>
    useUiStore().sidePanelActiveViewIs(SidePanelView.MAIN) &&
    usePermissionsStore().hasFeature(FeatureIdent.SESSIONS) &&
    !searching.value

const showCreateClipButton = () =>
    useUiStore().sidePanelActiveViewIs(SidePanelView.MAIN) &&
    usePermissionsStore().hasFeature(FeatureIdent.WEBSITE_CLIP) && webClipActive() &&
    !searching.value

const showCreateClipButtonInActive = () =>
    useUiStore().sidePanelActiveViewIs(SidePanelView.MAIN) &&
    usePermissionsStore().hasFeature(FeatureIdent.WEBSITE_CLIP) && !webClipActive() &&
    !searching.value

const newTabsetTooltip = () =>
    usePermissionsStore().hasFeature(FeatureIdent.SPACES) ?
        (useSpacesStore().space ? 'Add new Tabset in this space' : 'Add new unassigned Tabset') :
        'Add new Tabset'

const openNewTabsetDialog = () => {
  $q.dialog({
    component: NewTabsetDialog,
    componentProps: {
      tabsetId: tabsStore.currentTabsetId,
      spaceId: useSpacesStore().space?.id,
      fromPanel: true
    }
  })
}

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
