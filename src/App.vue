<template>
  <router-view />
</template>

<script setup lang="ts">
import {useTabsStore} from "src/stores/tabsStore";
import {useTabGroupsStore} from "src/stores/tabGroupsStore";
import {useQuasar} from "quasar";
import tabsetService from "src/services/TabsetService";

const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()

tabsStore.initialize(useQuasar().localStorage);
tabsStore.initListeners();

tabGroupsStore.loadTabGroups();
tabGroupsStore.initListeners();

tabsetService.setLocalStorage(useQuasar().localStorage)
tabsetService.init()

</script>
