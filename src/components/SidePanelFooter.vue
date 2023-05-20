<template>
  <q-footer elevated class="bg-grey-8 text-white q-pa-xs">
    <div class="text-right">
      <q-btn icon="crop_7_5"
             class="q-my-xs q-mx-none"
             color="primary"
             :outline="useUiStore().listDetailLevel !== ListDetailLevel.SMALL" size="10px"
             @click="setListDetailLevel(ListDetailLevel.SMALL)"/>
      <q-btn icon="crop_16_9"
             class="q-my-xs q-mx-none"
             color="primary"
             :outline="useUiStore().listDetailLevel !== ListDetailLevel.MEDIUM" size="10px"
             @click="setListDetailLevel(ListDetailLevel.MEDIUM)"/>
      <q-btn icon="crop_portrait"
             class="q-my-xs q-mx-none"
             color="primary"
             :outline="useUiStore().listDetailLevel !== ListDetailLevel.LARGE" size="10px"
             @click="setListDetailLevel(ListDetailLevel.LARGE)"/>

      <q-btn icon="o_settings"
             class="q-my-xs q-mx-sm"
             color="primary"
             size="10px"
             @click="openOptionsPage()"/>
    </div>
  </q-footer>
</template>
<script setup lang="ts">
import {ListDetailLevel, useUiStore} from "stores/uiStore";

const setListDetailLevel = (val: ListDetailLevel) => useUiStore().setListDetailLevel(val)

const openOptionsPage = () => {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('www/options.html'));
  }
}
</script>
