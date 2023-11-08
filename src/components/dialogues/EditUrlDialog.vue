<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Edit URL</div>
      </q-card-section>
      <q-card-section v-if="placeholders.length > 0">
        <div class="text-body">
          <div class="text-body"><b>Tab Name:</b></div>
          <q-input type="text" dense v-model="newTabName"/>
        </div>
      </q-card-section>
      <q-card-section v-else>
        <div class="text-body">Tab: {{ tabTitle() }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="text-body"><b>URL:</b></div>
        <q-input type="text"
                 dense v-model="newTabUrl" autofocus @keydown.enter="updateTab()"
                 error-message="not a valid URL"
                 :error="!newTabUrlIsValid"
        />
        <div class="text-body2 text-warning">{{ newTabsetDialogWarning() }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none" v-if="placeholders.length > 0">
        <b>Substitutions for</b>
      </q-card-section>
      <q-card-section class="q-pt-none" v-else>
        You can use placeholder like this as well: https://dax.de/${wkn}
      </q-card-section>

      <q-card-section class="q-pt-none" v-for="(placeholder,index) in placeholders">
        <div class="text-body">Placeholder <i>{{ placeholder }}</i></div>
        <q-input dense :model-value="modelFor(placeholder)"
                 @update:model-value="val => updatePlaceholder(placeholder, val)"/>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn label="Cancel" size="md" @click="onDialogCancel" color="accent"/>
        <!--        :disable="newTabUrl?.trim().length === 0 || newTabUrl?.trim() === props.tabsetName || newTabsetDialogWarning() !== ''"-->

        <q-btn label="Update" color="warning" size="md"
               v-close-popup
               @click="updateTab()"/>
      </q-card-actions>


    </q-card>
  </q-dialog>

</template>

<script lang="ts" setup>

import {computed, PropType, ref, watchEffect} from "vue";
import {useTabsStore} from "src/stores/tabsStore";

import {useDialogPluginComponent} from 'quasar'
import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {RenameTabsetCommand} from "src/domain/tabsets/RenameTabset";
import {useNotificationHandler} from "src/services/ErrorHandler";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {SaveTabCommand} from "src/domain/tabs/SaveTab";
import {Tab} from "src/models/Tab";
import {UpdateTabUrlCommand} from "src/domain/tabs/UpdateTabUrl";

defineEmits([
  ...useDialogPluginComponent.emits
])

const props = defineProps({
  tab: {type: Object as PropType<Tab>, required: true}
})

const {handleError, handleSuccess} = useNotificationHandler()
const {dialogRef, onDialogHide, onDialogCancel} = useDialogPluginComponent()

const tabsStore = useTabsStore()

const newTabUrl = ref(props.tab.url || '')
const newTabName = ref(props.tab.name || props.tab.title)
const newTabUrlExists = ref(false)
const hideWarning = ref(false)
const placeholders = ref<string[]>([])
const placeholderValues = ref<Map<string, string>>(new Map())

const placeholderReg = /\$\{(.*?)}/gm

watchEffect(() => {
  newTabUrlExists.value = !!tabsStore.nameExistsInContextTabset(newTabUrl.value);
})

watchEffect(() => {
  placeholders.value = []
  for (const match of newTabUrl.value.matchAll(placeholderReg)) {
    const name = match[1]
    if (name && name.trim().length > 0) {
      placeholders.value.push(name)
      const value = props.tab?.placeholders?.config[name as keyof object] || ''
      placeholderValues.value.set(name, value)
    }
  }
})

watchEffect(() => {
  console.log("placeholderValues", placeholderValues.value)
})

const updateTab = () =>
    useCommandExecutor().executeFromUi(new UpdateTabUrlCommand(
        props.tab, newTabUrl.value, newTabName.value || '', placeholders.value, placeholderValues.value))


const newTabsetDialogWarning = () => {
  return (!hideWarning.value && newTabUrl.value !== props.tab.name && tabsStore.nameExistsInContextTabset(newTabUrl.value)) ?
      "Tabset already exists" : ""
}

const newTabUrlIsValid = computed(() => {
  //newTabUrl.value?.length <= 32 && !STRIP_CHARS_IN_USER_INPUT.test(newTabUrl.value)
  try {
    new URL(newTabUrl.value)
    return true
  } catch (e) {
    return false
  }
})

const updatePlaceholder = (placeholder: string, val: any) => {
  console.log("updateing", placeholder, val)
  placeholderValues.value.set(placeholder, val)
  console.log("placeholders", placeholders.value)
}

const modelFor = (ident: string) => placeholderValues.value.get(ident)

</script>
