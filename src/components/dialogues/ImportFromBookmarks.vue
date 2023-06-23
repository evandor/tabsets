<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">

    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">Import this Bookmarks Folder {{ props.folderId }}/{{ props.folderName }} as Tabset</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">Please provide a name for the new tabset</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="text-body">New Tabset's name:</div>
        <q-input dense v-model="newTabsetName" autofocus @keyup.enter="prompt = false"/>
        <!--        <q-checkbox v-model="clearTabs" label="close current Tabs"/>-->
        <div class="text-body2 text-warning"> {{ newTabsetDialogWarning() }}</div>
        <q-radio v-model="merge" val="true" label="Merge" v-if="tabNameExists()"></q-radio>
        <q-radio v-model="merge" val="false" label="Overwrite" v-if="tabNameExists()"></q-radio>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" @click="onDialogCancel"/>
        <q-btn flat label="Create new Tabset"
               :disable="newTabsetName.trim().length === 0" v-close-popup
               @click="importBookmarks()"/>
      </q-card-actions>
    </q-card>


    <!--      <q-card-actions align="right" class="text-primary">-->
    <!--        <q-btn flat label="Cancel" @click="onDialogCancel"/>-->
    <!--        <q-btn flat label="Import" v-close-popup @click="importData()"/>-->
    <!--      </q-card-actions>-->
  </q-dialog>

</template>

<script lang="ts" setup>

import {ref} from "vue";
import {useQuasar} from "quasar";
import {useRoute, useRouter} from "vue-router";
import {useTabsStore} from "src/stores/tabsStore";

import {useDialogPluginComponent} from 'quasar'
import ChromeApi from "src/services/ChromeApi";
import {useBookmarksStore} from "src/stores/bookmarksStore";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {CreateTabsetFromBookmarksCommand} from "src/domain/tabsets/CreateTabsetFromBookmarks";

defineEmits([
  ...useDialogPluginComponent.emits
])

const props = defineProps({
  inSidePanel: {type: Boolean, default: false}
})

const {dialogRef, onDialogHide, onDialogCancel} = useDialogPluginComponent()

const bookmarksStore = useBookmarksStore()
const tabsStore = useTabsStore()
const router = useRouter()
const route = useRoute()
const $q = useQuasar()

const newTabsetName = ref(bookmarksStore.currentBookmark.chromeBookmark.title)
const bookmarkId = ref(bookmarksStore.currentBookmark.chromeBookmark.id)
const merge = ref(false)

const tabNameExists = () => tabsStore.nameExistsInContextTabset(newTabsetName.value)

const newTabsetDialogWarning = () => {
  if (tabsStore.nameExistsInContextTabset(newTabsetName.value)) {
    return "Tabset " + newTabsetName.value + " already exists. Please choose:"
  }
  return ""
}

const importBookmarks = async () => {
  // const bookmarkId = props.folderId //route.params.id as string
  console.log("importing bookmarks", bookmarkId.value)
  $q.loadingBar.start()

  const candidates: chrome.bookmarks.BookmarkTreeNode[] = await ChromeApi.childrenFor(bookmarkId.value)
  useCommandExecutor()
    .executeFromUi(new CreateTabsetFromBookmarksCommand(newTabsetName.value, candidates))
    .then(res => {
      props.inSidePanel ?
        router.push("/mainpanel/tabsets/" + tabsStore.currentTabsetId) :
        router.push("/tabsets/" + tabsStore.currentTabsetId)
    })

  $q.loadingBar.stop()
}


</script>
