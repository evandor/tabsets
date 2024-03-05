<template>
  <div>
    <q-form @submit.prevent="importBookmarks()" ref="theForm">

      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6" v-if="props.foldersCount === 0">Import these {{ props.count }} Bookmarks as Tabset</div>
          <div class="text-h6" v-else>Import all Bookmarks recursively</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="text-body">New Tabset's name:</div>

          <q-input v-model="newTabsetName"
                   class="q-mb-md q-pb-none"
                   dense autofocus
                   @update:model-value="val => checkIsValid()"
                   :rules="[
                       (val:string) => Tabset.newTabsetNameIsValid(val) || 'Please do not use special Characters',
                       (val:string) => Tabset.newTabsetNameIsShortEnough(val) || 'the maximum length is ' + TABSET_NAME_MAX_LENGTH
                       ]"
                   data-testid="newTabsetName"/>

          <template v-if="props.foldersCount > 0 && usePermissionsStore().hasFeature(FeatureIdent.TABSET_SUBFOLDER)">
            <q-checkbox
              v-model="recursive" label="Recursively"/>&nbsp;
            <q-icon name="help" color="primary" size="1em">
              <q-tooltip class="tooltip">If you select this option, all bookmarks and subfolders will be added as well
              </q-tooltip>
            </q-icon>
            <br>
          </template>

          <q-checkbox
            data-testid="newTabsetAutoAdd"
            v-model="deleteBookmarks" label="Delete Bookmarks"/>&nbsp;
          <q-icon name="help" color="primary" size="1em">
            <q-tooltip class="tooltip">If you select this option, the bookmarks will be imported as a new tabset and
              deleted from your bookmarks automatically
            </q-tooltip>
          </q-icon>

          <!--        <q-checkbox v-model="clearTabs" label="close current Tabs"/>-->
          <div class="text-body2 text-warning"> {{ newTabsetDialogWarning() }}</div>


        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn label="Cancel" size="sm" color="accent" v-close-popup/>
          <q-btn type="submit" label="Create new Tabset" color="warning" size="sm"
                 data-testid="newTabsetNameSubmit"
                 :disable="!isValid" v-close-popup/>
        </q-card-actions>
      </q-card>
    </q-form>
  </div>

</template>

<script lang="ts" setup>

import {ref} from "vue";
import {QForm, useDialogPluginComponent, useQuasar} from "quasar";
import {useRouter} from "vue-router";
import {useTabsStore} from "stores/tabsStore";
import ChromeApi from "src/services/ChromeApi";
import {useBookmarksStore} from "stores/bookmarksStore";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {CreateTabsetFromBookmarksCommand} from "src/domain/tabsets/CreateTabsetFromBookmarks";
import {Tabset, TABSET_NAME_MAX_LENGTH, TabsetStatus} from "src/models/Tabset";
import _ from "lodash"
import {useTabsetService} from "src/services/TabsetService2";
import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {useUtils} from "src/services/Utils";

const {sendMsg} = useUtils()

defineEmits([
  ...useDialogPluginComponent.emits
])

const props = defineProps({
  inSidePanel: {type: Boolean, default: false},
  foldersCount: {type: Number, default: 0},
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
const recursive = ref(false)

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

async function createTabsetFrom(name: string, bookmarkId: string): Promise<Tabset> {
  //console.log("creating recursively", name, bookmarkId)
  const subTree:chrome.bookmarks.BookmarkTreeNode[] = await ChromeApi.childrenFor(bookmarkId)
  const folders = _.filter(subTree, e => e.url === undefined)
  const nodes = _.filter(subTree, e => e.url !== undefined)
  //console.log("folders", folders.length, folders)
  //console.log("nodes", nodes.length, nodes)
  const subfolders: Tabset[] = []
  for (const f of folders) {
    console.log("found folder", f)
    const subTabset = await createTabsetFrom(f.title, f.id)
    subfolders.push(subTabset)
  }
  const result = await useTabsetService().saveOrReplaceFromBookmarks(name, nodes, true, true)
  console.log("result", result)
  const ts: Tabset = result['tabset' as keyof object]
  ts.folders = subfolders
  subfolders.forEach(f => f.folderParent = ts.id)
  return ts
}

const importBookmarks = async () => {
  // const bookmarkId = props.folderId //route.params.id as string
  console.log("importing bookmarks from", bookmarkId.value, recursive.value)
  $q.loadingBar?.start()

  if (recursive.value) {

    const tabset = await createTabsetFrom(newTabsetName.value, bookmarkId.value)
    await useTabsetService().saveTabset(tabset)
    $q.loadingBar?.stop()
    return
  }

  const candidates: chrome.bookmarks.BookmarkTreeNode[] = await ChromeApi.childrenFor(bookmarkId.value)
  useCommandExecutor()
    .executeFromUi(new CreateTabsetFromBookmarksCommand(newTabsetName.value, candidates))
    .then(res => {
      //if (!props.inSidePanel) {
        sendMsg('sidepanel-switch-view', {view: 'main'})
      //}
      return res
    })
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
