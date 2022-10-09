<template>

  <q-list class="q-mt-md">

    <q-item-label header>Bookmarks</q-item-label>

    <q-tree
      :nodes="bookmarksStore.bookmarksNodes"
      node-key="id"
      selected-color="dark"
      v-model:selected="selected"
      v-model:expanded="useNotificationsStore().bookmarksExpanded"
      @mouseout="selectDeleteButton('')"
    >
      <template v-slot:header-node="prop">

        <q-icon name="o_folder" class="q-mr-sm"/>
        <span class="cursor-pointer fit no-wrap"
              @mouseover="selectDeleteButton(prop.node.id)">{{ prop.node.label }}</span>

        <span class="text-right fit" v-show="showDeleteButton.get(prop.node.id)">
            <q-icon name="delete_outline" color="negative" size="18px" @click="deleteDialog">
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
import {ref, watch, watchEffect} from "vue";
import {useQuasar} from "quasar";
import {Tabset} from "src/models/Tabset";
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import {TreeNode} from "src/models/Tree";
import ChromeApi from "src/services/ChromeApi";
import {useBookmarksStore} from "stores/bookmarksStore";
import {useNotificationsStore} from "stores/notificationsStore";

const router = useRouter()
const tabsStore = useTabsStore()
const featuresStore = useFeatureTogglesStore()
const bookmarksStore = useBookmarksStore()

const $q = useQuasar();
const localStorage = useQuasar().localStorage


const showImportTabsetDialog = ref(false)
const bookmarkFolderForImport = ref<string>('')
const selected = ref('1')
const showDeleteButton = ref<Map<string, boolean>>(new Map())

const newTabsetName = ref('')
const merge = ref(false)
const bookmarksTree = ref<object[]>([])


watch(() => selected.value, (currentValue, oldValue) => {
  console.log("selected", selected.value, currentValue, oldValue)
  if (currentValue !== oldValue) {
    router.push("/bookmarks/" + selected.value)
  }
})

watchEffect(() => {
  localStorage.set("bookmarks.expanded", useNotificationsStore().bookmarksExpanded)
})

// watchEffect(() => console.log(showDeleteButton.value))

$q.loadingBar.setDefaults({
  color: 'positive',
  size: '10px',
  position: 'bottom'
})

const tabsets = () => {
  //console.log("tabsets", [...tabsStore.tabsets.values()])
  return _.sortBy([...tabsStore.tabsets.values()], ['name'])
}


const tabNameExists = () => tabsStore.nameExistsInContextTabset(newTabsetName.value)

const selectDeleteButton = (id: string) => {
  showDeleteButton.value = new Map()
  showDeleteButton.value.set(id, true)
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
