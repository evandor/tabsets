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
        <q-input
          dense
          v-model="newTabsetName"
          autofocus
          @keydown.enter="updateTabset()"
          error-message="Please do not use special Characters, maximum length is 32"
          :error="!newTabsetNameIsValid" />
        <div class="text-body2 text-warning">{{ newTabsetDialogWarning() }}</div>
      </q-card-section>

      <!--      <q-card-section v-if="useUiStore().showDetailsPerTabset">-->
      <!--        <q-select-->
      <!--          label="Tabset's Detail Level"-->
      <!--          filled-->
      <!--          v-model="detailOption"-->
      <!--          :options="detailOptions"-->
      <!--          map-options-->
      <!--          emit-value-->
      <!--          style="width: 250px" />-->
      <!--      </q-card-section>-->

      <!--      <q-card-section>-->
      <!--        <div classs="text-caption text-blue" style="font-size: smaller" v-if="windowMgtSelectionEdited">-->
      <!--          Press 'Enter' to add the new value-->
      <!--        </div>-->
      <!--        <q-select-->
      <!--          dense-->
      <!--          options-dense-->
      <!--          clearable-->
      <!--          clear-icon="close"-->
      <!--          label="Open in Window"-->
      <!--          filled-->
      <!--          v-model="windowModel"-->
      <!--          map-options-->
      <!--          use-input-->
      <!--          :options="windowOptions"-->
      <!--          input-debounce="0"-->
      <!--          @new-value="createWindowOption"-->
      <!--          @keydown.enter="enterPressed()"-->
      <!--          @focus="windowMgtSelectionHasFocus = true"-->
      <!--          @blur="windowMgtSelectionHasFocus = false" />-->
      <!--      </q-card-section>-->

      <q-card-section v-if="useFeaturesStore().hasFeature(FeatureIdent.COLOR_TAGS)">
        Assign Color (optional)

        <div class="row q-pa-xs q-mt-none q-pl-sm q-gutter-sm">
          <ColorSelector @colorSet="(color: string) => (theColor = color)" :selectedColor="props.tabsetColor!" />
        </div>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <!--        <q-btn label="Cancel" size="sm" color="accent" @click="onDialogCancel" />-->
        <DialogButton label="Cancel" @was-clicked="onDialogCancel()" color="primary" />
        <DialogButton
          label="Update"
          @was-clicked="updateTabset()"
          color="primary"
          :default-action="true"
          :disable="disableSubmit()" />

        <!--        <q-btn-->
        <!--          label="Update"-->
        <!--          size="sm"-->
        <!--          color="warning"-->
        <!--          :disable="disableSubmit()"-->
        <!--          v-close-popup-->
        <!--          @click="updateTabset()" />-->
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { STRIP_CHARS_IN_USER_INPUT } from 'src/boot/constants'
import DialogButton from 'src/core/dialog/buttons/DialogButton.vue'
import ColorSelector from 'src/core/dialog/ColorSelector.vue'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { RenameTabsetCommand } from 'src/tabsets/commands/RenameTabsetCommand'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { ListDetailLevel } from 'src/ui/stores/uiStore'
import { useWindowsStore } from 'src/windows/stores/windowsStore'
import { computed, ref, watchEffect } from 'vue'

defineEmits([...useDialogPluginComponent.emits])

type Props = {
  tabsetId: string
  tabsetName: string
  tabsetColor?: string
  window?: string
  details: ListDetailLevel
  fromPanel: boolean
}

const props = withDefaults(defineProps<Props>(), {
  details: 'MINIMAL',
  fromPanel: false,
})

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

const newTabsetName = ref(props.tabsetName)
const newTabsetNameExists = ref(false)
const hideWarning = ref(false)
const windowMgtSelectionHasFocus = ref(false)
// const windowMgtSelectionEdited = ref(false)
const theColor = ref<string | undefined>(props.tabsetColor || undefined)
const windowOptions = ref<string[]>([])
const detailOption = ref<ListDetailLevel>(props.details)

const detailOptions = [
  { label: 'Minimal Details', value: 'MINIMAL' },
  { label: 'Some Details', value: 'SOME' },
  { label: 'All Details', value: 'MAXIMAL' },
  { label: 'Default', value: 'DEFAULT' },
]

watchEffect(() => {
  newTabsetNameExists.value = !!useTabsetsStore().existingInTabset(newTabsetName.value)
})

// watchEffect(() => {
//   if (windowMgtSelectionHasFocus.value && !windowModel.value) {
//     windowMgtSelectionEdited.value = true
//   }
// })

watchEffect(() => {
  const windows: Set<string> = useWindowsStore().windowSet
  windowOptions.value = []
  windowOptions.value.push('current')
  const sortedWindowNames = Array.from(windows).sort()
  sortedWindowNames.forEach((windowName) => {
    if (windowName !== 'current') {
      windowOptions.value.push(windowName)
    }
  })
})

const updateTabset = () =>
  useCommandExecutor().executeFromUi(
    new RenameTabsetCommand(props.tabsetId, newTabsetName.value, theColor.value, 'current'),
  )

const newTabsetDialogWarning = () => {
  return !hideWarning.value &&
    newTabsetName.value !== props.tabsetName &&
    useTabsetsStore().existingInTabset(newTabsetName.value)
    ? 'Tabset already exists'
    : ''
}

const newTabsetNameIsValid = computed(
  () => newTabsetName.value?.length <= 32 && !STRIP_CHARS_IN_USER_INPUT.test(newTabsetName.value),
)

const disableSubmit = (): boolean => {
  return (
    newTabsetName.value.trim().length === 0 ||
    (newTabsetName.value.trim() === props.tabsetName &&
      theColor.value?.trim() === props.tabsetColor &&
      props.details === detailOption.value) ||
    newTabsetDialogWarning() !== '' ||
    windowMgtSelectionHasFocus.value
  )
}
</script>

<style lang="sass" scoped>
.my-input
  max-width: 250px
</style>
