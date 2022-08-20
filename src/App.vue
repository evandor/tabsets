<template>
  <router-view />
</template>

<script setup lang="ts">
import {useTabsStore} from "stores/tabsStore";
import {useTabGroupsStore} from "stores/tabGroupsStore";
import {useQuasar} from "quasar";

const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()

tabsStore.initialize(useQuasar().localStorage);
tabsStore.initListeners();

tabGroupsStore.loadTabGroups();
tabGroupsStore.initListeners();



</script>
