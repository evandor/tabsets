<template>
    <q-banner rounded class="bg-grey-1 text-primary" style="border: 1px solid orange">
      <div class="text-body1">Experimental: Synchronize your tabsets across computers and browsers</div>
    </q-banner>

    <div class="row items-baseline q-ma-md q-gutter-lg">
      <div class="col-3" v-if="tempSyncOption === syncType">
        Current Syncing
      </div>
      <div class="col-3" v-else>
        Set Syncing to
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
      <div class="col-7 text-caption" v-if="tempSyncOption === SyncType.GITLAB">
        Sync your tabsets across browsers and computers via a gitlab repository (not yet supported)
      </div>
      <div class="col-7 text-caption" v-if="tempSyncOption === SyncType.COUCHDB">
        Sync your tabsets across browsers and computers via a database (not yet supported)
      </div>
      <div class="col-7 text-caption"
           v-if="tempSyncOption === SyncType.MANAGED_COUCHDB || tempSyncOption === SyncType.MANAGED_GIT">
        Use Managed Synchronisation to access your tabsets from anywhere for a small fee (not yet supported)
        <div class="q-mt-md" v-if="subscription === undefined">
          If you want to use this, create a <span class="cursor-pointer text-blue-8"
                                                  @click.stop="emits('wasClicked',{tab: 'subscription'})">subscription</span>
          and
          come back here.
        </div>
      </div>
      <div class="col"></div>

      <template v-if="tempSyncOption === SyncType.GITLAB">

        <div class="col-3">
          Git Repository URL
        </div>
        <div class="col-7">
          <q-input type="url" color="primary" filled v-model="gitlabRepoUrl" label="" autocomplete="sync-url">
            <template v-slot:prepend>
              <q-icon name="sync"/>
            </template>
          </q-input>
        </div>
        <div class="col text-right"></div>

        <div class="col-3">
          Gitlab Repository Token
        </div>
        <div class="col-7">
          <q-input type="password" color="primary" filled v-model="gitlabRepoToken" label=""
                   hint="needed for write access, for private repositories also for read access">
            <template v-slot:prepend>
              <q-icon name="sync"/>
            </template>
          </q-input>
        </div>
        <div class="col text-right"></div>
      </template>

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
        <div class="col text-right"></div>

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
        </div>
        <div class="col text-right"></div>
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

      <template v-if="tempSyncOption === SyncType.MANAGED_GIT && subscription">
        <div clas="col-3">&nbsp;</div>
        <div clas="col-7">You have added a subscription; let's try to setup your account</div>
        <div clas="col">&nbsp;</div>

        <div class="col-3">&nbsp;</div>
        <div class="col-7">
          <q-btn label="Check Setup" @click="checkManagedGitSetup()"/>
          <span class="q-ml-md"> {{ testResult }}</span>
        </div>
        <div class="col text-right">&nbsp;</div>
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

      <template v-if="startSyncMessage(SyncType.MANAGED_GIT)">
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
          <q-banner rounded class="bg-grey-1 text-primary" style="border: 1px solid orange">
            <div class="text-caption text-red">
              If you do not export your tabsets and import them again you will not have access to the
              data formerly stored in your git repository.
            </div>
          </q-banner>
        </div>
        <div class="col"></div>

        <div class="col-3"></div>
        <div class="col-7">
          <q-btn label="Stop Syncing" @click="stopGitSyncing()"/>
        </div>
        <div class="col text-right"></div>
      </template>

      <template
        v-if="tempSyncOption !== syncType && testResult === 'success'">

        <div class="col-3"></div>
        <div class="col-7">
          <q-banner rounded class="bg-grey-1 text-primary" style="border: 1px solid orange">
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

    </div>

</template>

<script setup lang="ts">
import {SyncType} from "stores/appStore";
import {ref, watchEffect} from "vue";
import {LocalStorage} from "quasar";
import {
  SUBSCRIPTION_ID_IDENT,
  SYNC_COUCHDB_PASSWORD,
  SYNC_COUCHDB_URL,
  SYNC_COUCHDB_USERNAME,
  SYNC_GITHUB_TOKEN,
  SYNC_GITHUB_URL,
  SYNC_GITLAB_TOKEN,
  SYNC_GITLAB_URL, SYNC_TYPE
} from "boot/constants";
import GitPersistentService from "src/services/persistence/GitPersistentService";
import {FirebaseCall} from "src/services/firebase/FirebaseCall";
import {Tabset, TabsetSharing} from "src/models/Tabset";
import {useTabsetService} from "src/services/TabsetService2";

const emits = defineEmits(['wasClicked'])

const syncType = ref<string | undefined>(undefined)
const tempSyncOption = ref<SyncType>(LocalStorage.getItem(SYNC_TYPE) as SyncType || SyncType.NONE)

const gitlabRepoToken = ref<string>(LocalStorage.getItem(SYNC_GITLAB_TOKEN) as string || '')
const gitlabRepoUrl = ref<string>(LocalStorage.getItem(SYNC_GITLAB_URL) as string || '')

const githubRepoToken = ref<string>(LocalStorage.getItem(SYNC_GITHUB_TOKEN) as string || '')
const githubRepoUrl = ref<string>(LocalStorage.getItem(SYNC_GITHUB_URL) as string || '')

const couchdbUsername = ref<string>(LocalStorage.getItem(SYNC_COUCHDB_USERNAME) as string || '')
const couchdbPassword = ref<string>(LocalStorage.getItem(SYNC_COUCHDB_PASSWORD) as string || '')
const couchdbUrl = ref<string>(LocalStorage.getItem(SYNC_COUCHDB_URL) as string || '')

const subscription = ref<string | undefined>(LocalStorage.getItem(SUBSCRIPTION_ID_IDENT) as string || undefined)

const testResult = ref<string | undefined>(undefined)


const syncOptions = [
  {label: 'No Syncing', value: SyncType.NONE, desc: ""},
  {label: 'Syncing via github repository', value: SyncType.GITHUB},
//  {label: 'Syncing via gitlab repository', value: SyncType.GITLAB},
//  {label: 'Syncing via database', value: SyncType.COUCHDB},
  {label: 'Managed Git Synchronisation', value: SyncType.MANAGED_GIT},
//  {label: 'Managed Database Synchronisation', value: SyncType.MANAGED_COUCHDB}
]

function checkAndUpdate(val: string, ident: string) {
  (val && val.trim().length > 0) ?
    LocalStorage.set(ident, val) :
    LocalStorage.remove(ident)
  testResult.value = undefined
}

watchEffect(() => {
  checkAndUpdate(githubRepoUrl.value, SYNC_GITHUB_URL)
})

watchEffect(() => {
  checkAndUpdate(githubRepoToken.value, SYNC_GITHUB_TOKEN)
})

watchEffect(() => {
  checkAndUpdate(couchdbUsername.value, SYNC_COUCHDB_USERNAME)
  checkAndUpdate(couchdbPassword.value, SYNC_COUCHDB_PASSWORD)
  checkAndUpdate(couchdbUrl.value, SYNC_COUCHDB_URL)
})

watchEffect(() => {
  syncType.value = LocalStorage.getItem(SYNC_TYPE) as SyncType
})


const testGitConnection = async () => {
  console.log("testing sync type", syncType.value)
  const url = tempSyncOption.value === SyncType.GITHUB ? githubRepoUrl.value : gitlabRepoUrl.value
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
  console.log("testing sync type", syncType.value)
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

const startGitSyncing = () => LocalStorage.set(SYNC_TYPE, tempSyncOption.value)
const stopGitSyncing = () => LocalStorage.set(SYNC_TYPE, SyncType.NONE)

const startSyncMessage = (targetType: SyncType) => testResult.value === 'success' &&
  (!syncType.value || syncType.value === SyncType.NONE) &&
  tempSyncOption.value === targetType

const stopSyncMessage = () => (syncType.value !== tempSyncOption.value) && syncType.value === SyncType.GITHUB && tempSyncOption.value === SyncType.NONE

const testSubscription = () => {
  console.log("testing subscription", subscription.value)
  FirebaseCall.get("/share/public/" + tabsetId + "?cb=" + new Date().getTime(), false)
    .then((res: any) => {
      const newTabset = res as Tabset
      newTabset.sharing = TabsetSharing.UNSHARED
      //_.forEach(newTabset.tabs, t => t.preview = TabPreview.THUMBNAIL)
      useTabsetService().saveTabset(newTabset)
      useTabsetService().reloadTabset(newTabset.id)
    })
}

const checkManagedGitSetup = async () => {
  try {
    const response = await FirebaseCall.post("/subscriptions", {"userId": "abc"})
    console.log("response", response)
    testResult.value = "success"
  } catch (err) {
    console.log("got error", err)
  }
}

</script>
