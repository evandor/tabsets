<template>
  <div>
    <q-form @submit.prevent="importBookmarks()" ref="theForm">

      <q-card class="q-dialog-plugin">
        <q-card-section>
          <div class="text-h6">Delete Bookmark Folder</div>
        </q-card-section>
        <q-card-section>
          <div class="text-body">Would you like to delete this folder?</div>
        </q-card-section>
        <q-card-actions align="right" class="text-primary">
          <q-btn outline color="accent" size="sm" label="Cancel" @click="onDialogCancel"/>
          <q-btn outline color="negative" size="sm" label="Delete"
                 v-close-popup
                 @click="deleteTabset()"/>
        </q-card-actions>
      </q-card>
    </q-form>
  </div>

</template>

<script lang="ts" setup>

import {ref} from "vue";
import {QForm, useQuasar} from "quasar";
import {useRoute, useRouter} from "vue-router";
import {useTabsStore} from "stores/tabsStore";

import {useDialogPluginComponent} from 'quasar'
import ChromeApi from "src/services/ChromeApi";
import {useBookmarksStore} from "stores/bookmarksStore";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {CreateTabsetFromBookmarksCommand} from "src/domain/tabsets/CreateTabsetFromBookmarks";
import {Tabset, TABSET_NAME_MAX_LENGTH, TabsetStatus} from "src/models/Tabset";

defineEmits([
  ...useDialogPluginComponent.emits
])

const props = defineProps({
  inSidePanel: {type: Boolean, default: false},
  count: {type: Number, default: 0}
})

const {dialogRef, onDialogHide, onDialogCancel} = useDialogPluginComponent()

const bookmarksStore = useBookmarksStore()
const tabsStore = useTabsStore()
const router = useRouter()
const $q = useQuasar()

const theForm = ref<QForm>(null as unknown as QForm)
const newTabsetName = ref(bookmarksStore.currentBookmark.chromeBookmark.title)
const bookmarkId = ref(bookmarksStore.currentBookmark.chromeBookmark.id)
const isValid = ref(true)
const deleteBookmarks = ref(false)

const tabNameExists = () => tabsStore.nameExistsInContextTabset(newTabsetName.value)

const newTabsetDialogWarning = () => {
  if (tabsStore.nameExistsInContextTabset(newTabsetName.value)) {
    return "Tabset " + newTabsetName.value + " already exists, items will be merged"
  }
  return ""
}

const checkIsValid = () => {
  if (theForm.value) {
    theForm.value.validate()
        .then((res) => {
          isValid.value = res
        })
  }
}

const doesNotExistYet = (val: string) => {
  const existsInTabset = tabsStore.existingInTabset(val)
  return !(existsInTabset && existsInTabset.status !== TabsetStatus.DELETED)
}


const importBookmarks = async () => {
  // const bookmarkId = props.folderId //route.params.id as string
  console.log("importing bookmarks", bookmarkId.value)
  $q.loadingBar?.start()

  const candidates: chrome.bookmarks.BookmarkTreeNode[] = await ChromeApi.childrenFor(bookmarkId.value)
  useCommandExecutor()
      .executeFromUi(new CreateTabsetFromBookmarksCommand(newTabsetName.value, candidates))
      .then(res => {
        if (deleteBookmarks.value) {
          console.log("deleting bookmarks", candidates)
          candidates.forEach((c: chrome.bookmarks.BookmarkTreeNode) => chrome.bookmarks.remove(c.id))
        }
        props.inSidePanel ?
            router.push("/mainpanel/tabsets/" + tabsStore.currentTabsetId) :
            router.push("/tabsets/" + tabsStore.currentTabsetId)
      })

  $q.loadingBar?.stop()
}


</script>
