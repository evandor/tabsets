<template>

  <q-footer class="lightgrey text-primary q-pa-xs">
    <div class="row fit">
      <div class="col-5">
        <q-btn icon="o_playlist_add"
               class="q-my-xs q-mx-xs"
               style="width:20px"
               :color="isActive('tabslist') ? 'secondary':'primary'"
               size="8px"
               @click="toggleView('tabslist')">
          <q-tooltip class="tooltip">List all open tabs in your browser</q-tooltip>
        </q-btn>
        <q-btn icon="o_label"
               v-if="usePermissionsStore().hasFeature(FeatureIdent.TAGS)"
               class="q-my-xs q-mx-xs"
               style="width:20px"
               :color="isActive('tagslist') ? 'secondary':'primary'"
               size="8px"
               @click="toggleView('tagslist')">
          <q-tooltip class="tooltip">List of all tags sorted by prevalence</q-tooltip>
        </q-btn>
        <q-btn icon="o_dns"
               v-if="usePermissionsStore().hasFeature(FeatureIdent.GROUP_BY_DOMAIN)"
               class="q-my-xs q-mx-xs"
               style="width:20px"
               :color="isActive('byDomainList') ? 'secondary':'primary'"
               size="8px"
               @click="toggleView('byDomainList')">
          <q-tooltip class="tooltip">List all your tabs URLs by domain</q-tooltip>
        </q-btn>
      </div>
      <div class="col-7 text-right">
        <q-btn icon="crop_7_5"
               class="q-my-xs q-mx-none"
               style="width:20px"
               color="primary"
               :outline="useUiStore().listDetailLevel !== ListDetailLevel.SMALL" size="8px"
               @click="setListDetailLevel(ListDetailLevel.SMALL)">
          <q-tooltip class="tooltip">Show only title and url</q-tooltip>
        </q-btn>
        <q-btn icon="crop_16_9"
               class="q-my-xs q-mx-none"
               style="width:20px"
               color="primary"
               :outline="useUiStore().listDetailLevel !== ListDetailLevel.MEDIUM" size="8px"
               @click="setListDetailLevel(ListDetailLevel.MEDIUM)">
          <q-tooltip class="tooltip">Show image, title and url</q-tooltip>
        </q-btn>
        <q-btn icon="crop_portrait"
               class="q-my-xs q-mx-none"
               style="width:20px"
               color="primary"
               :outline="useUiStore().listDetailLevel !== ListDetailLevel.LARGE" size="8px"
               @click="setListDetailLevel(ListDetailLevel.LARGE)">
          <q-tooltip class="tooltip">All available info</q-tooltip>
        </q-btn>

        <q-btn icon="o_settings"
               class="q-my-xs q-mx-sm"
               color="primary"
               size="8px"
               @click="openOptionsPage()">
          <q-tooltip class="tooltip" anchor="top left" self="bottom left">Open Settings</q-tooltip>
        </q-btn>
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

const activeView = ref<string | undefined>(undefined)
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
  // if (chrome.runtime.openOptionsPage) {
  //   chrome.runtime.openOptionsPage();
  // } else {
  //   window.open(chrome.runtime.getURL('www/options.html'));
  // }
  window.open(chrome.runtime.getURL('www/index.html#/mainpanel/settings'));
}

const toggleView = (ident: string) => {
  if (isActive(ident)) {
    activateView(undefined)
    router.push("/sidepanel")
  } else {
    activateView(ident)
    router.push("/sidepanel/" + ident)
  }
}

const isActive = (ident: string) => activeView.value !== undefined && activeView.value === ident
const activateView = (ident: string | undefined) => activeView.value = ident

</script>
