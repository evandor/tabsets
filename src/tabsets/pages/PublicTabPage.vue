<!-- TabsetsPage -->
<template>
  {{ activeTab?.url || '???' }}
  <embed v-if="activeTab" :src="activeTab.url || ''" width="100%" height="1000px" />
</template>

<script setup lang="ts">
import Analytics from 'src/core/utils/google-analytics'
import { Tab } from 'src/tabsets/models/Tab'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { onMounted, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const activeTab = ref<Tab | undefined>(undefined)

onMounted(() => {
  Analytics.firePageViewEvent('PublicTabsetPage', document.location.href)
})

watchEffect(() => {
  const tabId = route.params.tabId as string
  console.log('got tabid', tabId)
  activeTab.value = useTabsetsStore().getTabAndTabsetId(tabId)?.tab
})
</script>
