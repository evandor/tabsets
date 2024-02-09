<template>

  <q-list class="q-mt-md">

    <q-tree
      v-if="bookmarksPermissionGranted"
      :nodes="bookmarksStore.bookmarksNodes"
      node-key="id"
      @mouseenter="entered(true)"
      @mouseleave="entered(false)"
      v-model:selected="selected"
      v-model:expanded="useNotificationsStore().bookmarksExpanded">
      <template v-slot:header-node="prop">
        <q-icon name="o_folder" class="q-mr-sm"/>
        <span class="cursor-pointer fit no-wrap">{{ prop.node.label }}</span>

        <span class="text-right fit" v-show="mouseHover && prop.node.id === deleteButtonId">
            <q-icon name="delete_outline" color="negative" size="18px" @click.stop="deleteBookmarksFolderDialog">
              <q-tooltip>Delete this folder</q-tooltip>
            </q-icon>
          </span>

      </template>

    </q-tree>

    <q-banner class="bg-yellow-1" v-else>
      No permissions granted.<br><br>
      Click <span class="cursor-pointer text-blue-6" style="text-decoration: underline"
                  @click="grant('bookmarks')">here</span> to
      grant permissions for the tabset extension to access your bookmarks.
    </q-banner>

  </q-list>

</template>

<script setup lang="ts">

import {useRouter} from "vue-router";
import {useTabsStore} from "src/stores/tabsStore";
import _ from "lodash"
import {ref, watch, watchEffect} from "vue";
import {useQuasar} from "quasar";
import {useBookmarksStore} from "src/stores/bookmarksStore";
import {useNotificationsStore} from "src/stores/notificationsStore";
import BookmarksService from "src/services/BookmarksService";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {useNotificationHandler} from "src/services/ErrorHandler";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {GrantPermissionCommand} from "src/domain/commands/GrantPermissionCommand";
import {useSettingsStore} from "src/stores/settingsStore"
import NavigationService from "src/services/NavigationService";
import {FeatureIdent} from "src/models/AppFeature";
import NewTabsetDialog from "components/dialogues/NewTabsetDialog.vue";
import DeleteBookmarkFolderDialog from "components/dialogues/bookmarks/DeleteBookmarkFolderDialog.vue";

const router = useRouter()
const bookmarksStore = useBookmarksStore()
const permissionsStore = usePermissionsStore()

const $q = useQuasar();
const localStorage = useQuasar().localStorage

const mouseHover = ref(false)
const selected = ref('')
const deleteButtonId = ref('')
const bookmarksPermissionGranted = ref<boolean | undefined>(undefined)

const {handleSuccess, handleError} = useNotificationHandler()

const props = defineProps({
  inSidePanel: {type: Boolean, default: false}
})

watchEffect(() => {
  bookmarksPermissionGranted.value = permissionsStore.hasFeature(FeatureIdent.BOOKMARKS)
  useBookmarksStore().loadBookmarks()
})

watch(() => selected.value, (currentValue, oldValue) => {
  if (currentValue !== oldValue) {
    props.inSidePanel ?
      NavigationService.openOrCreateTab(
        [chrome.runtime.getURL("/www/index.html#/mainpanel/bookmarks/" + selected.value)], undefined, [], true) :
      router.push("/bookmarks/" + selected.value)
  }
})

watchEffect(() => {
  localStorage.set("bookmarks.expanded", useNotificationsStore().bookmarksExpanded)
})

watchEffect(() => {
  deleteButtonId.value = selected.value
})

$q.loadingBar.setDefaults({
  color: 'positive',
  size: '10px',
  position: 'bottom'
})

const deleteBookmarksFolderDialog = () => {
  $q.dialog({
    component: DeleteBookmarkFolderDialog,
    componentProps: {
      folderId: selected.value
    }
  })
}

const entered = (b: boolean) => mouseHover.value = b

const grant = (permission: string) => useCommandExecutor().executeFromUi(new GrantPermissionCommand(permission))

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
