<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Tab Note</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">You can start or edit a note for this specific tab</div>
      </q-card-section>

      <q-card-section class="q-pt-none">

        <div class="q-pa-md q-gutter-sm">
          <!--          <q-editor v-model="editor" min-height="5rem" />-->

          <q-input
            v-model="editor"
            filled
            type="textarea"
          />
          <!--          <q-card flat bordered>-->
          <!--            <q-card-section>-->
          <!--              <pre style="white-space: pre-line">{{ editor }}</pre>-->
          <!--            </q-card-section>-->
          <!--          </q-card>-->

          <!--          <q-card flat bordered>-->
          <!--            <q-card-section v-html="editor" />-->
          <!--          </q-card>-->
        </div>

      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" @click="onDialogCancel"/>
        <q-btn flat label="Save Note"
               v-close-popup
               @click="saveNote()"/>
      </q-card-actions>


    </q-card>
  </q-dialog>

</template>

<script lang="ts" setup>

import {ref, watchEffect} from "vue";
import TabsetService from "src/services/TabsetService";
import {useQuasar} from "quasar";
import {useRouter} from "vue-router";
import {useTabsStore} from "src/stores/tabsStore";

import {useDialogPluginComponent} from 'quasar'

defineEmits([
  ...useDialogPluginComponent.emits
])

const props = defineProps({
  tabId: {
    type: String,
    required: true
  },
  note: {
    type: String,
    default: ''
  }
})

const editor = ref(props.note)

const {dialogRef, onDialogHide, onDialogCancel} = useDialogPluginComponent()

const tabsStore = useTabsStore()
const router = useRouter()
const $q = useQuasar()

const newTabsetName = ref('')
const newTabsetNameExists = ref(false)
const hideWarning = ref(false)

watchEffect(() => {
  newTabsetNameExists.value = !!tabsStore.nameExistsInContextTabset(newTabsetName.value);
})

const saveNote = () => {
  TabsetService.saveNote(props.tabId, editor.value)
    .then(() => {
      $q.notify({
        message: 'The note has been saved',
        type: 'positive'
      })
    })
    .catch(() => {
      $q.notify({
        message: 'There was a problem saving the note',
        type: 'negative'
      })
    })
}


</script>
