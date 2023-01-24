<template>
  <DrawerLeftTabs />

</template>

<script lang="ts" setup>
import {ref, watch, watchEffect} from "vue";
import {useRouter} from "vue-router";
import {useFeatureTogglesStore} from "stores/featureTogglesStore";
import {useTabsStore} from "stores/tabsStore";
import {useSettingsStore} from "stores/settingsStore";
import {useUiService} from "src/services/useUiService";
import {DrawerTabs} from "stores/uiStore";
import MHtmlService from "src/services/MHtmlService";
import {MHtml} from "src/models/MHtml";
import DrawerLeftTabs from "src/components/DrawerLeftTabs.vue"

const router = useRouter()

const featureToggles = useFeatureTogglesStore()
const tabsStore = useTabsStore()
const settingsStore = useSettingsStore()

const uiService = useUiService()

const openTabsCountRatio = ref(0)
const tab = ref<DrawerTabs>(uiService.leftDrawerActiveTab())
const rssTabsCount = ref(0)
const savedTabsCount = ref(0)

watchEffect(() => {
  //tab.value = useNotificationsStore().showOpenTabs ? 'openTabs' : 'bookmarks'
})

watchEffect(() => {
  openTabsCountRatio.value = Math.min(tabsStore.tabs.length / settingsStore.thresholds['max' as keyof object], 1)
})

watchEffect(() => rssTabsCount.value = tabsStore.rssTabs?.length)

// watchEffect(() => {

MHtmlService.getMHtmls()
  .then((res: MHtml[]) => {
    savedTabsCount.value = res.length
  })
// })


watch(() => tab.value, (currentValue, oldValue) => {
  console.log("selected", tab.value, currentValue, oldValue)
  uiService.leftDrawerSetActiveTab(currentValue)
})

</script>
