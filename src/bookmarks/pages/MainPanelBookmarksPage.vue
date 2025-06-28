<template>

  <BookmarksPage :in-side-panel="true">

    <template v-slot:actions>

      <q-btn v-if="nonFolders().length > 0"
             flat dense icon="upload_file"
             color="primary" :label="$q.screen.gt.lg ? 'Import as Tabset...' : ''"
             class="q-mr-sm"
             @click="importBookmarks">
        <q-tooltip>Import these bookmarks as Tabset</q-tooltip>
      </q-btn>

      <q-btn
        flat dense icon="o_add"
        color="primary" :label="$q.screen.gt.lg ? 'Add Folder...' : ''"
        class="q-mr-md"
        @click="addUrlDialog">
        <q-tooltip>Create a new Bookmark Folder</q-tooltip>
      </q-btn>

      <q-btn
        flat dense icon="delete_outline"
        color="negative" :label="$q.screen.gt.lg ? 'Delete Folder...' : ''"
        class="q-mr-md"
        @click="deleteBookmarkFolder">
        <q-tooltip>Delete this Bookmark Folder</q-tooltip>
      </q-btn>

    </template>

  </BookmarksPage>

</template>

<script lang="ts" setup>

import BookmarksPage from "src/bookmarks/pages/BookmarksPage.vue";
import {onMounted, ref} from "vue";
import Analytics from "src/core/utils/google-analytics";
import AddBookmarkFolderDialog from "src/bookmarks/dialogues/AddBookmarkFolderDialog.vue";
import {useBookmarksStore} from "src/bookmarks/stores/bookmarksStore";
import {useQuasar} from "quasar";
import {useRoute, useRouter} from "vue-router";
import BookmarksService from "src/bookmarks/services/BookmarksService";
import {Bookmark} from "src/bookmarks/models/Bookmark";
import _ from "lodash"
import ImportFromBookmarksDialog from "src/bookmarks/dialogues/ImportFromBookmarksDialog.vue";

const $q = useQuasar()
const bookmarksStore = useBookmarksStore()
const router = useRouter()

const bookmarkId = ref('')

onMounted(() => {
  Analytics.firePageViewEvent('MainPanelBookmarksPage', document.location.href);
})

const folders = (): Bookmark[] => _.filter(bookmarksStore.bookmarksForFolder, (bm: Bookmark) => !bm.chromeBookmark.url)
const nonFolders = (): Bookmark[] => _.filter(bookmarksStore.bookmarksForFolder, (bm: Bookmark) => !!bm.chromeBookmark.url)



const addUrlDialog = () => $q.dialog({
  component: AddBookmarkFolderDialog,
  componentProps: {parentFolderId: bookmarkId.value}
})

const importBookmarks = () => $q.dialog({
  component: ImportFromBookmarksDialog,
  componentProps: {
    count: nonFolders().length,
    foldersCount: folders().length,
    inSidePanel: true
  }
})

const deleteBookmarkFolder = () => {

  $q.dialog({
    title: 'Please Confirm Deleting of Bookmarks Folder',
    message: 'Do you really want to delete this folder (and potentially all its subfolders and bookmarks)? This cannot be undone.',
    cancel: true,
    persistent: true
  }).onOk(() => {
    const parentId = bookmarksStore.currentBookmark.chromeBookmark.parentId
    BookmarksService.deleteBookmarksFolder(bookmarksStore.currentBookmark.chromeBookmark.id)
    if (parentId) {
      router.push("/mainpanel/bookmarks/" + parentId)
    }
  }).onCancel(() => {
  }).onDismiss(() => {
  })
}

</script>
