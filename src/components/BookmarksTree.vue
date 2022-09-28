<template>

  <q-list class="q-mt-md" v-if="featuresStore.bookmarksEnabled">

    <q-item-label header>Bookmarks</q-item-label>

    <q-tree
      :nodes="bookmarksStore.bookmarksTree"
      node-key="id"
      v-model:expanded="expanded"
    >
      <template v-slot:header-node="prop">
        <q-icon name="o_folder" class="q-mr-sm"/>
        {{ prop.node.label }}
        <q-menu :v-model="false" context-menu>
          <q-list style="min-width: 100px">
            <q-item clickable v-close-popup>
              <q-item-section @click="importFromBookmarks(prop)">Import as tabset</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </template>
      <template v-slot:header-leaf="prop">
        <q-icon name="o_article" class="q-mr-sm"/>
        {{ prop.node.label }}/{{ prop.node.menuShowing }}
        <q-menu :v-model="false" context-menu>
          <q-list style="min-width: 100px">
            <q-item clickable v-close-popup>
              <q-item-section>{{ prop.node.label }}/{{ prop.key }}</q-item-section>
            </q-item>
            <q-item clickable v-close-popup>
              <q-item-section>ID: {{ prop.node.id }}</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </template>
    </q-tree>


  </q-list>

  <q-dialog v-model="showImportTabsetDialog">
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">Import this Bookmarks Folder as Tabset</div>
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
        <q-btn flat label="Cancel" v-close-popup/>
        <q-btn flat label="Create new Tabset"
               :disable="newTabsetName.trim().length === 0 || newTabsetName.trim() === 'current'" v-close-popup
               @click="importBookmarks()"/>
      </q-card-actions>
    </q-card>
  </q-dialog>


</template>

<script setup lang="ts">

import TabsetService from "src/services/TabsetService";
import {useRouter} from "vue-router";
import {useTabsStore} from "stores/tabsStore";
import _ from "lodash"
import {ref} from "vue";
import {useQuasar} from "quasar";
import {Tabset} from "src/models/Tabset";
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import {TreeNode} from "src/models/Tree";
import ChromeApi from "src/services/ChromeApi";
import {useBookmarksStore} from "stores/bookmarksStore";

const router = useRouter()
const tabsStore = useTabsStore()
const featuresStore = useFeatureTogglesStore()
const bookmarksStore = useBookmarksStore()

const showDeleteButton = ref<Map<string, boolean>>(new Map())
const $q = useQuasar();

const tabsetDiff = ref<Map<string, object>>(new Map())

const showImportTabsetDialog = ref(false)
const bookmarkFolderForImport = ref<string>('')

const newTabsetName = ref('')
const merge = ref(false)

$q.loadingBar.setDefaults({
  color: 'positive',
  size: '10px',
  position: 'bottom'
})

const tabsets = () => {
  //console.log("tabsets", [...tabsStore.tabsets.values()])
  return _.sortBy([...tabsStore.tabsets.values()], ['name'])
}


const tabsetLabel = (tabset: Tabset) => {
  return tabset.tabs?.length > 1 ? tabset.name + ' (' + tabset.tabs?.length + ' tabs)' : tabset.name + ' (' + tabset.tabs?.length + ' tab)'
}

const expanded = ref([])

const bookmarksTree = ref<object[]>([])



const importFromBookmarks = (prop: any) => {
  console.log("import from bookmarks", prop)
  showImportTabsetDialog.value = true
  newTabsetName.value = prop.node.title
  bookmarkFolderForImport.value = prop.key
}


const tabNameExists = () => tabsStore.nameExistsInContextTabset(newTabsetName.value)

const createChromeTab = async (openerId: number, url: string): Promise<chrome.tabs.Tab> => {
  // @ts-ignore
  const chromeTab: chrome.tabs.Tab = await chrome.tabs.create({url: url, openerTabId: openerId, active: false})
  return chromeTab
}

const importBookmarks = async () => {
  console.log("importing bookmarks", bookmarkFolderForImport.value)
  $q.loadingBar.start()
  //
  // $q.loadingBar.increment(value)
  if (featuresStore.bookmarksEnabled) {
    const candidates: chrome.bookmarks.BookmarkTreeNode[] = await ChromeApi.childrenFor(bookmarkFolderForImport.value)
    //console.log("got candidates", candidates)
    // ChromeListeners.createThumbnails(false)


    // Promise.all(tabsPromises)
    //   .then((tabs: chrome.tabs.Tab[]) => {
    //       console.log("got tabs", tabs)
    TabsetService.saveOrReplaceFromBookmarks(newTabsetName.value, candidates, true)
      .then((result: object) => {
        //@ts-ignore
        const replaced = result.replaced
        //@ts-ignore
        const merged = result.merged
        let message = 'Tabset ' + newTabsetName.value + ' created successfully'
        if (replaced && merged) {
          message = 'Tabset ' + newTabsetName.value + ' was updated'
        } else if (replaced) {
          message = 'Tabset ' + newTabsetName.value + ' was overwritten'
        }
        router.push("/tabset")
        $q.notify({
          message: message,
          type: 'positive'
        })
      }).catch((ex: any) => {
      console.error("ex", ex)
      $q.notify({
        message: 'There was a problem creating the tabset ' + newTabsetName.value,
        type: 'warning',
      })

    }).finally(() => {
      $q.loadingBar.stop()
    })
    //   }
    // )

    bookmarkFolderForImport.value = ''
  }
}

const newTabsetDialogWarning = () => {
  if (newTabsetName.value.trim() === 'current') {
    return "Please use a different name, 'current' is reserved"
  }
  if (tabsStore.nameExistsInContextTabset(newTabsetName.value)) {
    return "Tabset " + newTabsetName.value + " already exists. Please choose:"
  }
  return ""
}

const deleteDialog = () => {
  $q.dialog({
    title: 'Deleting Tabset',
    message: 'Would you like to delete this tabset?',
    cancel: true,
    persistent: true
  }).onOk((data: any) => {
    TabsetService.delete(tabsStore.currentTabsetId)
    router.push("/browser")
  }).onCancel(() => {
  }).onDismiss(() => {
  })
}


</script>

<style lang="sass" scoped>
.drop-zone
  background-color: #eee
  margin-bottom: 10px
  padding: 10px

.v-enter-active,
.v-leave-active
  transition: opacity 0.5s ease

.v-enter-from,
.v-leave-to
  opacity: 0

</style>
