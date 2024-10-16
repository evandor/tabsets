<template>
  <div class="q-pa-md q-gutter-sm">


    <q-banner rounded style="border:1px solid orange">Backup your tabsets to a public github repository of your choice.
    </q-banner>

    <div class="row q-pa-md">
      <div class="col-3"><b>Username</b></div>
      <div class="col-3 text-grey-8">Your github username</div>
      <div class="col-1"></div>
      <div class="col-5">
        <q-input v-model="username" dense label="Username"/>
      </div>
    </div>

    <div class="row q-pa-md">
      <div class="col-3"><b>Repository</b></div>
      <div class="col-3 text-grey-8">A preferrably empty public repository</div>
      <div class="col-1"></div>
      <div class="col-5">
        <q-input v-model="reponame" dense label="Repository Name"/>
      </div>
    </div>

    <div class="row q-pa-md">
      <div class="col-3"><b>GitHub Access Token</b></div>
      <div class="col-3 text-grey-8">Click <a href="https://github.com/settings/tokens" target="_blank">here</a> to create a new
        token (use scope <em>public_repo</em>).
      </div>
      <div class="col-1"></div>
      <div class="col-5">
        <q-input v-model="githubToken" type="password" dense label="Github Token"/>
      </div>
    </div>

    <div class="row q-pa-md">
      <div class="col-3"><b>Path</b></div>
      <div class="col-3 text-grey-8">optional path where to store the backups and logs
      </div>
      <div class="col-1"></div>
      <div class="col-5">
        <q-input v-model="githubPath" dense label="Path"/>
      </div>
    </div>

    <div class="row q-pa-md" v-if="username && reponame && githubToken">
      <div class="col-3"><b>Save</b></div>
      <div class="col-3">
        <q-checkbox v-model="autobackup" label="Automatic daily backup"/>
        <br>
        <q-checkbox v-model="githubLog" label="Keep action log"/>
      </div>
      <div class="col-1"></div>
      <div class="col-5">
        <q-btn class="q-px-md" dense label="Backup now" :loading="useUiStore().commandExecuting" @click="runGithubBackup()"/>
      </div>
    </div>


  </div>
</template>

<script lang="ts" setup>

import {ref, watchEffect} from "vue";
import {LocalStorage} from "quasar";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {
  GITHUB_AUTO_BACKUP,
  GITHUB_LOG,
  GITHUB_PATH,
  GITHUB_REPONAME,
  GITHUB_TOKEN,
  GITHUB_USERNAME
} from "boot/constants";
import {GithubBackupCommand} from "src/tabsets/commands/github/GithubBackupCommand";
import {NotificationType} from "src/core/services/ErrorHandler";
import {useUiStore} from "src/ui/stores/uiStore";

const username = ref<string>(LocalStorage.getItem(GITHUB_USERNAME) as string)
const reponame = ref<string>(LocalStorage.getItem(GITHUB_REPONAME) as string)
const githubToken = ref<string>(LocalStorage.getItem(GITHUB_TOKEN) as string)
const autobackup = ref<boolean>(LocalStorage.getItem(GITHUB_AUTO_BACKUP) || false)
const githubLog = ref<boolean>(LocalStorage.getItem(GITHUB_LOG) || false)
const githubPath = ref<string>(LocalStorage.getItem(GITHUB_PATH) as string)

const loading = ref(false)

function clearIncluding(idenfier: string) {
  LocalStorage.remove(idenfier)
  githubLog.value = false
  autobackup.value = false
}

watchEffect(() => {
  (username.value && username.value.trim().length > 0)
    ? LocalStorage.set(GITHUB_USERNAME, username.value)
    : clearIncluding(GITHUB_USERNAME)
})

watchEffect(() => {
  (reponame.value && reponame.value.trim().length > 0)
    ? LocalStorage.set(GITHUB_REPONAME, reponame.value)
    : clearIncluding(GITHUB_REPONAME)
})

watchEffect(() => {
  (githubToken.value && githubToken.value.trim().length > 0)
    ? LocalStorage.set(GITHUB_TOKEN, githubToken.value)
    : clearIncluding(GITHUB_TOKEN)
})

watchEffect(() => {
  (githubPath.value && githubPath.value.trim().length > 0)
    ? LocalStorage.set(GITHUB_PATH, githubPath.value)
    : clearIncluding(GITHUB_PATH)
})

watchEffect(() => LocalStorage.set(GITHUB_AUTO_BACKUP, autobackup.value))

watchEffect(() => LocalStorage.set(GITHUB_LOG, githubLog.value))

const runGithubBackup = () => {
  useCommandExecutor().executeFromUi(new GithubBackupCommand(["tabsets_backup_current", "tabset_backup_" + new Date().getTime()]), NotificationType.NOTIFY)
}
</script>
