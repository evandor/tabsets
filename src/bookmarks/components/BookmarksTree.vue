<template>
  <q-list class="q-mt-none">
    <div class="row">
      <div class="col-12 text-right" v-if="props.showToggle">
        Show only Folders
        <q-checkbox v-model="showOnlyFolders" @click.stop="emits('toggleShowOnlyFolders')" />
      </div>
      <div class="col-12 q-mb-md" v-if="props.showFilter">
        <q-input
          dense
          ref="filterRef"
          filled
          v-model="filter"
          :label="showOnlyFolders ? 'Filter Bookmark Folders' : 'Filter Bookmarks and Folders'">
          <template v-slot:append>
            <q-icon v-if="filter !== ''" name="clear" class="cursor-pointer" @click="resetFilter" />
          </template>
        </q-input>
      </div>
    </div>

    <div class="row q-ma-lg fit items-center justify-center" v-if="useUiStore().bookmarksLoading">
      <q-spinner-dots color="primary" size="2em" />
    </div>

    <q-tree
      v-if="bookmarksPermissionGranted && !useUiStore().bookmarksLoading"
      :nodes="props.nodes"
      :filter="filter"
      :filterMethod="bookmarksFilter"
      node-key="id"
      @mouseenter="entered(true)"
      @mouseleave="entered(false)"
      v-model:selected="selected">
      <!--        v-model:expanded="useNotificationsStore().bookmarksExpanded">-->
      <template v-slot:header-node="prop">
        <q-icon name="o_folder" color="warning" class="q-mr-sm" />
        <span class="cursor-pointer fit no-wrap ellipsis"
          >{{ prop.node.label }}
          <span style="font-size: smaller" class="text-grey"> ({{ prop.node.subNodesCount }}) </span>
        </span>

        <span
          class="text-right"
          v-if="nodeActionsContain('add') && mouseHover && prop.node.id === deleteButtonId"
          style="width: 25px">
          <q-icon name="add" color="positive" size="18px" @click.stop="addCurrentTab">
            <q-tooltip>Add current tab</q-tooltip>
          </q-icon>
        </span>
        <span class="text-right" style="width: 25px" v-if="nodeActionsContain('delete')">
          <q-icon name="delete_outline" color="negative" size="18px" @click.stop="deleteBookmarksFolderDialog">
            <q-tooltip>Delete this folder</q-tooltip>
          </q-icon>
        </span>
        <span class="text-right" style="width: 25px" v-if="nodeActionsContain('import')">
          <q-icon
            :name="imported(prop.node) ? 'check' : 'upload_file'"
            :color="imported(prop.node) ? 'positive' : 'primary'"
            size="18px"
            @click.stop="importFrom(prop.node)">
            <q-tooltip>Import</q-tooltip>
          </q-icon>
        </span>
      </template>
      <template v-slot:header-leaf="prop">
        <q-img class="rounded-borders q-mr-sm" width="23px" height="23px" :src="favIconFromUrl(prop.node.url)" />
        <span class="cursor-pointer fit no-wrap ellipsis">{{ prop.node.label }}</span>
        <span class="text-right" v-if="mouseHover && prop.node.id === deleteButtonId" style="width: 25px">
          <q-icon name="delete_outline" color="negative" size="18px" @click.stop="deleteBookmark(prop.node.id)">
            <q-tooltip>Delete this Bookmark</q-tooltip>
          </q-icon>
        </span>
        <span class="text-right" v-else style="width: 25px">&nbsp;</span>
      </template>
    </q-tree>
  </q-list>
</template>

<script setup lang="ts">
import { uid, useQuasar } from 'quasar'
import { CreateBookmarkCommand } from 'src/bookmarks/commands/CreateBookmarkCommand'
import DeleteBookmarkFolderDialog from 'src/bookmarks/dialogues/DeleteBookmarkFolderDialog.vue'
import ImportFromBookmarksDialog from 'src/bookmarks/dialogues/ImportFromBookmarksDialog.vue'
import { Bookmark } from 'src/bookmarks/models/Bookmark'
import { TreeNode } from 'src/bookmarks/models/Tree'
import { useBookmarksStore } from 'src/bookmarks/stores/bookmarksStore'
import { useBookmarksTabsStore } from 'src/bookmarks/stores/bookmarksTabsStore'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useUtils } from 'src/core/services/Utils'
import NavigationService from 'src/services/NavigationService'
import { useUiStore } from 'src/ui/stores/uiStore'
import { onMounted, PropType, ref, watch, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const bookmarksStore = useBookmarksStore()

const $q = useQuasar()

const mouseHover = ref(false)
const selected = ref('')
const deleteButtonId = ref('')
const bookmarksPermissionGranted = ref<boolean>(true)
const filter = ref('')
const filterRef = ref(null)
const bmsCount = ref(0)
const foldersCount = ref(0)
const showOnlyFolders = ref(false)

const { favIconFromUrl } = useUtils()

const props = defineProps({
  inSidePanel: { type: Boolean, default: false },
  showFilter: { type: Boolean, default: true },
  showToggle: { type: Boolean, default: true },
  showOnlyFolders: { type: Boolean, default: true },
  nodesActions: { type: String, default: '' },
  nodes: { type: Object as PropType<TreeNode[]>, required: true },
})

const emits = defineEmits(['toggleShowOnlyFolders', 'imported'])

onMounted(() => {
  showOnlyFolders.value = props.showOnlyFolders
})

watchEffect(() => {
  foldersCount.value = bookmarksStore.foldersCount
  bmsCount.value = bookmarksStore.bookmarksCount
})

watch(
  () => selected.value,
  async (currentValue, oldValue) => {
    if (currentValue !== oldValue) {
      try {
        const result = await chrome.bookmarks.get(currentValue)
        console.log('selected ==>', currentValue, oldValue, result)
        if (result && result.length > 0 && result[0]!.url) {
          // we've got an actual bookmark
          useBookmarksStore().currentBookmark = new Bookmark(uid(), result[0]!)
          NavigationService.openSingleTab(result[0]!.url)
        } else {
          // we've got a folder
          useBookmarksStore().currentFolder = result[0]!
          if (props.inSidePanel) {
            NavigationService.openOrCreateTab(
              [chrome.runtime.getURL('/www/index.html#/mainpanel/bookmarks/' + selected.value)],
              undefined,
              [],
              true,
            )
          } else {
            router.push('/bookmarks/' + selected.value)
          }
        }
      } catch (err) {
        console.log(`catched error for 'selected' watch, currentValue=${currentValue}, oldValue=${oldValue}`, err)
        if (chrome.runtime.lastError) {
          console.warn('got runtime error', chrome.runtime.lastError)
        }
      }
    }
  },
)

watchEffect(() => {
  deleteButtonId.value = selected.value
})

$q.loadingBar.setDefaults({
  color: 'positive',
  size: '10px',
  position: 'bottom',
})

const deleteBookmarksFolderDialog = () => {
  $q.dialog({
    component: DeleteBookmarkFolderDialog,
    componentProps: {
      folderId: selected.value,
    },
  })
}

const addCurrentTab = async () => {
  const currentTab = useBookmarksTabsStore().currentChromeTab
  if (currentTab) {
    await useCommandExecutor().executeFromUi(new CreateBookmarkCommand(currentTab, selected.value))
  }
}

const entered = (b: boolean) => (mouseHover.value = b)

const bookmarksFilter = (node: any, filter: string) => {
  const filt = filter.toLowerCase()
  return node.label && node.label.toLowerCase().indexOf(filt) > -1
}

const resetFilter = () => {
  filter.value = ''
  if (filterRef.value) {
    // @ts-expect-error TODO
    filterRef.value.focus()
  }
}

const deleteBookmark = async (id: string) => {
  console.log('id', id)
  await chrome.bookmarks.remove(id)
}

const nodeActionsContain = (ident: string) => props.nodesActions.split(',').indexOf(ident) >= 0

const importFrom = (node: TreeNode) => {
  $q.dialog({
    component: ImportFromBookmarksDialog,
    componentProps: {
      count: node.subNodesCount,
      bmId: Number(node.id),
      bmTitle: node.label,
      foldersCount: node.subFoldersCount,
      inSidePanel: true,
    },
  }).onOk((a: any) => {
    console.log('ExecutionResult', a)
    //useTabsetsStore().selectCurrentTabset()
    //router.push("/sidepanel")
    emits('imported', a)
  })
}

const imported = (node: TreeNode) => {
  const imported: string[] = useUiStore().importedBookmarks
  return imported.indexOf(node.id) >= 0
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
