<template>
  <div>
    <!--    <q-form @submit.prevent="importBookmarks()" ref="theForm">-->

    <q-card style="min-width: 300px">
      <q-card-section>
        <div class="text-h6" v-if="props.foldersCount === 0">Import these {{ props.count }} Bookmarks as Tabset</div>
        <div class="text-h6" v-else>Import Bookmarks recursively</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="text-body">New Tabset's name:</div>

        <q-input
          v-model="newTabsetName"
          class="q-mb-md q-pb-none"
          dense
          autofocus
          @update:model-value="(val) => checkIsValid()"
          :rules="[
            (val: string) => Tabset.newTabsetNameIsValid(val) || 'Please do not use special Characters',
            (val: string) =>
              Tabset.newTabsetNameIsShortEnough(val) || 'the maximum length is ' + TABSET_NAME_MAX_LENGTH,
          ]"
          data-testid="newTabsetName" />

        <template v-if="props.foldersCount > 0">
          <q-checkbox v-model="recursive" label="Recursively" />&nbsp;
          <q-icon name="help" color="primary" size="1em">
            <q-tooltip class="tooltip"
              >If you select this option, all bookmarks and subfolders will be added as well
            </q-tooltip>
          </q-icon>
          <br />
        </template>

        <div class="text-body2 text-warning">{{ newTabsetDialogWarning() }}</div>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn label="Cancel" size="sm" color="accent" v-close-popup />
        <q-btn
          type="submit"
          label="Create new Tabset"
          color="warning"
          size="sm"
          data-testid="newTabsetNameSubmit"
          @click="createTabset()"
          :disable="!isValid"
          v-close-popup />
      </q-card-actions>
    </q-card>
    <!--    </q-form>-->
  </div>
</template>

<script lang="ts" setup>
import { QForm, useDialogPluginComponent } from 'quasar'
import { Tabset, TABSET_NAME_MAX_LENGTH } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { ref } from 'vue'

const emits = defineEmits([...useDialogPluginComponent.emits, 'importBookmarks'])

const props = defineProps({
  inSidePanel: { type: Boolean, default: false },
  foldersCount: { type: Number, default: 0 },
  bmId: { type: Number, required: true },
  bmTitle: { type: String, required: true },
  count: { type: Number, default: 0 },
})

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

const theForm = ref<QForm>(null as unknown as QForm)
const newTabsetName = ref(props.bmTitle)
const isValid = ref(true)
const recursive = ref(false)

const newTabsetDialogWarning = () => {
  if (useTabsetsStore().existingInTabset(newTabsetName.value)) {
    return 'Tabset ' + newTabsetName.value + ' already exists, items will be merged'
  }
  return ''
}

const checkIsValid = () => {
  if (theForm.value) {
    theForm.value.validate().then((res) => {
      isValid.value = res
    })
  }
}

const createTabset = () => {
  emits('importBookmarks', {
    bmId: props.bmId,
    recursive: recursive.value,
    tsName: newTabsetName.value,
  })
}
</script>
