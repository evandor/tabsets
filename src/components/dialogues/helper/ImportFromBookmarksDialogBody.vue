<template>
  <div>
    <q-form @submit.prevent="importBookmarks()" ref="theForm">

      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Import these {{ props.count }} Bookmarks as Tabset</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="text-body">New Tabset's name:</div>

          <q-input v-model="newTabsetName"
                   class="q-mb-md q-pb-none"
                   dense autofocus
                   @update:model-value="val => checkIsValid()"
                   :rules="[
                       val => Tabset.newTabsetNameIsValid(val) || 'Please do not use special Characters',
                       val => Tabset.newTabsetNameIsShortEnough(val) || 'the maximum length is 32',
                       val => doesNotExistYet(val) || 'Tabset already exists'
                       ]"
                   data-testid="newTabsetName"/>

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
          <q-radio v-model="merge" val="true" label="Merge" v-if="tabNameExists()"></q-radio>
          <q-radio v-model="merge" val="false" label="Overwrite" v-if="tabNameExists()"></q-radio>


        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn label="Cancel" size="sm" color="accent" v-close-popup/>
          <q-btn label="Create new Tabset" color="warning" size="sm"
                 data-testid="newTabsetNameSubmit"
                 :disable="!isValid" v-close-popup/>
        </q-card-actions>
      </q-card>
    </q-form>
  </div>

</template>

<script lang="ts" setup>

import {ref} from "vue";
import {QForm, useQuasar} from "quasar";
import {useRoute, useRouter} from "vue-router";
import {useTabsStore} from "stores/tabsStore";

import {useDialogPluginComponent} from 'quasar'
import ChromeApi from "src/services/ChromeApi";
import {useBookmarksStore} from "stores/bookmarksStore";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {CreateTabsetFromBookmarksCommand} from "src/domain/tabsets/CreateTabsetFromBookmarks";
import {Tabset, TabsetStatus} from "src/models/Tabset";

defineEmits([
  ...useDialogPluginComponent.emits
])

const props = defineProps({
  inSidePanel: {type: Boolean, default: false},
  count: {type: Number, default: 0}
})

const {dialogRef, onDialogHide, onDialogCancel} = useDialogPluginComponent()

const bookmarksStore = useBookmarksStore()
const tabsStore = useTabsStore()
const router = useRouter()
const route = useRoute()
const $q = useQuasar()

const theForm = ref<QForm>(null as unknown as QForm)
const newTabsetName = ref(bookmarksStore.currentBookmark.chromeBookmark.title)
const bookmarkId = ref(bookmarksStore.currentBookmark.chromeBookmark.id)
const merge = ref(false)
const isValid = ref(false)
const deleteBookmarks = ref(false)

const tabNameExists = () => tabsStore.nameExistsInContextTabset(newTabsetName.value)

const newTabsetDialogWarning = () => {
  if (tabsStore.nameExistsInContextTabset(newTabsetName.value)) {
    return "Tabset " + newTabsetName.value + " already exists. Please choose:"
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

const doesNotExistYet = (val: string) => {
  const existsInTabset = tabsStore.existingInTabset(val)
  return !(existsInTabset && existsInTabset.status !== TabsetStatus.DELETED)
}


const importBookmarks = async () => {
  // const bookmarkId = props.folderId //route.params.id as string
  console.log("importing bookmarks", bookmarkId.value)
  $q.loadingBar?.start()

  const candidates: chrome.bookmarks.BookmarkTreeNode[] = await ChromeApi.childrenFor(bookmarkId.value)
  useCommandExecutor()
      .executeFromUi(new CreateTabsetFromBookmarksCommand(newTabsetName.value, candidates))
      .then(res => {
        props.inSidePanel ?
            router.push("/mainpanel/tabsets/" + tabsStore.currentTabsetId) :
            router.push("/tabsets/" + tabsStore.currentTabsetId)
      })

  $q.loadingBar?.stop()
}


</script>
