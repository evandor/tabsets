<template>
  <!-- FirstToolbarHelper -->
  <q-toolbar class="text-primary q-pa-none q-pl-sm q-pr-xs q-pb-none greyBorderBottom" :style="offsetTop()">
    <q-toolbar-title>
      <div class="row q-ma-none q-pa-none">

        <!-- we have spaces -->
        <div v-if="useFeaturesStore().hasFeature(FeatureIdent.SPACES)" class="col-5 q-ma-none q-pa-none">

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
        <div v-else class="col-5 q-ma-none q-pa-none">

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
        <div class="col-7 text-subtitle1 text-right q-ma-none q-pa-none q-pr-sm" v-if="!useUiStore().appLoading">

          <slot name="iconsRight">

            <!--            <SidePanelToolbarButton-->
            <!--              v-if="showToggleSessionIcon()"-->
            <!--              :color="existingSession ? (useTabsetsStore().getCurrentTabset?.type === TabsetType.SESSION ? 'red':'grey-5') :'black'"-->
            <!--              :icon="existingSession ? 'o_stop_circle':'o_play_circle'"-->
            <!--              @click="toggleSessionState"-->
            <!--              :tooltip="existingSession ? 'Stop Session' : 'Start new Session'"/>-->

            <template v-if="showSearchIcon()">
              <SidePanelToolbarButton icon="search"
                                      class="q-mr-sm"
                                      id="toggleSearchBtn"
                                      size="11px"
                                      @click="toggleSearch"/>
            </template>

            <SidePanelToolbarTabNavigationHelper/>

            <SidePanelToolbarButton
              v-if="useTabsetsUiStore().matchingTabs.length > 0 && useTabsetsUiStore().matchingTabs[0].tabsetId !== useTabsetsStore().currentTabsetId"
              icon="link"
              :tooltip="`open current tab (${useTabsetsUiStore().matchingTabs[0].tab.url}) in tabset(s)`"
              color="green"
              size="11px"
              @click="selectTabsetForFirstMatchingTab(useTabsetsUiStore().matchingTabs[0] as TabAndTabsetId)"
              class="q-ma-none q-pa-none q-mr-none"/>

            <q-btn outline dense
                   icon="add"
                   label="Collection"
                   color="primary"
                   size="sm"
                   :class="{ shake: annimateNewTabsetButton }"
                   data-testid="addTabsetBtn"
                   @click="openNewTabsetDialog()"
                   class="q-ma-none q-pl-xs q-pr-sm q-py-xs"
                   name="o_bookmark_add"/>

          </slot>
        </div>
      </div>
    </q-toolbar-title>
  </q-toolbar>
</template>

<script lang="ts" setup>

import {FeatureIdent} from "src/app/models/FeatureIdent";
import {useSpacesStore} from "src/spaces/stores/spacesStore";
import {useRouter} from "vue-router";
import {ref, watchEffect} from "vue";
import {useUiStore} from "src/ui/stores/uiStore";
import NewTabsetDialog from "src/tabsets/dialogues/NewTabsetDialog.vue";
import SearchWithTransitionHelper from "pages/sidepanel/helper/SearchWithTransitionHelper.vue";
import SidePanelToolbarTabNavigationHelper from "src/opentabs/pages/SidePanelToolbarTabNavigationHelper.vue";
import SidePanelToolbarButton from "src/core/components/SidePanelToolbarButton.vue";
import {useQuasar} from "quasar";
import {useI18n} from 'vue-i18n'
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {useFeaturesStore} from "src/features/stores/featuresStore";
import {SidePanelViews} from "src/models/SidePanelViews";
import {useTabsetsUiStore} from "src/tabsets/stores/tabsetsUiStore";
import {TabAndTabsetId} from "src/tabsets/models/TabAndTabsetId";
import FilterWithTransitionHelper from "src/core/widget/FilterWithTransitionHelper.vue";

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

const searching = ref(false)
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

const selectTabsetForFirstMatchingTab = (tabAndTabsetId: TabAndTabsetId) => {
  useTabsetsStore().selectCurrentTabset(tabAndTabsetId.tabsetId)
}

const offsetTop = () => ($q.platform.is.capacitor || $q.platform.is.cordova) ? 'margin-top:40px;' : ''

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
