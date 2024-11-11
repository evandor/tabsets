<template>

  <q-page class="darkInDarkMode brightInBrightMode" style="padding-top: 60px">

    <div class="row q-ma-none q-pa-none items-start">
      <div>
        <Draggable v-if="treeData"
                   class="q-pl-md" v-model="treeData"
                   @change="ondrop2($event)"
                   :treeLine="false" :tree-line-offset="0" :defaultOpen="true"
                   :indent="25">
          <template #default="{ node, stat }">
            <!-- v-if="stat.children.length"-->
            <OpenIcon
              :open="stat.open"
              @click.native="stat.open = !stat.open"
            />
            <!--            <q-icon v-else name="remove" color="white"/>-->
            <!--            <span v-else class="q-ma-none q-ml-md" style="background-color:yellow"></span>-->
            <span class="mtl-ml cursor-pointer" @click="handleTreeClick(node)">
              <q-icon v-if="node.level == 0" name="o_tab" color="primary" class="q-mx-sm"/>
              <q-icon v-else name="o_folder" color="warning" class="q-mx-sm"/>
              {{ node.text }}
            </span>
          </template>
        </Draggable>
      </div>

    </div>


    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">
      <SidePanelCollectionsPageToolbar :show-search-box="false"/>
    </q-page-sticky>
  </q-page>

</template>

<script lang="ts" setup>

import {onMounted, onUnmounted, ref, watchEffect} from "vue";
import {useUiStore} from "src/ui/stores/uiStore";
import Analytics from "src/core/utils/google-analytics";
import {useI18n} from 'vue-i18n'
import {Tabset, TabsetStatus} from "src/tabsets/models/Tabset";
import _ from "lodash"
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {SelectTabsetCommand} from "src/tabsets/commands/SelectTabset";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {useRouter} from "vue-router";
import SidePanelCollectionsPageToolbar from "pages/sidepanel/helper/SidePanelCollectionsPageToolbar.vue";
import {useFeaturesStore} from "src/features/stores/featuresStore";
import {FeatureIdent} from "src/app/models/FeatureIdent";
import {useSpacesStore} from "src/spaces/stores/spacesStore";
import {dragContext, Draggable, OpenIcon} from "@he-tree/vue";
import '@he-tree/vue/style/default.css'
import {useTabsetService} from "src/tabsets/services/TabsetService2";
import {DeleteTabsetFolderCommand} from "src/tabsets/commands/DeleteTabsetFolderCommand";

const {t} = useI18n({locale: navigator.language, useScope: "global"})

type NodeTreeObject = { text: string, id: string, tsId: string, level: number, url: string, children: NodeTreeObject[] }

const router = useRouter()

const tabsets = ref<Tabset[]>([])
const treeData = ref<NodeTreeObject[]>()

function updateOnlineStatus(e: any) {
  const {type} = e
  useUiStore().networkOnline = type === 'online'
}

onMounted(() => {
  // window.addEventListener('keypress', checkKeystroke);

  window.addEventListener("offline", (e) => updateOnlineStatus(e));
  window.addEventListener("online", (e) => updateOnlineStatus(e));

  Analytics.firePageViewEvent('SidePanelPage', document.location.href)
})

onUnmounted(() => {
  // window.removeEventListener('keypress', checkKeystroke);
})

const ondrop2 = (evt: any) => {
  // console.log("===> evt", evt)
  // console.log("===> dragNode2", dragContext.dragNode)
  // console.log("===> startInfo2", dragContext.startInfo)
  // console.log("===> startTree2", dragContext.startTree)
  // console.log("===> targetInfo2", dragContext.targetInfo)
  // console.log("===> targetTree2", dragContext.targetTree)
  console.log("")
  const dragged = dragContext?.dragNode?.data
  const draggedTo = dragContext.targetInfo?.parent?.data
  console.log("dragged: ", dragged)
  // console.log("over2: ", dragContext?.dragNode?.dragNode)
  console.log("over", draggedTo)
  // console.log("===>", dragContext.targetInfo)
  if (dragged && draggedTo) {
    console.log(`moving ${dragged.text} (${dragged.id}, root=${dragged.id === dragged.tsId}) to ${draggedTo.text} (${draggedTo.id}) root=${draggedTo.id === draggedTo.tsId}`)

    if (dragged.id === dragged.tsId && draggedTo.id === draggedTo.tsId) { // two roots
      console.log("dragging root to root")
      const beingDraggedTs: Tabset | undefined = useTabsetsStore().getTabset(dragged.id)
      const beingDraggedToTs: Tabset | undefined = useTabsetsStore().getTabset(draggedTo.id)
      if (beingDraggedTs && beingDraggedToTs) {
        beingDraggedTs.folderActive = undefined
        beingDraggedTs.folderParent = beingDraggedToTs.id
        beingDraggedToTs.folders.push(beingDraggedTs)
        useTabsetsStore().saveTabset(beingDraggedToTs)
        useTabsetsStore().deleteTabset(beingDraggedTs.id)
      }
    } else if (dragged.id !== dragged.tsId && draggedTo.id === draggedTo.tsId) { // dragging non-root to root
      console.log("dragging non-root to root, no-op")
    } else if (dragged.id !== dragged.tsId && draggedTo.id !== draggedTo.tsId) { // dragging non-root to non-root
      console.log("dragging non-root to non-root")
      const draggedTabset: Tabset | undefined = useTabsetsStore().getTabset(dragged.tsId)
      const draggedToTabset: Tabset | undefined = useTabsetsStore().getTabset(draggedTo.tsId)
      if (draggedTabset && draggedToTabset) {
        const beingDraggedFolder: Tabset | undefined = useTabsetsStore().getActiveFolder(draggedTabset, dragged.id)
        const beingDraggedToFolder: Tabset | undefined = useTabsetsStore().getActiveFolder(draggedToTabset, draggedTo.id)
        if (beingDraggedFolder && beingDraggedToFolder) {
          console.log(`moving ${beingDraggedFolder.name} (${beingDraggedFolder.id}) to ${beingDraggedToFolder.name} (${beingDraggedToFolder.id})`)

          beingDraggedFolder.folderActive = undefined
          beingDraggedFolder.folderParent = beingDraggedToFolder.id
          beingDraggedToFolder.folders.push(beingDraggedFolder)
          useTabsetsStore().saveTabset(draggedToTabset)
          useCommandExecutor().execute(new DeleteTabsetFolderCommand(draggedTabset, beingDraggedFolder))
        }
      }
    } else if (dragged.id === dragged.tsId && draggedTo.id !== draggedTo.tsId) {
      const draggedTs: Tabset | undefined = useTabsetsStore().getTabset(dragged.id)
      const draggedToTabset: Tabset | undefined = useTabsetsStore().getTabset(draggedTo.tsId)
      if (draggedTs && draggedToTabset) {
        const draggedToFolder: Tabset | undefined = useTabsetsStore().getActiveFolder(draggedToTabset, draggedTo.id)
        if (draggedToFolder) {
          draggedTs.folderActive = undefined
          draggedTs.folderParent = draggedToFolder.id
          draggedToFolder.folders.push(draggedTs)
          useTabsetsStore().saveTabset(draggedToTabset)
          useTabsetsStore().deleteTabset(draggedTs.id)
        }
      }
    } else {
      console.log("not handled yet")
    }

  } else if (dragged) {
    if (dragged.id !== dragged.tsId) { // dragging non-root to root
      console.log("dragging non-root to root II", dragged.id, dragged.tsId)
      const tabset: Tabset | undefined = useTabsetsStore().getTabset(dragged.tsId)
      console.log("got tabset", tabset)
      if (tabset) {
        const beingDraggedTs: Tabset | undefined = useTabsetsStore().getActiveFolder(tabset, dragged.id)
        console.log("beingDraggedTs", beingDraggedTs)
        if (beingDraggedTs) {
          beingDraggedTs.folderActive = undefined
          beingDraggedTs.folderParent = undefined
          useTabsetService().saveTabset(beingDraggedTs)
          useCommandExecutor().execute(new DeleteTabsetFolderCommand(tabset, beingDraggedTs))
        }
      }
    }
  } else {
    console.log("not handled yet II")
  }
}

function treeNodeFromNote(n: Tabset, rootId: string = n.id, level = 0): NodeTreeObject {
  return {
    text: n.name,
    id: n.id,
    tsId: rootId,
    level,
    url: chrome.runtime.getURL(`/www/index.html#/mainpanel/notes/${n.id}`),
    children: _.map(n.folders, (f: Tabset) => {
      return treeNodeFromNote(f, rootId, level + 1)
    })
  }
}

watchEffect(async () => {
  if (tabsets.value && tabsets.value.length > 0) {
    const useSpaces = useFeaturesStore().hasFeature(FeatureIdent.SPACES)
    const space = useSpacesStore().space
    treeData.value = tabsets.value
      .filter((ts: Tabset) => ts.status !== TabsetStatus.ARCHIVED)
      .filter((ts: Tabset) => {
        if (useSpaces && space) {
          return ts.spaces.indexOf(space.id) >= 0
        } else if (useSpaces && !space) {
          return ts.spaces.length === 0
        }
        return true
      })
      .map((f: Tabset) => {
        return treeNodeFromNote(f)
      })
      .sort((a, b) => a.text.localeCompare(b.text))
  }
})

const getTabsetOrder =
  [
    function (o: Tabset) {
      return o.status === TabsetStatus.FAVORITE ? 0 : 1
    },
    function (o: Tabset) {
      return o.name?.toLowerCase()
    }
  ]

watchEffect(async () => {
  if (useFeaturesStore().hasFeature(FeatureIdent.SPACES)) {
    const currentSpace = useSpacesStore().space
    // console.log("currentspace", currentSpace)
    tabsets.value = _.sortBy(
      _.filter([...useTabsetsStore().tabsets.values()] as Tabset[], (ts: Tabset) => {
        if (currentSpace) {
          if (ts.spaces.indexOf(currentSpace.id) < 0) {
            return false
          }
        }
        return ts.status !== TabsetStatus.DELETED &&
          ts.status !== TabsetStatus.HIDDEN &&
          ts.status !== TabsetStatus.ARCHIVED
      }),
      getTabsetOrder, ["asc"])
  } else {
    tabsets.value = [...useTabsetsStore().tabsets.values()]
  }
})

const handleTreeClick = (node: NodeTreeObject) => {
  // console.log("clicked", node)
  useCommandExecutor().execute(new SelectTabsetCommand(node.tsId, node.id))
    .then((res: ExecutionResult<Tabset | undefined>) => {
      if (res.result) {
        router.push("/sidepanel")
      }
    })
}

</script>

<style lang="scss">

.fitpage {
  height: calc(100vh - 130px);
}

</style>
