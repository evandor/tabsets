<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Import Tabsets</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">Your current tabsets will be merged with the imported ones.</div>
      </q-card-section>

      <q-card-section class="q-pt-none" v-if="showGithubChoice">
        <q-radio v-model="importFrom" val="json" label="as JSON"></q-radio>
        <q-radio v-model="importFrom" val="github" label="from github backup"></q-radio>
      </q-card-section>

      <q-card-section class="q-pt-none" v-if="importFrom === 'json'">
        <input id="json2import" type="file" />
      </q-card-section>

      <q-card-section class="q-pt-none" v-if="importFrom === 'github'">
        <span
          >using repository<br />
          <em
            >{{ LocalStorage.getItem(GITHUB_USERNAME) }}/{{ LocalStorage.getItem(GITHUB_REPONAME) }}/{{
              LocalStorage.getItem(GITHUB_PATH)
            }}</em
          ></span
        >
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" @click="onDialogCancel" />
        <q-btn flat label="Import" v-close-popup @click="importData()" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { LocalStorage, useDialogPluginComponent } from 'quasar'
import { GITHUB_PATH, GITHUB_REPONAME, GITHUB_TOKEN, GITHUB_USERNAME } from 'src/boot/constants'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useUtils } from 'src/core/services/Utils'
import { GithubGetLatestBackupCommand } from 'src/tabsets/commands/github/GithubGetLatestBackupCommand'
import { ImportTabsetsCommand } from 'src/tabsets/commands/ImportTabsets'
import { ref, watchEffect } from 'vue'

defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits,
])

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

const { sendMsg } = useUtils()

const importFrom = ref('json')
const showGithubChoice = ref(false)

const props = defineProps({
  inSidePanel: { type: Boolean, default: false },
})

const importData = async () => {
  if (importFrom.value === 'json') {
    // @ts-expect-error TODO
    const file = document.getElementById('json2import').files[0]
    const reader = new FileReader()
    reader.onload = function (e) {
      // @ts-expect-error TODO
      const json = e.target.result
      useCommandExecutor()
        .executeFromUi(new ImportTabsetsCommand(json as unknown as string))
        .then(() => {
          sendMsg('tabsets-imported', {})
        })
    }
    reader.readAsText(file)
  } else {
    const fromGithub = await useCommandExecutor().execute(new GithubGetLatestBackupCommand())
    console.log('fromGithub', fromGithub.result)
    useCommandExecutor()
      .executeFromUi(new ImportTabsetsCommand(fromGithub.result))
      .then(() => {
        sendMsg('tabsets-imported', {})
      })
  }
}

watchEffect(() => {
  showGithubChoice.value =
    LocalStorage.getItem(GITHUB_USERNAME) !== undefined &&
    LocalStorage.getItem(GITHUB_REPONAME) !== undefined &&
    LocalStorage.getItem(GITHUB_TOKEN) !== undefined
})
</script>
