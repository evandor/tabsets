<template>

  <q-list class="q-mt-md">

    <q-item-label header v-if="_.find(tabsets(), ts => ts.persistence === TabsetPersistence.FIREBASE)">Tabsets
      (synced)
    </q-item-label>

    <q-item v-for="tabset in _.filter(tabsets(), ts => ts.persistence === TabsetPersistence.FIREBASE)"
            :key="'fb_' + tabset.id"
            clickable v-ripple
            @click="selectTabset(tabset.id)"
            @mouseover="showDeleteButton.set(tabset.id, true)"
            @mouseleave="showDeleteButton.set(tabset.id, false)"
            :style="tabset.id === tabsStore.currentTabsetId ? 'background-color:#efefef' : 'border:0px solid #bfbfbf'">

      <q-item-section
        @drop="onDrop($event, tabset.id)"
        @dragover.prevent
        @dragenter.prevent>
        <q-item-label v-text="tabsetLabel(tabset)"/>
      </q-item-section>
      <q-item-section avatar v-if="showDeleteButton.get(tabset.id)">
        <q-icon name="delete_outline" color="negative" size="2em" @click="deleteDialog">
          <q-tooltip>Delete this tabset</q-tooltip>
        </q-icon>
      </q-item-section>
    </q-item>

    <q-item-label header
                  v-if="_.find(tabsets(), ts => (!ts.status || ts.status === TabsetStatus.DEFAULT))">
      Tabsets <span v-if="tabsStore.tabsets.size > 3">({{ tabsStore.tabsets.size }})</span>
    </q-item-label>

    <div class="text-body2 q-pa-lg" v-if="tabsStore.tabsets.size === 0">
      <transition>
        Currently, you do not have any tabsets defined. Click on "NEW TABSET" to get started.
      </transition>
    </div>

    <q-item
      v-for="tabset in tabsets()"
      :key="tabset.id"
      clickable v-ripple
      @click="selectTabset(tabset.id)"
      @mouseover="showDeleteButton.set(tabset.id, true)"
      @mouseleave="showDeleteButton.set(tabset.id, false)"
      :style="tabset.id === tabsStore.currentTabsetId ? 'background-color:#efefef' : 'border:0px solid #bfbfbf'">

      <q-item-section
        @drop="onDrop($event, tabset.id)"
        @dragover.prevent
        @dragenter.prevent>
        <q-item-label v-text="tabsetLabel(tabset)"/>
      </q-item-section>

      <q-item-section avatar v-if="tabsetDiff.get(tabset.id)['result'] === 'inBoth'">
        <q-icon name="highlight_off" color="warning" size="2em" @click="deleteDialog">
          <q-tooltip>Delete this tabset, it has already been synced</q-tooltip>
        </q-icon>
      </q-item-section>

      <!--      <q-item-section avatar v-if="tabsetDiff.get(tabset.id)['result'] === 'onlyLocal'">-->
      <!--        <q-icon name="sync" color="warning" size="2em" @click="deleteDialog">-->
      <!--          <q-tooltip>Sync this tabset with the cloud to access it from other machines</q-tooltip>-->
      <!--        </q-icon>-->
      <!--      </q-item-section>-->

      <q-item-section avatar v-show="showDeleteButton.get(tabset.id)">
        <q-icon name="delete_outline" color="negative" size="2em" @click="deleteDialog">
          <q-tooltip>Delete this tabset</q-tooltip>
        </q-icon>
      </q-item-section>
    </q-item>

  </q-list>

  <q-list class="q-mt-md" v-if="featuresStore.bookmarksEnabled">

    <q-item-label header>Bookmarks</q-item-label>

    <q-tree
      :nodes="bookmarksTree"
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
import {ref, watchEffect} from "vue";
import {uid, useQuasar} from "quasar";
import {Tabset, TabsetPersistence, TabsetStatus} from "src/models/Tabset";
import {Tab} from "src/models/Tab";
import {useFeatureTogglesStore} from "stores/featureTogglesStore";
import {TreeNode} from "src/models/Tree";
import ChromeApi from "src/services/ChromeApi";
import ChromeListeners from "src/services/ChromeListeners";

const router = useRouter()
const tabsStore = useTabsStore()
const featuresStore = useFeatureTogglesStore()

const showDeleteButton = ref<Map<string, boolean>>(new Map())
const $q = useQuasar();
const tabsetToShow = ref<Tabset>(null as unknown as Tabset)

const tabsetDiff = ref<Map<string, object>>(new Map())

const showImportTabsetDialog = ref(false)
const bookmarkFolderForImport = ref<string>('')

const newTabsetName = ref('')
const merge = ref(false)

const simple = [
  {
    label: 'Satisfied customers (with avatar)',
    avatar: 'https://cdn.quasar.dev/img/boy-avatar.png',
    header: 'node',
    id: "a",
    children: [
      {
        label: 'Good food (with icon)',
        icon: 'restaurant_menu',
        id: "b",
        header: 'node',
        children: [
          {
            id: "c", header: 'leaf',
            label: 'Quality ingredients'
          },
          {
            id: "d", header: 'leaf',
            label: 'Good recipe'
          }
        ]
      },
      {
        label: 'Good service (disabled node with icon)',
        icon: 'room_service',
        disabled: true,
        id: "e",

        header: 'node',
        children: [
          {
            id: "f", header: 'leaf',
            label: 'Prompt attention'
          },
          {
            id: "g", header: 'leaf',
            label: 'Professional waiter'
          }
        ]
      }
    ]
  }
]

const selectTabset = (tabsetId: string) => {
  TabsetService.selectTabset(tabsetId)
  // if ('current' === tabsetId) {
  //   router.push("/browser")
  //   return
  // }
  // if ('pending' === tabsetId) {
  //   router.push("/pending")
  //   return
  // }
  router.push("/tabset")
}

watchEffect(() => {
  const tsLocal: Tabset[] = _.filter([...tabsStore.tabsets.values()], (t: Tabset) => !t.persistence || t.persistence === TabsetPersistence.INDEX_DB)
  const tsFirebase: Tabset[] = _.filter([...tabsStore.tabsets.values()], (t: Tabset) => t.persistence === TabsetPersistence.FIREBASE)
  const tsLocalIds: string[] = _.map(tsLocal, t => t.id)
  const tsFirebaseIds: string[] = _.map(tsFirebase, t => t.id.replace("X_", ""))
  // console.log("tsLocalIds", tsLocalIds)
  // console.log("tsFirebaseIds", tsFirebaseIds)
  const onlyLocal = tsLocalIds.filter(x => !tsFirebaseIds.includes(x));
  // console.log("onlyLocal", onlyLocal)

  const onlyRemote = tsFirebaseIds.filter(x => !tsLocalIds.includes(x));
  // console.log("onlyRemote", onlyRemote)

  let inBoth = tsFirebaseIds.filter(x => tsLocalIds.includes(x));
  // console.log("inBoth", inBoth)

  _.forEach(inBoth, tsId => {
    const t1: Tab = _.filter(tsLocal, x => x.id === tsId)[0] as unknown as Tab
    const t2: Tab = _.filter(tsFirebase, x => x.id === "X_" + tsId)[0] as unknown as Tab

    if (t1 && t2) {
      const val = {
        result: 'inBoth'
      }
      tabsetDiff.value.set(tsId, val)
    }
  })

  _.forEach(onlyLocal, tsId => {
    const val = {
      result: 'onlyLocal'
    }
    tabsetDiff.value.set(tsId, val)
  })

  _.forEach(onlyRemote, tsId => {
    const val = {
      result: 'onlyRemote'
    }
    tabsetDiff.value.set(tsId, val)
  })
})

const tabsets = () => {
  //console.log("tabsets", [...tabsStore.tabsets.values()])
  return _.sortBy([...tabsStore.tabsets.values()], ['name'])
}

const showTabset = (tabset: Tabset) => {
  console.log("showingTabset", tabset)
  tabsetToShow.value = tabset
}

const onDrop = (evt: DragEvent, tabsetId: string) => {
  if (evt.dataTransfer && tabsetId) {
    const tabId = evt.dataTransfer.getData('text/plain')
    TabsetService.moveToTabset(tabId, tabsetId)
  } else {
    console.log("got error dropping tab", tabsetId)
  }
}

const tabsetLabel = (tabset: Tabset) => {
  return tabset.tabs?.length > 1 ? tabset.name + ' (' + tabset.tabs?.length + ' tabs)' : tabset.name + ' (' + tabset.tabs?.length + ' tab)'
}

const expanded = ref([])

const bookmarksTree = ref<object[]>([])

function getChildren(parent: chrome.bookmarks.BookmarkTreeNode, level: number = 1): TreeNode[] {
  if (parent && parent.children) {
    const children = _.map(parent.children, c => {
      const children = getChildren(c)
      return new TreeNode(
        c.id,
        c.title,
        c.url ? c.title : c.title + ' (' + children.length + ')',
        c.url ? 'o_article' : 'o_folder',
        children)
    })
    return children
  } else {
    return [];
  }
}

const importFromBookmarks = (prop: any) => {
  console.log("import from bookmarks", prop)
  showImportTabsetDialog.value = true
  newTabsetName.value = prop.node.title
  bookmarkFolderForImport.value = prop.key
}
if (featuresStore.bookmarksEnabled) {

  chrome.bookmarks.getTree(
    (a: chrome.bookmarks.BookmarkTreeNode[]) => {
      //console.log("a[0].children", a[0].children)
      _.forEach(a[0].children, parent => {
        const children: TreeNode[] = getChildren(parent)
        const treeNode = new TreeNode(parent.id, parent.title, parent.title, 'o_folder', children)
        bookmarksTree.value.push(treeNode)
      })
      // console.log("bookmarksTree.value", bookmarksTree.value)
    }
  )
}

const tabNameExists = () => tabsStore.nameExistsInContextTabset(newTabsetName.value)

const newTabsetDialogWarning = () => {
  if (newTabsetName.value.trim() === 'current') {
    return "Please use a different name, 'current' is reserved"
  }
  if (tabsStore.nameExistsInContextTabset(newTabsetName.value)) {
    return "Tabset " + newTabsetName.value + " already exists. Please choose:"
  }
  return ""
}

const createChromeTab = async (openerId: number, url: string): Promise<chrome.tabs.Tab> => {
  // @ts-ignore
  const chromeTab: chrome.tabs.Tab = await chrome.tabs.create({url:url, openerTabId: openerId,active:false})
  return chromeTab
}

const importBookmarks = async () => {
  console.log("importing bookmarks", bookmarkFolderForImport.value)
  if (featuresStore.bookmarksEnabled) {
    const candidates: chrome.bookmarks.BookmarkTreeNode[] = await ChromeApi.childrenFor(bookmarkFolderForImport.value)
    console.log("got candidates", candidates)
    // ChromeListeners.createThumbnails(false)
    const extensionTab:chrome.tabs.Tab = await ChromeApi.getCurrentTab()
    const tabsPromises: Promise<chrome.tabs.Tab>[] = _.map(
      _.filter(
        candidates,
        (c: chrome.bookmarks.BookmarkTreeNode) => {
          //console.log("got c", c)
          return (c.url !== undefined && c.parentId === bookmarkFolderForImport.value)
        }),
      async (t: chrome.bookmarks.BookmarkTreeNode) => {
        const existingTabsForUrl = await ChromeApi.tabsForUrl(t.url)
        let chromeTab: chrome.tabs.Tab
        if (existingTabsForUrl.length > 0) {
          console.log("existingTabsForUrl", t.url, existingTabsForUrl)
          chromeTab = existingTabsForUrl[0]
        } else {
          chromeTab = await createChromeTab(extensionTab.id || 0, t.url || '')
        }
        console.log("created new tab", chromeTab)
        // if (chromeTab.id) {
        //   chrome.tabs.remove(chromeTab.id)
        // }
        return chromeTab
      })

    // Promise.all(tabsPromises)
    //   .then((tabs: chrome.tabs.Tab[]) => {
    //       console.log("got tabs", tabs)
          TabsetService.saveOrReplace(newTabsetName.value, [], true)
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

          })//.finally(() => ChromeListeners.createThumbnails(true))
      //   }
      // )

    bookmarkFolderForImport.value = ''
  }
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
