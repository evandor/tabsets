<template>
  <q-page padding style="padding-top: 45px">
    <div class="q-ma-none">
      <div class="q-ma-none">
        <div class="row q-ma-none q-pa-none">
          <q-list :separator="false">
            <q-item
              v-for="note in notes"
              @click="openNote(note['id' as keyof object])"
              clickable
              v-ripple
              class="q-ma-none q-pa-sm">
              <q-item-section class="q-mx-sm" style="justify-content: start; width: 25px; max-width: 25px">
                <div class="q-pa-none q-pl-none">
                  <q-icon name="o_note_alt" color="primary" size="sm" />
                </div>
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  <div class="text-subtitle2 ellipsis">
                    {{ note['title' as keyof object] }}
                  </div>
                </q-item-label>
                <q-item-label class="text-caption text-grey-5"> </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-item-label>
                  <!--          <q-icon class="cursor-pointer" name="more_vert" size="16px"/>-->
                  <!--          <SidePanelSubfolderContextMenu :tabset="currentTabset" :folder="folder"/>-->
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </div>
    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">
      <ViewToolbarHelper title="Notes View" />
    </q-page-sticky>
  </q-page>
</template>

<script lang="ts" setup>
import Analytics from 'src/core/utils/google-analytics'
import { useNotesStore } from 'src/notes/stores/NotesStore'
import ViewToolbarHelper from 'src/pages/sidepanel/helper/ViewToolbarHelper.vue'
import NavigationService from 'src/services/NavigationService'
import { onMounted, ref } from 'vue'

const notes = ref<object[]>([])

onMounted(async () => {
  Analytics.firePageViewEvent('SidePanelNotesViewPage', document.location.href)
  notes.value = await useNotesStore().getNotebookList()
})

const openNote = (id: string) =>
  NavigationService.openOrCreateTab([chrome.runtime.getURL(`/www/index.html#/mainpanel/notes/${id}`)])
</script>
