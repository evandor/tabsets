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
      <FirstToolbarHelper title="Messages">

        <template v-slot:iconsRight>

          <SidePanelToolbarTabNavigationHelper/>

          <SidePanelToolbarButton
            icon="close"
            tooltip="Close this view"
            @click="useUiStore().sidePanelSetActiveView(SidePanelViews.MAIN)"/>
        </template>

      </FirstToolbarHelper>
    </q-page-sticky>

  </q-page>

</template>

<script lang="ts" setup>

import FirstToolbarHelper from "pages/sidepanel/helper/FirstToolbarHelper.vue";
import {useUiStore} from "src/ui/stores/uiStore";
import {onMounted, ref, watchEffect} from "vue";
import Analytics from "src/core/utils/google-analytics";
import SidePanelToolbarTabNavigationHelper from "src/opentabs/pages/SidePanelToolbarTabNavigationHelper.vue";
import SidePanelToolbarButton from "src/core/components/SidePanelToolbarButton.vue";
import {Message} from "src/models/Message";
import {SidePanelViews} from "src/app/models/SidePanelViews";

const messages = ref<Message[]>([])

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelMessagesPage', document.location.href);
})

</script>
