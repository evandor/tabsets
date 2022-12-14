<template>

  <q-list class="q-mt-md">

    <q-tree
      v-if="bookmarksPermissionGranted"
      :nodes="bookmarksStore.bookmarksNodes"
      node-key="id"
      selected-color="dark"
      @mouseenter="entered(true)"
      @mouseleave="entered(false)"
      v-model:selected="selected"
      v-model:expanded="useNotificationsStore().bookmarksExpanded">
      <template v-slot:header-node="prop">
        <q-icon name="o_folder" class="q-mr-sm"/>
        <span class="cursor-pointer fit no-wrap"
        >{{ prop.node.label }}</span>

        <span class="text-right fit" v-show="mouseHover && prop.node.id === deleteButtonId">
            <q-icon name="delete_outline" color="negative" size="18px" @click.stop="deleteBookmarksFolderDialog">
              <q-tooltip>Delete this folder</q-tooltip>
            </q-icon>
          </span>


        <!--        <q-menu :v-model="false" context-menu>-->
        <!--          <q-list style="min-width: 100px">-->
        <!--            <q-item clickable v-close-popup>-->
        <!--              <q-item-section @click="router.push('/bookmarks/' + prop.node.id)">Open</q-item-section>-->
        <!--            </q-item>-->
        <!--            <q-item clickable v-close-popup>-->
        <!--              <q-item-section @click="importFromBookmarks(prop)">Import as tabset</q-item-section>-->
        <!--            </q-item>-->
        <!--          </q-list>-->
        <!--        </q-menu>-->
      </template>
      <!--      <template v-slot:header-leaf="prop">-->
      <!--        <q-icon name="o_article" class="q-mr-sm"/>-->
      <!--        {{ prop.node.label }}/{{ prop.node.menuShowing }}-->
      <!--        <q-menu :v-model="false" context-menu>-->
      <!--          <q-list style="min-width: 100px">-->
      <!--            <q-item clickable v-close-popup>-->
      <!--              <q-item-section>{{ prop.node.label }}/{{ prop.key }}</q-item-section>-->
      <!--            </q-item>-->
      <!--            <q-item clickable v-close-popup>-->
      <!--              <q-item-section>ID: {{ prop.node.id }}</q-item-section>-->
      <!--            </q-item>-->
      <!--          </q-list>-->
      <!--        </q-menu>-->
      <!--      </template>-->
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
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import {useBookmarksStore} from "src/stores/bookmarksStore";
import {useNotificationsStore} from "src/stores/notificationsStore";
import BookmarksService from "src/services/BookmarksService";
import {usePermissionsStore} from "stores/permissionsStore";
import {useNotificationHandler} from "src/services/ErrorHandler";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {GrantPermissionCommand} from "src/domain/commands/GrantPermissionCommand";

const router = useRouter()
const tabsStore = useTabsStore()
const featuresStore = useFeatureTogglesStore()
const bookmarksStore = useBookmarksStore()
const permissionsStore = usePermissionsStore()

const $q = useQuasar();
const localStorage = useQuasar().localStorage

const mouseHover = ref(false)
const selected = ref('')
const deleteButtonId = ref('')
const newTabsetName = ref('')
const merge = ref(false)
const bookmarksPermissionGranted = ref<boolean | undefined>(undefined)

const {handleSuccess, handleError} = useNotificationHandler()

watchEffect(() => {
  bookmarksPermissionGranted.value = permissionsStore.hasPermission('bookmarks')
  useBookmarksStore().loadBookmarks()
})

watch(() => selected.value, (currentValue, oldValue) => {
  if (currentValue !== oldValue) {
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

const tabsets = () => {
  return _.sortBy([...tabsStore.tabsets.values()], ['name'])
}


const tabNameExists = () => tabsStore.nameExistsInContextTabset(newTabsetName.value)

const deleteBookmarksFolderDialog = () => {
  $q.dialog({
    title: 'Delete Bookmark Folder',
    message: 'Would you like to delete this folder and its subfolders and bookmarks? This cannot be undone',
    cancel: true,
    persistent: true
  }).onOk(() => {
    BookmarksService.deleteBookmarksFolder(selected.value)
    router.push("/start")
  }).onCancel(() => {
  }).onDismiss(() => {
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
