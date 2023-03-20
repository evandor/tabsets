<template>
  <div class="row" style="min-width:300px">
    <div class="col">
      <q-btn label="Start!" @click="openExtensionTab"/>
    </div>
  </div>
</template>

<script lang="ts" setup>

import NavigationService from "src/services/NavigationService";
import {ref} from "vue";

// const firstTime = ref(true)

const openExtensionTab = () => {
  const extensionUrl = chrome.runtime.getURL('www/index.html')
  NavigationService.openOrCreateTab(extensionUrl)
}

// if (firstTime.value) {
//   firstTime.value = false
//   openExtensionTab()
// }


</script>
