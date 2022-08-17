<template>
  <router-view />
</template>

<script setup lang="ts">
import {useTabsStore} from "stores/tabsStore";
import {useTabGroupsStore} from "stores/tabGroupsStore";

const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()

tabsStore.loadTabs();
tabsStore.initListeners();

tabGroupsStore.loadTabGroups();
tabGroupsStore.initListeners();



</script>
