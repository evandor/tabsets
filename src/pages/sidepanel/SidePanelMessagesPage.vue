<template>
  <q-page padding style="padding-top: 45px">
    <div class="q-ma-none">
      <div class="row q-ma-none q-pa-none">
        <div class="col-12 q-ma-none q-pa-none q-pt-lg">
          {{ messages }}
        </div>
      </div>
    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">
      <FirstToolbarHelper2 title="Messages">
        <template v-slot:iconsRight>
          <SidePanelToolbarTabNavigationHelper />

          <SidePanelToolbarButton
            icon="close"
            tooltip="Close this view"
            @click="useUiStore().sidePanelSetActiveView(SidePanelViews.MAIN)" />
        </template>
      </FirstToolbarHelper2>
    </q-page-sticky>
  </q-page>
</template>

<script lang="ts" setup>
import { SidePanelViews } from 'src/app/models/SidePanelViews'
import SidePanelToolbarButton from 'src/core/components/SidePanelToolbarButton.vue'
import Analytics from 'src/core/utils/google-analytics'
import SidePanelToolbarTabNavigationHelper from 'src/opentabs/pages/SidePanelToolbarTabNavigationHelper.vue'
import FirstToolbarHelper2 from 'src/pages/sidepanel/helper/FirstToolbarHelper2.vue'
import { useUiStore } from 'src/ui/stores/uiStore'
import { onMounted, ref } from 'vue'

const messages = ref<object[]>([])

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelMessagesPage', document.location.href)
})
</script>
