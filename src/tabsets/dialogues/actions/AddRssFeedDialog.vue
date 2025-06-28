<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <div>
      <q-card class="q-dialog-plugin" style="max-width: 100%">
        <q-card-section>
          <div class="text-h6">Display RSS Feed?</div>
        </q-card-section>
        <q-card-section>
          <div class="text-body">This file seems to contain an RSS Feed</div>
        </q-card-section>
        <q-card-section>
          <div>
            <q-input class="q-ml-md" v-model="feedName" label="Feed Name" />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <DialogButton label="Cancel" @click="onDialogCancel()" />
          <DialogButton
            label="Display"
            type="submit"
            :default-action="true"
            :disable="feedName.trim().length === 0"
            @keyup.enter="display()"
            @wasClicked="display()" />
        </q-card-actions>
      </q-card>
    </div>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
import { TabReference } from 'src/content/models/TabReference'
import DialogButton from 'src/core/dialog/buttons/DialogButton.vue'
import { onMounted, ref } from 'vue'

defineEmits([...useDialogPluginComponent.emits])

const props = defineProps<{
  rssTabReference?: TabReference
}>()

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

// const displayFeed = ref(false)
const feedName = ref<string>(props.rssTabReference?.title || 'RSS Feed')

onMounted(() => {
  if (props.rssTabReference && props.rssTabReference.href) {
    console.log('checking', props.rssTabReference.href)
    fetch(props.rssTabReference.href, {}).then((res) => {
      console.log('got', res)
    })
  }
})

const display = () => {
  onDialogOK({ rssUrl: props.rssTabReference?.href, feedName: feedName.value })
}
</script>
