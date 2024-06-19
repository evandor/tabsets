<template>
  <q-toolbar class="text-primary q-pa-none q-pl-sm q-pr-xs q-pb-none greyBorderBottom" :style="offsetTop()">
    <q-toolbar-title>
      <div class="row q-ma-none q-pa-none">

        <!-- we have spaces -->
        <div v-if="useFeaturesStore().hasFeature(FeatureIdent.SPACES)" class="col-6 q-ma-none q-pa-none">

          <!-- spaces and no back button -->

          <SearchWithTransitionHelper v-if="searching"/>

          <FilterWithTransitionHelper v-else-if="showFilter"/>

          <template v-else>
            <div class="column q-ma-none q-pa-none">
              <div class="col q-ma-none q-pa-none cursor-pointer text-subtitle1">
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

          <FilterWithTransitionHelper v-else-if="showFilter"/>
          <!-- no spaces && not searching -->
          <template v-else>

            <!-- no spaces && not searching -->
            <div class="col-12 text-subtitle1">
              <slot name="title">{{ props.title }}</slot>
            </div>

          </template>
        </div>

        <!-- spaces or not, here's the icons on the right side -->
        <div class="col text-subtitle1 text-right q-ma-none q-pa-none q-pr-sm" v-if="!useUiStore().appLoading">

          <slot name="iconsRight">

            <SidePanelToolbarButton
              v-if="showToggleSessionIcon()"
              :color="existingSession ? (useTabsetsStore().getCurrentTabset?.type === TabsetType.SESSION ? 'red':'grey-5') :'black'"
              :icon="existingSession ? 'o_stop_circle':'o_play_circle'"
              @click="toggleSessionState"
              :tooltip="existingSession ? 'Stop Session' : 'Start new Session'"/>

            <template v-if="showSearchIcon()">
              <SidePanelToolbarButton icon="search"
                                      id="toggleSearchBtn"
                                      size="11px"
                                      @click="toggleSearch"/>
              <span class="q-ma-none q-pa-none q-mx-sm text-grey-5">|</span>
            </template>

            <SidePanelToolbarTabNavigationHelper/>

            <!--            <SidePanelToolbarButton-->
            <!--              v-if="showSyncInfo()"-->
            <!--              icon="o_sync_alt"-->
            <!--              tooltip="This account is being synced"-->
            <!--              :color="useUiStore().syncing ? 'green':'grey'"-->
            <!--              size="9px"-->
            <!--              class="q-ml-sm q-mr-sm"/>-->

            <SidePanelToolbarButton
              v-if="useTabsetsUiStore().matchingTabs.length > 0 && useTabsetsUiStore().matchingTabs[0].tabsetId !== useTabsetsStore().currentTabsetId"
              icon="system_update_alt"
              :tooltip="`open current tab (${useTabsetsUiStore().matchingTabs[0].tab.url}) in tabset(s)`"
              :color="useUiStore().syncing ? 'green':'grey'"
              size="9px"
              @click="selectTabsetForFirstMatchingTab(useTabsetsUiStore().matchingTabs[0] as TabAndTabsetId)"
              class="q-ml-sm q-mr-sm"/>

            <!--            <SidePanelToolbarButton-->
            <!--              icon="o_add_circle"-->
            <!--              :tooltip="newTabsetTooltip()"-->
            <!--              color="warning"-->
            <!--              class="q-ml-sm"-->
            <!--              :class="{ shake: annimateNewTabsetButton }"-->
            <!--              data-testid="addTabsetBtn"-->
            <!--              @click="openNewTabsetDialog()"/>-->

            <q-btn outline
                   label="New Tabset"
                   color="primary"
                   size="sm"
                   :class="{ shake: annimateNewTabsetButton }"
                   data-testid="addTabsetBtn"
                   @click="openNewTabsetDialog()"
                   class="q-ma-none q-px-sm q-py-none"
                   name="o_bookmark_add"/>

          </slot>
        </div>
      </div>
    </q-toolbar-title>
  </q-toolbar>
</template>

<script lang="ts" setup>

import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/FeatureIdent";
import {useSpacesStore} from "src/spaces/stores/spacesStore";
import {useRouter} from "vue-router";
import {ref, watchEffect} from "vue";
import {useUiStore} from "src/ui/stores/uiStore";
import NewTabsetDialog from "src/tabsets/dialogues/NewTabsetDialog.vue";
import {TabsetType} from "src/tabsets/models/Tabset";
import NewSessionDialog from "components/dialogues/NewSessionDialog.vue";
import SearchWithTransitionHelper from "pages/sidepanel/helper/SearchWithTransitionHelper.vue";
import SidePanelToolbarTabNavigationHelper from "src/opentabs/pages/SidePanelToolbarTabNavigationHelper.vue";
import FilterWithTransitionHelper from "pages/sidepanel/helper/FilterWithTransitionHelper.vue";
import SidePanelToolbarButton from "src/core/components/SidePanelToolbarButton.vue";
import {useQuasar} from "quasar";
import {useI18n} from 'vue-i18n'
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {useTabsStore2} from "src/tabsets/stores/tabsStore2";
import {useFeaturesStore} from "src/features/stores/featuresStore";
import {SidePanelViews} from "src/models/SidePanelViews";
import {useTabsetsUiStore} from "src/tabsets/stores/tabsetsUiStore";
import {TabAndTabsetId} from "src/tabsets/models/TabAndTabsetId";

const {t} = useI18n({useScope: 'global'})

const props = defineProps({
  title: {type: String, default: "My Tabsets"},
  forceTitle: {type: Boolean, default: false},
  showSearchBox: {type: Boolean, default: false},
  searchTerm: {type: String, default: ''},
  searchHits: {type: Number, required: false}
})

const $q = useQuasar()
const router = useRouter()
const permissionsStore = usePermissionsStore()

const searching = ref(false)
const existingSession = ref(false)
const showFilter = ref(false)
const windowLocation = ref('')
const annimateNewTabsetButton = ref(false)

const toggleSearch = () => {
  searching.value = !searching.value
  if (searching.value) {
    router.push("/sidepanel/search")
  } else {
    router.push("/sidepanel")
  }
}

windowLocation.value = window.location.href

watchEffect(() => {
  annimateNewTabsetButton.value = useUiStore().animateNewTabsetButton
})

watchEffect(() => {
  if (props.showSearchBox && !searching.value) {
    searching.value = true
  }
})

watchEffect(() => {
  showFilter.value = useUiStore().sidePanelActiveViewIs(SidePanelViews.TABS_LIST) &&
    useUiStore().toolbarFilter
})

if ($q.platform.is.chrome && $q.platform.is.bex) {
  chrome.commands.onCommand.addListener((command) => {
    if (command === 'search') {
      console.debug(`got Command: ${command}`);
      toggleSearch()
    }
  })
}

const toggleSessionState = () => existingSession ? stopSession() : startSession()

const startSession = () => $q.dialog({
  component: NewSessionDialog,
  componentProps: {replaceSession: false, inSidePanel: true}
})

// const stopSession = () => {
//   const tabsetWithSession = _.filter([...useTabsetsStore().tabsets.values()], (ts: Tabset) => ts.type === TabsetType.SESSION)
//   console.log("tabsetWithSession", tabsetWithSession)
//   if (tabsetWithSession && tabsetWithSession.length > 0) { // should be one at most
//     useCommandExecutor().executeFromUi(new StopSessionCommand(tabsetWithSession[0]))
//   }
// }

const webClipActive = () => useTabsStore2().currentChromeTab

const showSearchIcon = () => useTabsetsStore().tabsets.size > 1

const showToggleSessionIcon = () =>
  useUiStore().sidePanelActiveViewIs(SidePanelViews.MAIN) &&
  useFeaturesStore().hasFeature(FeatureIdent.SESSIONS) &&
  !searching.value

const openNewTabsetDialog = () => {
  $q.dialog({
    component: NewTabsetDialog,
    componentProps: {
      tabsetId: useTabsetsStore().getCurrentTabset?.id,
      spaceId: useSpacesStore().space?.id,
      fromPanel: true
    }
  })
}

const showSyncInfo = () => {
  return false
}

const selectTabsetForFirstMatchingTab = (tabAndTabsetId: TabAndTabsetId) => {
  useTabsetsStore().selectCurrentTabset(tabAndTabsetId.tabsetId)
}

const offsetTop = () => ($q.platform.is.capacitor || $q.platform.is.cordova) ? 'margin-top:40px;' : ''

const syncButtonClicked = () => {
  if (!useUiStore().fcmSupported) {
    console.debug("[service-worker] requesting permission2...")
    Notification.requestPermission().then((permission) => {
      console.log("got", permission)
      if (permission === 'granted') {
        console.log('Notification permission granted.');
      }
    }).catch((err) => console.log("err", err))
  }
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
