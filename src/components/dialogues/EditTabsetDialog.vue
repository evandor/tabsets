<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Tabset</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">Please provide a new name for this tabset</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="text-body">Tabset's name:</div>
        <q-input dense v-model="newTabsetName" autofocus @keydown.enter="updateTabset()"
                 error-message="Please do not use special Characters, maximum length is 32"
                 :error="!newTabsetNameIsValid"
        />
        <div class="text-body2 text-warning">{{ newTabsetDialogWarning() }}</div>
      </q-card-section>

      <q-card-section v-if="usePermissionsStore().hasFeature(FeatureIdent.COLOR_TAGS)">
        Assign Color (optional)

        <div class="row q-pa-xs q-mt-none q-pl-sm q-gutter-sm">
          <ColorSelector
              @colorSet="(color:string) => theColor = color"
              :selectedColor="props.tabsetColor"/>
        </div>

      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn label="Cancel" size="sm" color="accent" @click="onDialogCancel"/>
        <q-btn label="Update" size="sm" color="warning"
               :disable="disableSubmit()"
               v-close-popup
               @click="updateTabset()"/>
      </q-card-actions>


    </q-card>
  </q-dialog>

</template>

<script lang="ts" setup>

import {computed, ref, watchEffect} from "vue";
import {useDialogPluginComponent} from "quasar";
import {useTabsStore} from "src/stores/tabsStore";
import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {RenameTabsetCommand} from "src/domain/tabsets/RenameTabset";
import {useNotificationHandler} from "src/services/ErrorHandler";
import {useCommandExecutor} from "src/services/CommandExecutor";
import ColorSelector from "components/dialogues/helper/ColorSelector.vue";
import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";

defineEmits([
  ...useDialogPluginComponent.emits
])

const props = defineProps({
  tabsetId: {type: String, required: true},
  tabsetName: {type: String, required: true},
  tabsetColor: {type: String, required: false},
  fromPanel: {type: Boolean, default: false}
})

const {handleError, handleSuccess} = useNotificationHandler()
const {dialogRef, onDialogHide, onDialogCancel} = useDialogPluginComponent()

const tabsStore = useTabsStore()

const newTabsetName = ref(props.tabsetName)
const newTabsetNameExists = ref(false)
const hideWarning = ref(false)
const theColor = ref<string | undefined>(props.tabsetColor || undefined)

watchEffect(() => {
  newTabsetNameExists.value = !!tabsStore.nameExistsInContextTabset(newTabsetName.value);
})

const updateTabset = () =>
    useCommandExecutor().executeFromUi(new RenameTabsetCommand(props.tabsetId, newTabsetName.value, theColor.value))

const newTabsetDialogWarning = () => {
  return (!hideWarning.value && newTabsetName.value !== props.tabsetName && tabsStore.nameExistsInContextTabset(newTabsetName.value)) ?
      "Tabset already exists" : ""
}

const newTabsetNameIsValid = computed(() =>
    newTabsetName.value?.length <= 32 && !STRIP_CHARS_IN_USER_INPUT.test(newTabsetName.value))

const disableSubmit = () => {
  return newTabsetName.value.trim().length === 0 ||
      (newTabsetName.value.trim() === props.tabsetName && theColor.value?.trim() === props.tabsetColor)
      || newTabsetDialogWarning() !== ''
}


</script>

<style lang="sass" scoped>
.my-input
  max-width: 250px
</style>