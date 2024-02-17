<template>
  <q-banner rounded style="border: 1px solid orange">
    <div class="text-body1">Experimental: Synchronize your tabsets across computers and browsers</div>
  </q-banner>

  <div class="row items-baseline q-ma-md q-gutter-lg">
    <div class="col-3">
      {{ tempSyncOption === currentSyncType ? 'Current Syncing' : 'Set Syncing to' }}
    </div>
    <div class="col-7">
      <q-select
        label="Tabsets' Sync Settings"
        filled
        v-model="tempSyncOption"
        :options="syncOptions"
        map-options
        emit-value
        style="width: 250px"
      />
    </div>
    <div class="col"></div>

    <div class="col-3"></div>
    <div class="col-7 text-caption" v-if="tempSyncOption === SyncType.NONE">
      Your tabset data is only available on your local machine and the current browser. If you want to
      use tabsets on other computers and/or browsers, you need to set up syncing.
    </div>
    <div class="col-7 text-caption" v-if="tempSyncOption === SyncType.GITHUB">
      Sync your tabsets across browsers and computers via a <b>github repository</b>.<br>
      This is suitable if you do not have too many tabsets and performance is not your first concern.<br><br>
      You need to provide a github repository URL and a personal access token (e.g. for
      github: <a
      href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens"
      target="_blank">github example</a>).<br><br>
      Initially, the repository should be empty. <span class="warning">If you chose a public repository, everybody is able to access your stored tabsets</span>.
    </div>
    <div class="col-7 text-caption" v-if="tempSyncOption === SyncType.COUCHDB">
      Sync your tabsets across browsers and computers via a database (not yet supported)
    </div>
    <div class="col-7 text-caption" v-if="tempSyncOption === SyncType.FIRESTORE">
      Sync your data across browsers and computers
    </div>

    <div class="col"></div>

    <template v-if="tempSyncOption === SyncType.GITHUB">

      <div class="col-3">
        Github Repository URL
      </div>
      <div class="col-7">
        <q-input type="url" color="primary" filled v-model="githubRepoUrl"
                 lazy-rules
                 :rules="[
                    (val:string) => !!val || 'Github Repository URL is required',
                    (val:string) => /^https:\/\/github.com\/.*$/.test(val) || 'Must start with github'
                    ]"
                 hint="The repository URL for your github repository"
                 label="" autocomplete="sync-url">
          <template v-slot:prepend>
            <q-icon name="sync"/>
          </template>
        </q-input>
      </div>
      <div class="col text-right">
        <q-icon v-if="githubRepoUrl" class="cursor-pointer" name="open_in_new" size="md"
                @click="NavigationService.openSingleTab(githubRepoUrl)"/>
      </div>

      <div class="col-3">
        Github Repository Token
      </div>
      <div class="col-7">
        <q-input type="password" color="primary" filled v-model="githubRepoToken" label=""
                 hint="needed for write access, for private repositories also for read access">
          <template v-slot:prepend>
            <q-icon name="sync"/>
          </template>
        </q-input>
        <span v-if="showWrongTokenMessage()" class="text-negative text-caption">Seems like your github token is wrong or missing. Update or switch to "No Syncing"</span>
      </div>
      <div class="col text-right">

      </div>
    </template>

    <template v-if="tempSyncOption === SyncType.COUCHDB">

      <div class="col-3">
        Couch DB Username
      </div>
      <div class="col-7">
        <q-input type="text" color="primary" filled v-model="couchdbUsername"
                 lazy-rules
                 :rules="[(val:string) => !!val || 'Username is required']"
                 hint="The Username for your couchdb installation">
        </q-input>
      </div>
      <div class="col text-right"></div>

      <div class="col-3">
        Couch DB Password
      </div>
      <div class="col-7">
        <q-input type="password" color="primary" filled v-model="couchdbPassword"
                 lazy-rules
                 :rules="[(val:string) => !!val || 'Password is required']"
                 hint="The Password for your couchdb installation">
        </q-input>
      </div>
      <div class="col text-right"></div>

      <div class="col-3">
        Couch DB URL
      </div>
      <div class="col-7">
        <q-input type="url" color="primary" filled v-model="couchdbUrl"
                 lazy-rules
                 :rules="[
                    (val:string) => !!val || 'Github Repository URL is required',
                    (val:string) => /^https:.*$/.test(val) || 'Must start with https://'
                    ]"
                 hint="The repository URL for your couchdb installation"
                 label="" autocomplete="sync-url">
          <template v-slot:prepend>
            <q-icon name="sync"/>
          </template>
        </q-input>
      </div>
      <div class="col text-right"></div>

    </template>

    <template v-if="tempSyncOption === SyncType.GITHUB && githubRepoUrl ||
      (tempSyncOption === SyncType.GITHUB && githubRepoUrl)">
      <div class="col-3"></div>
      <div class="col-7">
        <q-btn
          label="Test Connection" @click="testGitConnection()"/>
        <span class="q-ml-md"> {{ testResult }}</span>
      </div>
      <div class="col text-right"></div>
    </template>

    <template v-if="tempSyncOption === SyncType.COUCHDB && couchdbUrl">
      <div class="col-3"></div>
      <div class="col-7">
        <q-btn
          label="Test DB Connection" @click="testDbConnection()"/>
        <span class="q-ml-md"> {{ testResult }}</span>
      </div>
      <div class="col text-right"></div>
    </template>

    <template v-if="startSyncMessage(SyncType.GITHUB)">
      <div class="col-3"></div>
      <div class="col-7">
        <div>You can switch to the git-based sync version of tabsets now if you wish.</div>
        <div>Please follow these steps:</div>
        <ul>
          <li><span class="cursor-pointer text-blue-8"
                    @click.stop="emits('wasClicked',{tab: 'importExport'})">Export</span> your tabsets
            first (if you want to keep them)
          </li>
          <li>Click on 'Start Syncing' below</li>
          <li>Restart Tabsets (close and open again)</li>
          <li>Import your tabsets again (if needed)</li>
        </ul>
      </div>
      <div class="col text-right"></div>
    </template>

    <template v-if="stopSyncMessage()">
      <div class="col-3"></div>
      <div class="col-7">
        <div>You can stop using the git-based sync version of tabsets if you wish.</div>
        <div>Please follow these steps:</div>
        <ul>
          <li><span class="cursor-pointer text-blue-8"
                    @click.stop="emits('wasClicked',{tab: 'importExport'})">Export</span> your tabsets
            first
          </li>
          <li>Click on 'Stop Syncing' below</li>
          <li>Restart Tabsets (close and open again)</li>
          <li>Import your tabsets again</li>
        </ul>
      </div>
      <div class="col text-right"></div>

      <div class="col-3"></div>
      <div class="col-7">
        <q-banner rounded style="border: 1px solid orange">
          <div class="text-caption text-red">
            If you do not export your tabsets and import them again you will not have access to the
            data formerly stored in your git repository.
          </div>
        </q-banner>
      </div>
      <div class="col"></div>

      <div class="col-3"></div>
      <div class="col-7">
        <q-btn label="Stop Syncing" @click="updateSyncing()"/>
      </div>
      <div class="col text-right"></div>
    </template>

    <template v-if="tempSyncOption !== currentSyncType && testResult === 'success'">

      <div class="col-3"></div>
      <div class="col-7">
        <q-banner rounded style="border: 1px solid orange">
          <div class="text-caption text-red">
            Syncing your data will store your data somewhere else than only locally on your computer. Using a public
            repository will give public (read) access to your data!
          </div>
        </q-banner>
      </div>
      <div class="col"></div>

      <div class="col-3"></div>
      <div class="col-7">
        <q-btn label="Start Syncing" @click="startGitSyncing()"/>
      </div>
      <div class="col text-right"></div>
    </template>

    <template v-if="tempSyncOption !== currentSyncType && tempSyncOption === SyncType.NONE">


      <div class="col-3"></div>
      <div class="col-7">
        <q-banner rounded style="border: 1px solid orange">
          <div class="text-caption text-red">
            Switch off syncing {{ tempSyncOption }}/{{ currentSyncType }}
          </div>
        </q-banner>
      </div>
      <div class="col"></div>

      <div class="col-3"></div>
      <div class="col-7">
        <q-btn label="Stop Syncing" @click="updateSyncing()"/>
      </div>
      <div class="col text-right"></div>
    </template>

    <template v-if="tempSyncOption !== currentSyncType && tempSyncOption === SyncType.FIRESTORE">

      <div class="col-3">
        Want to keep your data?
      </div>
      <div class="col-7">

        <q-banner rounded style="border: 1px solid orange" v-if="useTabsStore().allTabsCount > 0">
          <div class="text-body2">
            <div class="row">
              <div>If you want to keep your current (local) tabsets, please follow these steps:</div>
              <ul>
                <li><span class="cursor-pointer text-blue-8"
                          @click.stop="emits('wasClicked',{tab: 'importExport'})">Export</span> your tabsets
                  first (if you want to keep them)
                </li>
                <li>Click on 'Start Syncing' below</li>
                <li>Restart Tabsets (close and open again)</li>
                <li>Import your tabsets again (if needed)</li>
              </ul>
            </div>

          </div>
        </q-banner>
      </div>

      <div class="col"></div>

      <div class="col-3">
        Remote Storage
      </div>
      <div class="col-7">
        <q-banner rounded class="q-mt-lg" style="border: 1px solid orange">
          <div class="text-caption text-red">
            <div class="row">
              <div class="col-2">
            <q-checkbox v-model="acknowledgment" />
              </div>
              <div class="col">I accept that my tabsets related data is managed in the cloud and not only locally on this computer to
                support syncing the data across multiple browsers and computers.
              </div>
            </div>
          </div>
        </q-banner>

      </div>
      <div class="col"></div>

      <div class="col-3"></div>
      <div class="col-7">
        <q-btn label="Start Syncing" :disable="!acknowledgment" @click="updateSyncing()"/>
      </div>
      <div class="col text-right"></div>
    </template>

  </div>

</template>

<script setup lang="ts">
import {SyncType} from "stores/appStore";
import {ref, watchEffect} from "vue";
import {LocalStorage} from "quasar";
import {
  SYNC_COUCHDB_PASSWORD,
  SYNC_COUCHDB_URL,
  SYNC_COUCHDB_USERNAME,
  SYNC_GITHUB_TOKEN,
  SYNC_TYPE
} from "boot/constants";
import GitPersistentService from "src/services/persistence/GitPersistentService";
import {FirebaseCall} from "src/services/firebase/FirebaseCall";
import {useUtils} from "src/services/Utils";
import {useNotificationHandler} from "src/services/ErrorHandler";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {useAuthStore} from "stores/authStore";
import {useRouter} from "vue-router";
import NavigationService from "src/services/NavigationService";
import {doc, updateDoc} from "firebase/firestore";
import FirebaseService from "src/services/firebase/FirebaseService";
import {useSettingsStore} from "stores/settingsStore";
import {useTabsStore} from "stores/tabsStore";
import {useTabsetService} from "src/services/TabsetService2";
import TabsetService from "src/services/TabsetService";

const {sendMsg} = useUtils()
const {handleSuccess, handleError} = useNotificationHandler()

const emits = defineEmits(['wasClicked'])

const currentSyncType = ref<SyncType>(useAuthStore().getAccount()?.userData?.sync?.type || SyncType.NONE)
const tempSyncOption = ref<SyncType>(useAuthStore().getAccount()?.userData?.sync?.type || SyncType.NONE)

const githubRepoToken = ref<string>(LocalStorage.getItem(SYNC_GITHUB_TOKEN) as string || '')
const githubRepoUrl = ref<string>(useAuthStore().getAccount()?.userData?.sync?.url || '')

const couchdbUsername = ref<string>(LocalStorage.getItem(SYNC_COUCHDB_USERNAME) as string || '')
const couchdbPassword = ref<string>(LocalStorage.getItem(SYNC_COUCHDB_PASSWORD) as string || '')
const couchdbUrl = ref<string>(LocalStorage.getItem(SYNC_COUCHDB_URL) as string || '')

const testResult = ref<string | undefined>(undefined)
const acknowledgment = ref<boolean>(false)
const publish = ref<boolean>(false)

const syncOptions = useSettingsStore().isEnabled('dev') ? [
    {label: 'No Syncing', value: SyncType.NONE, desc: ""},
    {label: 'Syncing', value: SyncType.FIRESTORE, desc: ""},
    {label: 'Syncing via github repository', value: SyncType.GITHUB}] :
  [
    {label: 'No Syncing', value: SyncType.NONE, desc: ""},
    {label: 'Syncing', value: SyncType.FIRESTORE, desc: ""},
  ]

function checkAndUpdate(val: string, ident: string) {
  (val && val.trim().length > 0) ?
    LocalStorage.set(ident, val) :
    LocalStorage.remove(ident)
  testResult.value = undefined
}

watchEffect(() => {
  checkAndUpdate(githubRepoToken.value, SYNC_GITHUB_TOKEN)
})

watchEffect(() => {
  checkAndUpdate(couchdbUsername.value, SYNC_COUCHDB_USERNAME)
  checkAndUpdate(couchdbPassword.value, SYNC_COUCHDB_PASSWORD)
  checkAndUpdate(couchdbUrl.value, SYNC_COUCHDB_URL)
})

const testGitConnection = async () => {
  const url = githubRepoUrl.value
  const token = tempSyncOption.value === SyncType.GITHUB ? githubRepoToken.value : githubRepoToken.value
  if (url) {
    console.log("testing git connection with", url, token?.substring(0, 5) + "...")
    const res = await GitPersistentService.testConnection(url)//, gitRepoToken)
    testResult.value = res
  } else {
    testResult.value = "no repo URL given"
  }
}

const testDbConnection = async () => {
  if (couchdbUrl.value) {
    console.log("testing db connection with", couchdbUrl.value)
    var headers = new Headers({
      'Authorization': `Basic ${btoa(couchdbUsername.value + ':' + couchdbPassword.value)}`
    });

    fetch(couchdbUrl.value, {headers: headers}).then((res) => {
      console.log("res", res)
      testResult.value = res['ok'] as boolean ? 'success' : 'false'
    })
  } else {
    testResult.value = "no db URL given"
  }
}

const startGitSyncing = async () => {
  try {
    const res = await FirebaseCall.patch("/users/" + useAuthStore().user.uid,
      {sync: {type: tempSyncOption.value, url: githubRepoUrl.value}})
    console.log("res", res)
    LocalStorage.set(SYNC_TYPE, tempSyncOption.value)
    sendMsg('reload-application')
    handleSuccess(new ExecutionResult<string>("done", "done"))
  } catch (err) {
    console.error("startGitSyncing Error", err)
    handleError('could not start syncing')
  }
  //useSuggestionsStore().addSuggestion(Suggestion.getStaticSuggestion(StaticSuggestionIdent.RESTART_SUGGESTED))
}

const updateSyncing = async () => {
  try {
    await updateDoc(doc(FirebaseService.getFirestore(), "users", useAuthStore().user.uid), {sync: {type: tempSyncOption.value}})
    LocalStorage.set(SYNC_TYPE, tempSyncOption.value)
    sendMsg('reload-application')
    handleSuccess(new ExecutionResult<string>("done", "done"))
  } catch (err) {
    console.error("startGitSyncing Error", err)
    handleError('could not start syncing')
  }
}

const startSyncMessage = (targetType: SyncType) => testResult.value === 'success' &&
  (!currentSyncType.value || currentSyncType.value === SyncType.NONE) &&
  tempSyncOption.value === targetType

const stopSyncMessage = () => (currentSyncType.value !== tempSyncOption.value) && currentSyncType.value === SyncType.GITHUB && tempSyncOption.value === SyncType.NONE


const showWrongTokenMessage = () => useRouter().currentRoute.value.query.token === "failed"

</script>
