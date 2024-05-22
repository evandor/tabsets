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
    <div class="col-7 text-caption" v-if="tempSyncOption === SyncType.COUCHDB">
      Sync your tabsets across browsers and computers via a database (not yet supported)
    </div>
    <div class="col-7 text-caption" v-if="tempSyncOption === SyncType.FIRESTORE">
      Sync your data across browsers and computers
    </div>

    <div class="col"></div>

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

    <template v-if="tempSyncOption === SyncType.COUCHDB && couchdbUrl">
      <div class="col-3"></div>
      <div class="col-7">
        <q-btn
          label="Test DB Connection" @click="testDbConnection()"/>
        <span class="q-ml-md"> {{ testResult }}</span>
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

        <q-banner rounded style="border: 1px solid orange" v-if="useTabsetsStore().allTabsCount > 0">
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
import {FirebaseCall} from "src/services/firebase/FirebaseCall";
import {useUtils} from "src/core/services/Utils";
import {useNotificationHandler} from "src/services/ErrorHandler";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {useAuthStore} from "stores/authStore";
import {doc, updateDoc} from "firebase/firestore";
import FirebaseServices from "src/services/firebase/FirebaseServices";
import {useUiStore} from "stores/uiStore";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";

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

const syncOptions =
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
    await updateDoc(doc(FirebaseServices.getFirestore(), "users", useAuthStore().user.uid), {sync: {type: tempSyncOption.value}})
    LocalStorage.set(SYNC_TYPE, tempSyncOption.value)
    if (tempSyncOption.value === SyncType.NONE) {
      useUiStore().showSwitchedToLocalInfo = true
    }
    sendMsg('reload-application')
    handleSuccess(new ExecutionResult<string>("done", "done"))
  } catch (err) {
    console.error("startGitSyncing Error", err)
    handleError('could not start syncing')
  }
}

const stopSyncMessage = () => (currentSyncType.value !== tempSyncOption.value) && currentSyncType.value === SyncType.GITHUB && tempSyncOption.value === SyncType.NONE


</script>
