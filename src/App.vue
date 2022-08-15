<template>
  <router-view />
</template>

<script setup lang="ts">
import {useTabsStore} from "stores/tabs";
import {useTabGroupsStore} from "stores/tabGroups";

const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()

tabsStore.loadTabs();
tabGroupsStore.loadTabGroups();



</script>
