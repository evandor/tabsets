<!-- PublicTabsetPage -->
<template>
  <TabList
    v-if="tabset"
    group="otherTabs"
    :tabsetId="tabset.id"
    :tabset="tabset"
    :tabsetSorting="tabset.sorting"
    :tabsetSharedId="tabset.sharing?.sharedId!"
    :tabs="tabset.tabs"
    :detailLevel="'SOME'" />
</template>

<script setup lang="ts">
import Analytics from 'src/core/utils/google-analytics'
import { Tabset } from 'src/tabsets/models/Tabset'
import TabList from 'src/tabsets/pages/pwa/TabList.vue'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { onMounted, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const tabset = ref<Tabset | undefined>(undefined)

onMounted(() => {
  Analytics.firePageViewEvent('PublicTabsetPage', document.location.href)
})

watchEffect(() => {
  if (route.params.tabsetId) {
    useTabsetsStore()
      .selectCurrentTabset(route.params.tabsetId as string)
      .then((ts: Tabset | undefined) => (tabset.value = ts))
  } else {
    tabset.value = useTabsetsStore().getCurrentTabset
  }
})
</script>
