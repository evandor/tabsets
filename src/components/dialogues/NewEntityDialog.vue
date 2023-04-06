<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">{{ props.heading }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="text-body">New Collection's name:</div>
        <q-input v-model="newCollectionName"
                 class="q-mb-md q-pb-none"
                 dense autofocus
                 error-message="Please do not use special Characters, maximum length is 32"
                 :error="!newCollectionNameIsValid"
                 data-testid="newCollectionName"
                 @keydown.enter="createNewCollection()" v-close-popup />
        <div class="text-caption text-negative q-mt-none q-pt-none">{{ newTabsetDialogWarning() }}</div>

      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" @click="onDialogCancel"/>
        <q-btn flat
               data-testid="newCollectionNameSubmit"
               :label="newCollectionNameExists ? 'Alter Collection' : 'Create new Collection'"
               :disable="newCollectionName.trim().length === 0" v-close-popup
               @click="createNewCollection()"/>
      </q-card-actions>


    </q-card>
  </q-dialog>

</template>

<script lang="ts" setup>

import {computed, ref, watchEffect} from "vue";
import {useDialogPluginComponent, useQuasar} from "quasar";
import {useRouter} from "vue-router";
import {useTabsStore} from "src/stores/tabsStore";
import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {TabsetStatus} from "src/models/Tabset";
import {CreateEntityCollection} from "src/domain/entities/CreateEntityCollection";

defineEmits([
  ...useDialogPluginComponent.emits
])

const props = defineProps({
  type: {
    type: String,
    required: true
  },
  heading: {
    type: String,
    required: true
  }
})

const {dialogRef, onDialogHide, onDialogCancel} = useDialogPluginComponent()

const tabsStore = useTabsStore()
const router = useRouter()
const $q = useQuasar()

const newCollectionName = ref('')
const newCollectionNameExists = ref(false)
const hideWarning = ref(false)

const newCollectionNameIsValid = computed(() => newCollectionName.value.length <= 32 && !STRIP_CHARS_IN_USER_INPUT.test(newCollectionName.value))

watchEffect(() => {
  const existsInTabset = tabsStore.existingInTabset(newCollectionName.value)
  newCollectionNameExists.value = !!existsInTabset && existsInTabset.status !== TabsetStatus.DELETED
})

const createNewCollection = () => {
  hideWarning.value = true

  useCommandExecutor()
    .executeFromUi(new CreateEntityCollection(props.type, newCollectionName.value))
    .then((res) => {
      // useUiStore().setNewTabsetEmptyByDefault(addEmptyTabset.value)
      // if (addEmptyTabset.value) {
      //   TabsetService.createPendingFromBrowserTabs()
      // } else {
      //   if (tabsStore.pendingTabset) {
      //     // clear pending tabset - why neccessary?
      //     tabsStore.pendingTabset.tabs = []
      //   }
      // }
      //router.push("/tabsets/" + res.result.tabsetId + "?first=" + props.firstTabset)
      //window.close()
    })
}

const newTabsetDialogWarning = () => {
  const existsInTabset = tabsStore.existingInTabset(newCollectionName.value)
  return (!hideWarning.value && existsInTabset && existsInTabset.status !== TabsetStatus.DELETED) ?
    "Hint: Tabset exists, but you can add tabs" : ""
}


</script>
