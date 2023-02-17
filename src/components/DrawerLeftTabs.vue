<template>

  <q-tabs
    v-model="tab"
    vertical
    active-color="primary"
    class="text-grey-9 q-mt-none q-mx-none greyBorderTopRight">

    <Transition name="colorized-appear">
      <q-tab name="bookmarks" icon="o_bookmarks"
             v-if="permissionsStore.hasFeature(FeatureIdent.BOOKMARKS)"
             @click="tabsClicked(DrawerTabs.BOOKMARKS)">
        <q-tooltip class="tooltip">Your bookmarks</q-tooltip>
      </q-tab>
    </Transition>

    <q-tab v-if="inBexMode()"
           name="openTabs" icon="o_table_rows" @click="tabsClicked(DrawerTabs.OPEN_TABS)">
      <q-badge v-if="badgeThreshold()"
               floating
               text-color="white"
               :style="thresholdStyle()">{{ tabsStore.tabs.length }}
      </q-badge>
      <q-tooltip class="tooltip">Your open tabs</q-tooltip>
    </q-tab>

    <q-tab v-if="tabsStore.pendingTabset?.tabs.length > 0"
           name="unassignedTabs" icon="o_fiber_new"

           @click="tabsClicked(DrawerTabs.UNASSIGNED_TABS)">
      <q-badge v-if="badgeThreshold()"
               floating
               style="right:-2px"
               color="secondary">{{ tabsStore.pendingTabset?.tabs.length }}
      </q-badge>
      <q-tooltip class="tooltip">Your unassigned tabs</q-tooltip>
    </q-tab>

    <Transition name="colorized-appear">
      <q-tab
        v-if="permissionsStore.hasFeature(FeatureIdent.GROUP_BY_DOMAIN)"
        name="groupedByHostTabs" icon="o_dns" @click="tabsClicked(DrawerTabs.GROUP_BY_HOST_TABS)">
        <q-tooltip class="tooltip" anchor="center right" self="center left" :delay="200">Your tabs grouped by host, if
          there are at least two tabs
        </q-tooltip>
      </q-tab>
    </Transition>

    <q-tab v-if="savedTabsCount > 0"
           name="savedTabs" icon="o_save" @click="tabsClicked(DrawerTabs.SAVED_TABS)">
      <q-tooltip class="tooltip" anchor="center right" self="center left" :delay="200">Your saved tabs</q-tooltip>
    </q-tab>

    <Transition name="colorized-appear">
      <q-tab v-if="permissionsStore.hasFeature(FeatureIdent.SIDEBAR)"
             name="sidebar" icon="o_input" @click="tabsClicked(DrawerTabs.SIDEBAR)">
        <q-tooltip class="tooltip" anchor="center right" self="center left" :delay="200">Your current tabset as
          'sidebar'
        </q-tooltip>
      </q-tab>
    </Transition>

    <q-tab v-if="rssTabsCount > 0"
           name="rss" icon="o_rss_feed" @click="tabsClicked(DrawerTabs.RSS)">
      <q-tooltip class="tooltip" anchor="center right" self="center left" :delay="200">RSS Feeds</q-tooltip>
    </q-tab>

<!--    <Transition name="colorized-appear">-->
<!--      <q-tab-->
<!--        v-if="permissionsStore.hasFeature('scheduled')"-->
<!--        name="scheduled" icon="o_update" @click="tabsClicked(DrawerTabs.SCHEDULED)">-->
<!--        <q-tooltip class="tooltip" anchor="center right" self="center left" :delay="200">Scheduled Tabs</q-tooltip>-->
<!--      </q-tab>-->
<!--    </Transition>-->

<!--    <Transition name="colorized-appear">-->
<!--      <q-tab v-if="permissionsStore.hasFeature('history')"-->
<!--             name="history" icon="o_history" @click="tabsClicked(DrawerTabs.HISTORY)">-->
<!--        <q-tooltip class="tooltip" anchor="center right" self="center left" :delay="200">Browser History</q-tooltip>-->
<!--      </q-tab>-->
<!--    </Transition>-->

    <q-tab
      name="features" icon="o_more_horiz" @click="tabsClicked(DrawerTabs.FEATURES)">
      <q-tooltip class="tooltip" anchor="center right" self="center left" :delay="200">Additional Features</q-tooltip>
    </q-tab>

    <q-tab
      name="help" icon="help" @click="tabsClicked(DrawerTabs.HELP)">
      <q-tooltip class="tooltip" anchor="center right" self="center left" :delay="200">Help</q-tooltip>
    </q-tab>

  </q-tabs>


</template>

<script lang="ts" setup>
import {ref, watch, watchEffect} from "vue";
import {useRouter} from "vue-router";
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import {useTabsStore} from "src/stores/tabsStore";
import {useSettingsStore} from "src/stores/settingsStore";
import {DrawerTabs} from "src/stores/uiStore";
import {useUiService} from "src/services/useUiService";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {useUtils} from "src/services/Utils";
import {MHtml} from "src/models/MHtml";
import MHtmlService from "src/services/MHtmlService";
import {FeatureIdent} from "src/models/AppFeatures";

const router = useRouter()

const uiService = useUiService()

const featureToggles = useFeatureTogglesStore()
const tabsStore = useTabsStore()
const settingsStore = useSettingsStore()
const permissionsStore = usePermissionsStore()

const openTabsCountRatio = ref(0)
const tab = ref<DrawerTabs>(uiService.leftDrawerActiveTab())
const rssTabsCount = ref(0)
const savedTabsCount = ref(0)

const {formatDate, inBexMode} = useUtils()

watch(() => tab.value, (currentValue) => {
  uiService.leftDrawerSetActiveTab(currentValue)
})

watchEffect(() => {
  openTabsCountRatio.value = Math.min(tabsStore.tabs.length / settingsStore.thresholds['max' as keyof object], 1)
})

watchEffect(() => rssTabsCount.value = tabsStore.rssTabs?.length)

watchEffect(() => {

  MHtmlService.getMHtmls()
    .then((res: MHtml[]) => {
      savedTabsCount.value = res.length
    })
})

const tabsClicked = (tab: DrawerTabs) => {
  // console.log("tabsClicked", tab)
  uiService.leftDrawerSetActiveTab(tab)
}

const thresholdStyle = () =>
  "background-color: hsl(" + (120 - Math.round(120 * openTabsCountRatio.value)) + " 80% 50%); right:-2px"

const badgeThreshold = () => tabsStore.tabs.length >= settingsStore.thresholds['min' as keyof object]

</script>

<style lang="sass" scoped>

.greyBorderTopRight
  border-top: 1px solid $bordergrey
  border-right: 1px solid $bordergrey

</style>
