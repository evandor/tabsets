<template>
  <router-view />
</template>

<script setup lang="ts">
import {useTabsStore} from "src/stores/tabsStore";
import {useTabGroupsStore} from "src/stores/tabGroupsStore";
import {useQuasar} from "quasar";
import tabsetService from "src/services/TabsetService";
import backendApi from "src/services/BackendApi";
import {useFeatureTogglesStore} from "stores/featureTogglesStore";

backendApi.init(process.env.BACKEND_URL || "unknown", null)

const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()
const featureTogglesStore = useFeatureTogglesStore()

featureTogglesStore.initialize(useQuasar().localStorage);

tabsStore.initialize(useQuasar().localStorage);
tabsStore.initListeners();

tabGroupsStore.initialize();
tabGroupsStore.initListeners();

tabsetService.setLocalStorage(useQuasar().localStorage)
tabsetService.init()


</script>
