<template>
  <!-- SidePanelOpenTabsPage -->
  <q-page padding style="padding-top: 34px">
    <div class="q-ma-none">
      <div class="q-ma-none">
        <div class="row q-ma-none q-pa-none">
          <div class="col-12 q-ma-none q-pa-none q-pt-md">
            <SidePanelRemindersListViewer />
          </div>
        </div>
      </div>
    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">
      <ViewToolbarHelper title="Reminders">
        <template v-slot:iconsRight>
          <div class="q-mt-sm q-ma-none q-qa-none">
            <!--            <q-btn outline size="xs" label="new session" class="q-mr-md" @click.stop="startSession()" />-->
          </div>
        </template>
      </ViewToolbarHelper>
    </q-page-sticky>
  </q-page>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar'
import ViewToolbarHelper from 'src/core/pages/sidepanel/helper/ViewToolbarHelper.vue'
import Analytics from 'src/core/utils/google-analytics'
import SidePanelRemindersListViewer from 'src/tabsets/pages/SidePanelRemindersListViewer.vue'
import { onMounted } from 'vue'

const $q = useQuasar()

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelSessionsPage', document.location.href)
})
</script>
