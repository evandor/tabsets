<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <div>
      <q-form @submit.prevent="updateTab()" ref="theForm">
        <q-card class="q-dialog-plugin" style="max-width: 100%">
          <q-card-section>
            <div class="text-h6">Edit Tab</div>
          </q-card-section>
          <q-card-section>
            <div class="text-body">
              <div class="text-body"><b>Tab Name:</b></div>
              <q-input type="text" dense v-model="newTabName" />
            </div>
          </q-card-section>

          <q-card-section>
            <div class="text-body">
              <div class="text-body"><b>Tab Description:</b></div>
              <q-input type="textarea" autogrow dense v-model="newTabDescription" />
            </div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <div class="text-body"><b>URL:</b></div>
            <q-input
              type="url"
              dense
              v-model="newTabUrl"
              autofocus
              @keydown.enter="updateTab()"
              error-message="not a valid URL"
              :error="!newTabUrlIsValid" />
            <div class="text-body2 text-warning">{{ newTabsetDialogWarning() }}</div>
          </q-card-section>

          <q-card-section class="q-pt-none q-mt-none">
            <div class="row">
              <div class="col-5 q-mt-sm"><b>Detail Level</b></div>
              <div class="col">
                <q-select borderless dense options-dense v-model="detailLevel" :options="detailLevelOptions" />
              </div>
            </div>
          </q-card-section>

          <template v-if="useSettingsStore().has('DEV_MODE')">
            <q-card-section class="q-pt-none" v-if="placeholders.length > 0">
              <b>Substitutions for</b>
            </q-card-section>
            <q-card-section class="q-pt-none text-caption" v-else>
              You can use placeholder like this as well: https://dax.de/${wkn}
            </q-card-section>
          </template>

          <q-card-section class="q-pt-none" v-for="placeholder in placeholders">
            <div class="text-body">
              Placeholder <i>{{ placeholder }}</i>
            </div>
            <q-input
              dense
              :model-value="modelFor(placeholder)"
              @update:model-value="(val: any) => updatePlaceholder(placeholder, val)" />
          </q-card-section>

          <q-card-actions align="right">
            <DialogButton label="Cancel" />
            <DialogButton label="Update" type="submit" @was-clicked="updateTab()" :default-action="true" />
          </q-card-actions>
        </q-card>
      </q-form>
    </div>
  </q-dialog>
</template>

<script lang="ts" setup>
import { QForm, useDialogPluginComponent } from 'quasar'
import DialogButton from 'src/core/dialog/buttons/DialogButton.vue'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useSettingsStore } from 'src/core/stores/settingsStore'
import { UpdateTabCommand } from 'src/tabsets/commands/UpdateTabCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { ListDetailLevel } from 'src/ui/stores/uiStore'
import { computed, PropType, ref, watchEffect } from 'vue'

type SelectOption = { label: string; value: ListDetailLevel }

defineEmits([...useDialogPluginComponent.emits])

const props = defineProps({
  tab: { type: Object as PropType<Tab>, required: true },
})

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

const newTabUrl = ref(props.tab.url || '')
const newTabName = ref(props.tab.name || props.tab.title)
const newTabDescription = ref(props.tab?.longDescription || props.tab?.description)
const newTabUrlExists = ref(false)
const hideWarning = ref(false)
const placeholders = ref<string[]>([])
const placeholderValues = ref<Map<string, string>>(new Map())
const detailLevel = ref<SelectOption>({ label: 'Default', value: 'DEFAULT' })

const detailLevelOptions: SelectOption[] = [
  { label: 'Default', value: 'DEFAULT' },
  { label: 'Minimal', value: 'MINIMAL' },
  { label: 'Some', value: 'SOME' },
  { label: 'Maximal', value: 'MAXIMAL' },
]

detailLevel.value = detailLevelOptions.filter((o: SelectOption) => o.value === props.tab?.details)[0] || {
  label: 'Default',
  value: 'DEFAULT',
}

const placeholderReg = /\$\{(.*?)}/gm

watchEffect(() => {
  newTabUrlExists.value = !!useTabsetsStore().existingInTabset(newTabUrl.value)
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

const updateTab = () =>
  useCommandExecutor().executeFromUi(
    new UpdateTabCommand(
      props.tab,
      newTabUrl.value,
      newTabName.value || '',
      newTabDescription.value || '',
      detailLevel.value.value,
      placeholders.value,
      placeholderValues.value,
    ),
  )

const newTabsetDialogWarning = () => {
  return !hideWarning.value && newTabUrl.value !== props.tab.name && useTabsetsStore().existingInTabset(newTabUrl.value)
    ? 'Tabset already exists'
    : ''
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
  console.log('updateing', placeholder, val)
  placeholderValues.value.set(placeholder, val)
  console.log('placeholders', placeholders.value)
}

const modelFor = (ident: string) => placeholderValues.value.get(ident)
</script>
