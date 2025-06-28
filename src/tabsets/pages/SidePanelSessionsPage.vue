<template>
  <!-- SidePanelOpenTabsPage -->
  <q-page padding style="padding-top: 34px">
    <div class="q-ma-none">
      <div class="q-ma-none">
        <div class="row q-ma-none q-pa-none">
          <div class="col-12 q-ma-none q-pa-none q-pt-md">
            <SidePanelSessionsListViewer />
          </div>
        </div>
      </div>
    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">
      <ViewToolbarHelper title="Stashed Tabs">
        <template v-slot:iconsRight>
          <div class="q-mt-sm q-ma-none q-qa-none">
            <q-btn outline size="xs" label="stash open tabs" class="q-mr-md" @click.stop="startSession()" />
          </div>
        </template>
      </ViewToolbarHelper>
    </q-page-sticky>
  </q-page>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar'
import ViewToolbarHelper from 'src/core/pages/sidepanel/helper/ViewToolbarHelper.vue'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import Analytics from 'src/core/utils/google-analytics'
import { CreateStashCommand } from 'src/tabsets/commands/CreateStashCommand'
import StartSessionDialog from 'src/tabsets/dialogues/StartSessionDialog.vue'
import SidePanelSessionsListViewer from 'src/tabsets/pages/SidePanelSessionsListViewer.vue'
import { onMounted } from 'vue'

const $q = useQuasar()

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelSessionsPage', document.location.href)
})

const startSession = () => {
  $q.dialog({
    component: StartSessionDialog,
  }).onOk((callback: { oldSessionName: string; collection: string }) => {
    useCommandExecutor().executeFromUi(new CreateStashCommand(callback.oldSessionName, callback.collection))
  })
}
</script>
