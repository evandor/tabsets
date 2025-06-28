<template>
  <q-page padding style="padding-top: 45px">
    <div class="q-ma-none">
      <div class="q-ma-none">
        <div class="row q-ma-none q-pa-none">
          <div class="col-12 q-ma-none q-pa-none q-pt-lg">
            <TabsAsTree />
          </div>
        </div>
      </div>
    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">
      <ViewToolbarHelper title="Tabs As Tree" />
    </q-page-sticky>
  </q-page>
</template>

<script lang="ts" setup>
import TabsAsTree from 'src/core/components/TabsAsTree.vue'
import ViewToolbarHelper from 'src/core/pages/sidepanel/helper/ViewToolbarHelper.vue'
import Analytics from 'src/core/utils/google-analytics'
import { onMounted } from 'vue'

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelTabsAsTreePage', document.location.href)
})
</script>
