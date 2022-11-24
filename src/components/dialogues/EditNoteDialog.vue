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
          <q-editor v-model="editor" min-height="5rem" />

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
        <q-btn flat label="Rename Tabset"
               :disable="newTabsetName.trim().length === 0 || newTabsetName.trim() === props.tabsetName || newTabsetDialogWarning() !== ''"
               v-close-popup
               @click="updateTabset()"/>
      </q-card-actions>


    </q-card>
  </q-dialog>

</template>

<script lang="ts" setup>

import {computed, ref, watchEffect} from "vue";
import TabsetService from "src/services/TabsetService";
import {useQuasar} from "quasar";
import {useRouter} from "vue-router";
import {useTabsStore} from "src/stores/tabsStore";

import {useDialogPluginComponent} from 'quasar'
import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";

defineEmits([
  ...useDialogPluginComponent.emits
])

const props = defineProps({
  tabsetId: {
    type: String,
    required: true
  },
  tabsetName: {
    type: String,
    required: true
  }
})

const editor = ref('What you see is <b>what</b> you get.')

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

const updateTabset = () => {
  //hideWarning.value = true
  TabsetService.rename(props.tabsetId, newTabsetName.value)
  $q.notify({
    message: 'The tabset has been renamed',
    type: 'positive'
  })
}

const newTabsetDialogWarning = () => {
  return (!hideWarning.value && newTabsetName.value !== props.tabsetName && tabsStore.nameExistsInContextTabset(newTabsetName.value)) ?
    "Tabset already exists" : ""
}

const newTabsetNameIsValid = computed(() => newTabsetName.value.length <= 32 && !STRIP_CHARS_IN_USER_INPUT.test(newTabsetName.value))


</script>
