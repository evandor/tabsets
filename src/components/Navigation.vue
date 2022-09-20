<template>


  <q-list class="q-mt-md">

    <q-item-label header v-if="_.find(tabsets(), ts => ts.persistence === TabsetPersistence.FIREBASE)">Tabsets
      (synced)
    </q-item-label>

    <q-item v-for="tabset in _.filter(tabsets(), ts => ts.persistence === TabsetPersistence.FIREBASE)"
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
      <q-item-section avatar v-if="showDeleteButton.get(tabset.id)">
        <q-icon name="delete_outline" color="negative" size="2em" @click="deleteDialog">
          <q-tooltip>Delete this tabset</q-tooltip>
        </q-icon>
      </q-item-section>
    </q-item>

    <q-item-label header
                  v-if="_.find(tabsets(), ts => !ts.persistence || ts.persistence === TabsetPersistence.INDEX_DB)">
      Tabsets
    </q-item-label>

    <div class="text-body2 q-pa-lg" v-if="tabsStore.tabsets.size === 0">
      <transition>
        Currently, you do not have any tabsets defined. Click on "new tabset" to get started.
      </transition>
    </div>

    <q-item
      v-for="tabset in _.filter(tabsets(), ts => (!ts.persistence || ts.persistence === TabsetPersistence.INDEX_DB))"
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
      <q-item-section avatar v-if="showDeleteButton.get(tabset.id)">
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
      node-key="label"
      v-model:expanded="expanded"
    />


  </q-list>


</template>

<script setup lang="ts">

import TabsetService from "src/services/TabsetService";
import {useRouter} from "vue-router";
import {useTabsStore} from "stores/tabsStore";
import _ from "lodash"
import {ref} from "vue";
import {useQuasar} from "quasar";
import {Tabset, TabsetPersistence} from "src/models/Tabset";
import {useFeatureTogglesStore} from "stores/featureTogglesStore";
import {TreeNode} from "src/models/Tree";

const router = useRouter()
const tabsStore = useTabsStore()
const featuresStore = useFeatureTogglesStore()

const newTabsetName = ref('new name')
const showDeleteButton = ref<Map<string, boolean>>(new Map())
const $q = useQuasar();
const tabsetToShow = ref<Tabset>(null as unknown as Tabset)

const selectTabset = (tabsetId: string) => {
  TabsetService.selectTabset(tabsetId)
  if ('current' === tabsetId) {
    router.push("/browser")
    return
  }
  if ('pending' === tabsetId) {
    router.push("/pending")
    return
  }
  router.push("/tabset")
}

const tabsets = () => {
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
      //console.log("adding children", c)
      const children = getChildren(c)
      return new TreeNode(
        c.url ? c.title : c.title + ' (' + children.length + ')',
        c.url ? 'o_article' : 'o_folder',
        children)
    })
    //console.log("got children", children)
    return children
  } else {
    return [];
  }
}

chrome.bookmarks.getTree(
  (a: chrome.bookmarks.BookmarkTreeNode[]) => {
    console.log("a[0].children", a[0].children)
    _.forEach(a[0].children, parent => {
      const children: TreeNode[] = getChildren(parent)

      const treeNode = new TreeNode(parent.title, 'o_folder', children)
      // const treeNode = {
      //   label: parent.title,
      //   children: children
      // }
      //console.log("treeNode", treeNode)
      bookmarksTree.value.push(treeNode)
    })
    console.log("bookmarksTree.value", bookmarksTree.value)
  }
)

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
