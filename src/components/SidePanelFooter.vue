<template>

  <q-footer elevated class="bg-grey-8 text-white q-pa-xs">
    <div class="row fit">
      <div class="col-5">
        <q-btn icon="o_label"
               v-if="usePermissionsStore().hasFeature(FeatureIdent.TAGS)"
               class="q-my-xs q-mx-sm"
               style="width:20px"
               color="primary"
               size="10px"
               @click="openTagsList()">
          <q-tooltip>List of all tags sorted by prevalence</q-tooltip>
        </q-btn>
        <q-btn icon="o_dns"
               v-if="usePermissionsStore().hasFeature(FeatureIdent.GROUP_BY_DOMAIN)"
               class="q-my-xs q-mx-sm"
               style="width:20px"
               color="primary"
               size="10px"
               @click="openGroupedByDomain()">
          <q-tooltip>List all your tabs URLs by domain</q-tooltip>
        </q-btn>
      </div>
      <div class="col-7 text-right">
        <q-btn icon="crop_7_5"
               class="q-my-xs q-mx-none"
               style="width:20px"
               color="primary"
               :outline="useUiStore().listDetailLevel !== ListDetailLevel.SMALL" size="10px"
               @click="setListDetailLevel(ListDetailLevel.SMALL)">
          <q-tooltip>Show only title and url</q-tooltip>
        </q-btn>
        <q-btn icon="crop_16_9"
               class="q-my-xs q-mx-none"
               style="width:20px"
               color="primary"
               :outline="useUiStore().listDetailLevel !== ListDetailLevel.MEDIUM" size="10px"
               @click="setListDetailLevel(ListDetailLevel.MEDIUM)">
          <q-tooltip>Show image, title and url</q-tooltip>
        </q-btn>
        <q-btn icon="crop_portrait"
               class="q-my-xs q-mx-none"
               style="width:20px"
               color="primary"
               :outline="useUiStore().listDetailLevel !== ListDetailLevel.LARGE" size="10px"
               @click="setListDetailLevel(ListDetailLevel.LARGE)">
          <q-tooltip>All available info</q-tooltip>
        </q-btn>

        <q-btn icon="o_settings"
               class="q-my-xs q-mx-sm"
               color="primary"
               size="10px"
               @click="openOptionsPage()"/>
      </div>
    </div>

  </q-footer>
</template>
<script setup lang="ts">
import {ListDetailLevel, useUiStore} from "stores/uiStore";
import {useTabsStore} from "stores/tabsStore";
import {Tab} from "src/models/Tab";
import {ref, watchEffect} from "vue";
import {useRouter} from "vue-router";
import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";

const tabsStore = useTabsStore()
const router = useRouter()

const currentChromeTabs = ref<chrome.tabs.Tab[]>([])
const currentTabs = ref<Tab[]>([])
const currentChromeTab = ref<chrome.tabs.Tab>(null as unknown as chrome.tabs.Tab)

const setListDetailLevel = (val: ListDetailLevel) => useUiStore().setListDetailLevel(val)

watchEffect(() => {
  if (currentChromeTabs.value[0]?.url) {
    currentTabs.value = useTabsStore().tabsForUrl(currentChromeTabs.value[0].url) || []
  }
})

watchEffect(() => {
  console.log("tabset id", useTabsStore().currentTabsetId)
})
watchEffect(() => {
  currentChromeTab.value = useTabsStore().currentChromeTab
})

const openOptionsPage = () => {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('www/options.html'));
  }
}

const openTagsList = () => router.push("/sidepanel/tagslist")
const openGroupedByDomain = () => router.push("/sidepanel/byDomainList")

</script>
