<template>


  <q-toolbar class="text-primary lightgrey" v-if="tabsStore.tabsets.size > 0">
    <div class="row fit">
      <q-toolbar-title>
        <div class="row justify-start items-baseline">
          <div class="col-10">Tabsets Extension Settings</div>
          <div class="col-2 text-right">
            <OpenRightDrawerWidget/>
          </div>
        </div>
      </q-toolbar-title>
    </div>
  </q-toolbar>

  <div class="justify-start items-start greyBorderTop">
    <q-tabs align="left" class="bg-grey-1"
            inline-label
            v-model="tab"
            no-caps>
      <q-tab name="appearance" label="Appearance"/>
      <q-tab name="subscription" label="Subscription" icon="o_shopping_bag"/>
      <q-tab name="sharing" label="Sharing"/>
      <q-tab name="syncing" label="Syncing" icon="o_shopping_bag" v-if="LocalStorage.has(SUBSCRIPTION_ID_IDENT)"/>
      <q-tab name="thirdparty" label="Third Party Services"/>
      <!--      <q-tab name="ignored" label="Ignored Urls"/>-->
      <q-tab name="archived" label="Archived Tabsets"
             v-if="usePermissionsStore().hasFeature(FeatureIdent.ARCHIVE_TABSET)"/>
      <q-tab name="search" label="Search Engine" v-if="devEnabled"/>
      <q-tab name="importExport" label="Import/Export"/>
      <q-tab name="internals" label="Internals" v-if="devEnabled"/>
      <q-tab name="featureToggles" label="Feature Toggles"/>
    </q-tabs>
  </div>

  <div v-if="tab === 'appearance'">


    <div class="q-pa-md q-gutter-sm">
      <q-banner rounded class="bg-grey-1 text-primary">On this settings page, you can adjust the general appearance of
        the tabsets extension.
      </q-banner>

      <div class="row items-baseline q-ma-md">
        <div class="col-3">
          Title
        </div>
        <div class="col-7">
          <q-input type="text" color="primary" filled v-model="installationTitle" label="">
            <template v-slot:prepend>
              <q-icon name="o_edit_note"/>
            </template>
          </q-input>
        </div>
        <div class="col">

        </div>
      </div>

      <div class="row items-baseline q-ma-md">
        <div class="col-3">
          Dark Mode (experimental)
        </div>
        <div class="col-9">
          <q-radio v-model="darkMode" :val="true" label="Enabled"/>
          <q-radio v-model="darkMode" :val="false" label="Disabled"/>
        </div>
      </div>

      <div class="row items-baseline q-ma-md">
        <div class="col-3">
          Tab Info Detail Level {{ detailLevelPerTabset ? ' (Default)' : '' }}
        </div>
        <div class="col-9">
          <q-radio v-model="detailLevel" :val="ListDetailLevel.MINIMAL" label="Minimal Details"/>
          <q-radio v-model="detailLevel" :val="ListDetailLevel.SOME" label="Some Details"/>
          <q-radio v-model="detailLevel" :val="ListDetailLevel.MAXIMAL" label="All Details"/>
        </div>
        <div class="col-3">

        </div>
        <div class="col-9">
          <q-checkbox v-model="detailLevelPerTabset" label="Adjust individually per tabset"/>
        </div>
      </div>

      <div class="row items-baseline q-ma-md">
        <div class="col-3">
          URLs
        </div>
        <div class="col-9">
          <q-checkbox v-model="fullUrls" label="Show full URLs in Tab Details"/>
        </div>
      </div>

      <div class="row items-baseline q-ma-md">
        <div class="col-3">
          Ignore Browser Extensions as tabs
        </div>
        <div class="col-9">
          <q-toggle v-model="ignoreExtensionsEnabled"/>
        </div>
      </div>

      <div class="row items-baseline q-ma-md" v-if="usePermissionsStore().hasFeature(FeatureIdent.AUTO_TAB_SWITCHER)">
        <div class="col-3">
          Tab Switching Time in seconds
        </div>
        <div class="col-9">
          <q-select
            label="Tab Auto-Switcher Settings"
            filled
            v-model="autoSwitcherOption"
            :options="autoSwitcherOptions"
            map-options
            emit-value
            style="width: 250px"
          />
        </div>
      </div>

      <div class="row items-baseline q-ma-md">
        <div class="col-3">
          Restore Info Messages
        </div>
        <div class="col-3">
          If you accidentally closed an info message box with a hint, you can restore them all by clicking here:
        </div>
        <div class="col-1"></div>
        <div class="col">
          <q-btn label="Restore Hints" @click.stop="restoreHints"/>
        </div>
      </div>

      <div class="row items-baseline q-ma-md" v-if="usePermissionsStore().hasFeature(FeatureIdent.OPENTABS_THRESHOLD)">
        <div class="col-3">
          Warning Thresholds
        </div>
        <div class="col-3">
          warnings start when minimum open tabs count is reached<br>
          Reaching the maximum will turn the bar red.
        </div>
        <div class="col q-ma-xl">
          <q-range
            v-model="settingsStore.thresholds"
            :step=10
            marker-labels
            :min=0
            :max=100
          />
        </div>
      </div>

      <div class="row items-baseline q-ma-md">
        <div class="col-3">
          Thumbnail Quality in %
        </div>
        <div class="col-3">
          larger Thumbnails look better but need more (local) storage.
        </div>
        <div class="col q-ma-xl">
          <q-slider v-model="settingsStore.thumbnailQuality"
                    marker-labels
                    :min="0" :max="100" :inner-min="10" :inner-max="100" :step=10></q-slider>
        </div>
      </div>

      <div class="row items-baseline q-ma-md" v-if="devEnabled">
        <div class="col-3">
          New Version Simulation
        </div>
        <div class="col-3">
          Simulate that there is a new version available
        </div>
        <div class="col q-ma-xl">
          <span class="text-blue cursor-pointer" @click="simulateNewVersion('0.2.12')">Simulate</span>
        </div>
      </div>

      <div class="row items-baseline q-ma-md" v-if="devEnabled">
        <div class="col-3">
          New Suggestion Simulation
        </div>
        <div class="col-3">
          Simulate that there is a new suggestion to use a (new) feature (refresh sidebar for effects)
        </div>
        <div class="col q-ma-xl">
          <span class="text-blue cursor-pointer" @click="simulateStaticSuggestion()">Simulate</span>
        </div>
      </div>

    </div>

  </div>

  <div v-if="tab === 'subscription'">

    <div class="q-pa-md q-gutter-sm">
      <q-banner rounded class="bg-grey-1 text-primary" style="border: 1px solid orange">
        <div class="text-body1">Experimental: Subscribe to Tabsets Pro Features.</div>
        <div class="text-caption">
          Some features (currently: syncing via git) need a subscription.<br><br>
          <span class="text-red">This is not working yet. No fees will be charged.</span>
        </div>
      </q-banner>
    </div>

    <div class="row items-baseline q-ma-md q-gutter-lg">
      <template v-if="!subscription">
        <div class="col-3">
          Subscribe
        </div>
        <div class="col-7">
          <q-btn label="Subscribe" @click="subscribe()"/>
        </div>
        <div class="col"></div>
      </template>
      <template v-else>
        <div class="col-3">
          Subscription
        </div>
        <div class="col-7">
          <q-btn label="Test Subscription" @click="testSubscription()"/>
        </div>
        <div class="col"></div>
      </template>

      <div class="col-3">
        Subscription ID
      </div>
      <div class="col-7">
        <q-input type="text" color="primary" filled v-model="subscription" label="">
          <template v-slot:prepend>
            <q-icon name="o_shopping_bag"/>
          </template>
        </q-input>
      </div>
      <div class="col">
        <a href="https://billing.stripe.com/p/login/6oE00CenQc3R5IQdQQ" target="_blank">Portal</a>
      </div>
    </div>
  </div>

  <div v-if="tab === 'sharing'">

    <div class="q-pa-md q-gutter-sm">
      <q-banner rounded class="bg-grey-1 text-primary" style="border:1px solid orange">On this settings page, you can
        adjust your sharing experience
      </q-banner>

      <div class="row items-baseline q-ma-md q-gutter-lg">
        <div class="col-3">
          Nickname
        </div>
        <div class="col-7">
          <q-input color="primary" filled v-model="nickname" label="">
            <template v-slot:prepend>
              <q-icon name="ios_share"/>
            </template>
          </q-input>
        </div>
        <div class="col"></div>

        <div class="col-3">
          Avatar
        </div>
        <div class="col-7">
          <q-input type="url" color="primary" filled v-model="avatar" label="">
            <template v-slot:prepend>
              <q-icon name="ios_share"/>
            </template>
          </q-input>
        </div>
        <div class="col text-right">
          <q-avatar>
            <img :src="avatar">
          </q-avatar>
        </div>

        <div class="col-3">
          Mqtt Connection
        </div>
        <div class="col-7">
          <q-input
            @blur="sendMsg('mqtt-url-changed', {mqttUrl})"
            type="url" color="primary" filled v-model="mqttUrl"
            hint="e.g. mqtts://public:public@public.cloud.shiftr.io:443">
            <template v-slot:prepend>
              <q-icon name="ios_share"/>
            </template>
          </q-input>
        </div>
        <div class="col text-right">

        </div>

        <div class="col-3">
          Installation ID
        </div>
        <div class="col-7">
          {{ installationId }}
        </div>
        <div class="col">

        </div>

      </div>

    </div>

  </div>

  <div v-if="tab === 'syncing'">

    <div class="q-pa-md q-gutter-sm">
      <q-banner rounded class="bg-grey-1 text-primary" style="border: 1px solid orange">
        <div class="text-body1">Experimental: Sync your tabsets with git.</div>
        <div class="text-caption">
          You need to provide a git repository URL and a personal access token (e.g. for
          github: <a
          href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens"
          target="_blank">github example</a>).
        </div>
        <div class="text-caption">
          Initially, the repository should be empty.
        </div>
      </q-banner>

      <div class="row items-baseline q-ma-md q-gutter-lg">
        <div class="col-3">
          Syncing
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

        <template v-if="tempSyncOption === SyncType.GIT">

          <div class="col-3">
            Git Repository URL
          </div>
          <div class="col-7">
            <q-input type="url" color="primary" filled v-model="gitRepoUrl" label="" autocomplete="sync-url">
              <template v-slot:prepend>
                <q-icon name="sync"/>
              </template>
            </q-input>
          </div>
          <div class="col text-right"></div>

          <!--          <div class="col-3">-->
          <!--            Store Name-->
          <!--          </div>-->
          <!--          <div class="col-7">-->
          <!--            <q-input type="url" color="primary" filled v-model="gitRepoStore" label=""-->
          <!--                     lazy-rules-->
          <!--                     :rules="[-->
          <!--                       val => !!val || 'Store is required',-->
          <!--                       val => /^[A-Za-z0-9]*$/.test(val) || 'Please use only characters or numbers'-->
          <!--                       ]"-->
          <!--                     hint="a subpath in your git repo to distinguish different sync stores">-->
          <!--              <template v-slot:prepend>-->
          <!--                <q-icon name="sync"/>-->
          <!--              </template>-->
          <!--            </q-input>-->
          <!--          </div>-->
          <!--          <div class="col text-right"></div>-->

          <div class="col-3">
            Git Repository Token
          </div>
          <div class="col-7">
            <q-input type="password" color="primary" filled v-model="gitRepoToken" label=""
                     hint="needed for write access, for private repositories also for read access">
              <template v-slot:prepend>
                <q-icon name="sync"/>
              </template>
            </q-input>
          </div>
          <div class="col text-right"></div>
        </template>

        <template v-if="tempSyncOption === SyncType.GIT && gitRepoUrl">
          <div class="col-3"></div>
          <div class="col-7">
            <q-btn
              label="Test Connection" @click="testGitConnection()"/>
            <span class="q-ml-md"> {{ gitTestResult }}</span>
          </div>
          <div class="col text-right"></div>
        </template>

        <template v-if="gitTestResult === 'success' && !syncType && tempSyncOption === SyncType.GIT">
          <div class="col-3"></div>
          <div class="col-7">
            <div>You can switch to the git-based sync version of tabsets now if you wish.</div>
            <div>Please follow these steps:</div>
            <ul>
              <li><span class="cursor-pointer text-blue-8" @click="tab = 'importExport'">Export</span> your tabsets
                first
              </li>
              <li>Click on 'Start Syncing' below</li>
              <li>Restart Tabsets (close and open again)</li>
              <li>Import your tabsets again</li>
            </ul>
          </div>
          <div class="col text-right"></div>
        </template>

        <template v-if="syncType === SyncType.GIT && tempSyncOption === SyncType.NONE">
          <div class="col-3"></div>
          <div class="col-7">
            <div>You can stop using the git-based sync version of tabsets if you wish.</div>
            <div>Please follow these steps:</div>
            <ul>
              <li><span class="cursor-pointer text-blue-8" @click="tab = 'importExport'">Export</span> your tabsets
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
          v-if="tempSyncOption === SyncType.GIT && gitRepoUrl && gitTestResult === 'success'">

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


        <!--        <div class="col-3"></div>-->
        <!--        <div class="col-7">-->
        <!--          gitTestResult: {{ gitTestResult }}<br>-->
        <!--          syncType: {{ syncType }}<br>-->
        <!--          tempSyncOption: {{ tempSyncOption }}<br>-->
        <!--        </div>-->
        <!--        <div class="col text-right"></div>-->

      </div>

    </div>

  </div>

  <div v-if="tab === 'internals'">

    <div class="q-pa-md q-gutter-sm">

      <div class="text-h6">Permissions</div>

      <q-banner rounded class="bg-grey-1 text-primary">The active permissions for the Tabset Extension</q-banner>

      <div class="row items-baseline q-ma-md">
        <div class="col-3">
          Active Permissions
        </div>
        <div class="col-9">
          {{ permissionsList.join(", ") }}
        </div>
      </div>

      <div class="row items-baseline q-ma-md">
        <div class="col-3">
          Allowed Origins
        </div>
        <div class="col-9">
          {{ usePermissionsStore().permissions?.origins }}
        </div>
      </div>

      <div class="text-h6">Groups</div>

      <q-banner rounded class="bg-grey-1 text-primary">All Chrome Groups, active and non-active</q-banner>

      <div class="row items-baseline q-ma-md">
        <div class="col-3">
          All Groups
        </div>
        <div class="col-9">
          {{ useGroupsStore().tabGroups }}
        </div>
      </div>

      <q-banner rounded class="bg-grey-1 text-primary">All active Chrome Groups</q-banner>

      <div class="row items-baseline q-ma-md">
        <div class="col-3">
          Active Groups
        </div>
        <div class="col-9">
          {{ useGroupsStore().currentTabGroups }}
        </div>
      </div>


    </div>

  </div>

  <div v-if="tab === 'ignored'">

    <div class="q-pa-md q-gutter-sm">

      <q-banner rounded class="bg-grey-1 text-primary">Urls can be ignored so that the tabsets extension will not
        notifiy you about changes.
      </q-banner>

      <!--      <div class="row q-pa-md" v-for="tabset in ignoredUrls()">-->
      <!--        <div class="col-3"><b>{{ tabset.url }}</b></div>-->
      <!--        <div class="col-3"></div>-->
      <!--        <div class="col-1"></div>-->
      <!--        <div class="col-5">-->
      <!--          &lt;!&ndash;          <q-btn label="Un-Archive" @click="unarchive(tabset)"/>&ndash;&gt;-->
      <!--        </div>-->
      <!--      </div>-->
    </div>

  </div>

  <div v-if="tab === 'archived'">
    <div class="q-pa-md q-gutter-sm">

      <q-banner rounded class="bg-grey-1 text-primary">Tabsets can be archived to remove them from direct view. Here's
        the list of archived tabsets so that
        they can be restored if needed.
      </q-banner>

      <div class="row q-pa-md" v-for="tabset in archivedTabsets()">
        <div class="col-3"><b>{{ tabset.name }}</b></div>
        <div class="col-3"></div>
        <div class="col-1"></div>
        <div class="col-5">
          <q-btn label="Un-Archive" @click="unarchive(tabset)"/>
        </div>
      </div>
    </div>
  </div>

  <div v-if="tab === 'search'">

    <div class="q-pa-md q-gutter-sm">

      <q-banner rounded class="bg-grey-1 text-primary">This Browser Extension tracks your tabsets and provides a
        search
        bar to search for keywords.
      </q-banner>

      <div class="row q-pa-md">
        <div class="col-3"><b>Search Index</b></div>
        <div class="col-3">Current Size: {{ indexSize }} Entries</div>
        <div class="col-1"></div>
        <div class="col-5">
          <span class="text-blue cursor-pointer" @click="downloadIndex">[Download]</span>&nbsp;
          <span class="text-blue cursor-pointer" @click="clearIndex">[clear Index]</span>&nbsp;
        </div>
      </div>
    </div>

  </div>

  <div v-if="tab === 'thirdparty'">

    <div class="q-pa-md q-gutter-sm">

      <q-banner rounded class="bg-grey-1 text-primary">
        TODO
      </q-banner>

      <div class="row q-pa-md">
        <div class="col-3"><b>DuckDuckGo FavIcon Service</b></div>
        <div class="col-5">Usually, the favicon (the little icon displayed next to a tab url) is provided by the page
          you are visiting.
          Sometimes, Tabsets does not have the information (yet) and might defer to a third party service, here
          duckduckgo. Switch this off
          if you do not want to use this service.
        </div>
        <div class="col-1"></div>
        <div class="col-3">
          <q-toggle v-model="ddgEnabled"/>
        </div>
      </div>

    </div>

  </div>

  <div v-if="tab === 'importExport'">

    <div class="q-pa-md q-gutter-sm">

      <q-banner rounded class="bg-grey-1 text-primary">You can export your data in various formats and re-import them
        from json. Please
        note that it is not guaranteed that older exports can be imported with newer versions of the tabsets
        extension.
      </q-banner>

      <div class="row q-pa-md">
        <div class="col-3"><b>Export</b></div>
        <div class="col-3">json or as bookmarks</div>
        <div class="col-1"></div>
        <div class="col-5">
          <q-btn
            @click="showExportDialog"
            flat round dense icon="file_download" color="primary">
            <q-tooltip>Export your tabsets</q-tooltip>
          </q-btn>
        </div>
      </div>

      <div class="row q-pa-md">
        <div class="col-3"><b>Import</b></div>
        <div class="col-3">from json</div>
        <div class="col-1"></div>
        <div class="col-5">
          <q-btn
            @click="showImportDialog"
            flat round dense icon="file_upload" color="primary">
            <q-tooltip>Import your tabsets backup</q-tooltip>
          </q-btn>
        </div>
      </div>

    </div>

  </div>


  <div v-if="tab === 'featureToggles'">

    <div class="q-pa-md q-gutter-sm">

      <q-banner rounded class="bg-grey-1 text-primary">Switch on experimental features (or off). These feature toggles
        are meant for developers
        only as they might break functionality and/or destroy data. Once they are considered 'safe enough', they will be
        available at the
        "experimental features" view on the left.
      </q-banner>

      <div class="row q-pa-md">
        <div class="col-3"><b>Developer Mode</b></div>
        <div class="col-3">activates a couple of experimental features and debug insights. You should only use this
          if you can live with loosing data.
        </div>
        <div class="col-1"></div>
        <div class="col-5">
          <q-toggle v-model="devEnabled"/>
        </div>
      </div>

    </div>

  </div>

</template>

<script setup lang="ts">
import {useTabsStore} from "src/stores/tabsStore"
import {onMounted, ref, watch, watchEffect} from "vue";
import {LocalStorage, useQuasar} from "quasar";
import {useSearchStore} from "src/stores/searchStore";
import TabsetService from "src/services/TabsetService";
import ExportDialog from "components/dialogues/ExportDialog.vue";
import ImportDialog from "components/dialogues/ImportDialog.vue";
import _ from "lodash";
import {Tabset, TabsetStatus} from "src/models/Tabset";
import {MarkTabsetAsDefaultCommand} from "src/domain/tabsets/MarkTabsetAsDefault";
import {useNotificationHandler} from "src/services/ErrorHandler";
import {useCommandExecutor} from "src/services/CommandExecutor";
import NavigationService from "src/services/NavigationService";
import {DrawerTabs, ListDetailLevel, useUiStore} from "src/stores/uiStore";
import {useBookmarksStore} from "src/stores/bookmarksStore";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {GrantPermissionCommand} from "src/domain/commands/GrantPermissionCommand";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {RevokePermissionCommand} from "src/domain/commands/RevokePermissionCommand";
import {FeatureIdent} from "src/models/AppFeature";
import {useSettingsStore} from "src/stores/settingsStore"
import OpenRightDrawerWidget from "components/widgets/OpenRightDrawerWidget.vue";
import {useUtils} from "src/services/Utils";
import Analytics from "src/utils/google-analytics";
import {useGroupsStore} from "../stores/groupsStore";
import {useSuggestionsStore} from "stores/suggestionsStore";
import {StaticSuggestionIdent, Suggestion} from "src/models/Suggestion";
import {SyncType} from "stores/appStore";
import GitPersistentService from "src/services/persistence/GitPersistentService";
import {useRoute, useRouter} from "vue-router";
import {FirebaseCall} from "src/services/firebase/FirebaseCall";
import {
  SHARING_AUTHOR_IDENT,
  SHARING_AVATAR_IDENT,
  SHARING_INSTALLATION,
  SHARING_MQTT_IDENT, STRIP_CHARS_IN_USER_INPUT,
  SUBSCRIPTION_ID_IDENT, SYNC_GIT_TOKEN, SYNC_GIT_URL, TITLE_IDENT
} from "boot/constants";

const {sendMsg} = useUtils()

const tabsStore = useTabsStore()
const featuresStore = useSettingsStore()
const searchStore = useSearchStore()
const settingsStore = useSettingsStore()

const localStorage = useQuasar().localStorage
const $q = useQuasar()
const route = useRoute()
const router = useRouter()

useUiStore().rightDrawerSetActiveTab(DrawerTabs.FEATURES)

const view = ref('grid')
const indexSize = ref(0)

const devEnabled = ref<boolean>(featuresStore.isEnabled('dev'))
const ddgEnabled = ref<boolean>(!featuresStore.isEnabled('noDDG'))
const ignoreExtensionsEnabled = ref<boolean>(!featuresStore.isEnabled('extensionsAsTabs'))
const permissionsList = ref<string[]>([])

const darkMode = ref<boolean>(localStorage.getItem('darkMode') || false)
const detailLevel = ref<ListDetailLevel>(localStorage.getItem('ui.detailLevel') || ListDetailLevel.MAXIMAL)

const nickname = ref<string>(LocalStorage.getItem(SHARING_AUTHOR_IDENT) || '')
const avatar = ref<string>(LocalStorage.getItem(SHARING_AVATAR_IDENT) as string || '')
const mqttUrl = ref<string>(LocalStorage.getItem(SHARING_MQTT_IDENT) as string || '')
const installationId = ref<string>(localStorage.getItem(SHARING_INSTALLATION) as string || '---')

const bookmarksPermissionGranted = ref<boolean | undefined>(usePermissionsStore().hasPermission('bookmarks'))
const pageCapturePermissionGranted = ref<boolean | undefined>(usePermissionsStore().hasPermission('history'))
const allUrlsOriginGranted = ref<boolean | undefined>(usePermissionsStore().hasAllOrigins())
const fullUrls = ref(localStorage.getItem('ui.fullUrls') || false)
const detailLevelPerTabset = ref(localStorage.getItem('ui.detailsPerTabset') || false)

const gitRepoToken = ref<string>(LocalStorage.getItem(SYNC_GIT_TOKEN) as string || '')
const gitRepoUrl = ref<string>(localStorage.getItem(SYNC_GIT_URL) as string || '')
//const gitRepoStore = ref<string>(localStorage.getItem('sync.git.store') as string || '')
const gitTestResult = ref<string | undefined>(undefined)
const syncType = ref<string | undefined>(undefined)
const tempSyncOption = ref<SyncType>(localStorage.getItem('sync.type') as SyncType || SyncType.NONE)

const syncOptions = [
  {label: 'No Syncing', value: SyncType.NONE},
  {label: 'Syncing via git repository', value: SyncType.GIT}
]


const subscription = ref<string>(LocalStorage.getItem(SUBSCRIPTION_ID_IDENT) as string || '')
const installationTitle = ref<string>(LocalStorage.getItem(TITLE_IDENT) as string || 'My Tabsets')

const tab = ref<string>(route.query['tab'] ? route.query['tab'] as string : 'appearance')

const autoSwitcherOption = ref<number>(localStorage.getItem('ui.tabSwitcher') as number || 5000)

const autoSwitcherOptions = [
  {label: '1 sec.', value: 1000},
  {label: '2 sec.', value: 2000},
  {label: '3 sec.', value: 3000},
  {label: '5 sec.', value: 5000},
  {label: '10 sec.', value: 10000},
  {label: '30 sec.', value: 30000},
  {label: '1 min.', value: 60000},
  {label: '2 min.', value: 120000},
  {label: '5 min.', value: 300000}
]

const {handleError} = useNotificationHandler()

onMounted(() => {
  Analytics.firePageViewEvent('SettingsPage', document.location.href);
})

let suggestionsCounter = 0

watchEffect(() => permissionsList.value = usePermissionsStore().permissions?.permissions || [])

watchEffect(() => bookmarksPermissionGranted.value = usePermissionsStore().hasPermission('bookmarks'))
// watchEffect(() => historyPermissionGranted.value = usePermissionsStore().hasPermission('history'))
watchEffect(() => pageCapturePermissionGranted.value = usePermissionsStore().hasPermission('pageCapture'))

watch(() => bookmarksPermissionGranted.value, (newValue, oldValue) => {
  if (newValue === oldValue) {
    return
  }
  if (bookmarksPermissionGranted.value && !usePermissionsStore().hasPermission('bookmarks')) {
    useCommandExecutor()
      .executeFromUi(new GrantPermissionCommand("bookmarks"))
      .then((res: ExecutionResult<boolean>) => bookmarksPermissionGranted.value = res.result)
  } else if (!bookmarksPermissionGranted.value) {
    useCommandExecutor()
      .executeFromUi(new RevokePermissionCommand("bookmarks"))
      .then(() => {
        useBookmarksStore().loadBookmarks()
      })
  }
})


watch(() => pageCapturePermissionGranted.value, (newValue, oldValue) => {
  if (newValue === oldValue) {
    return
  }
  if (pageCapturePermissionGranted.value && !usePermissionsStore().hasPermission('pageCapture')) {
    useCommandExecutor()
      .executeFromUi(new GrantPermissionCommand("pageCapture"))
      .then((res: ExecutionResult<boolean>) => pageCapturePermissionGranted.value = res.result)
  } else if (!pageCapturePermissionGranted.value) {
    useCommandExecutor()
      .executeFromUi(new RevokePermissionCommand("pageCapture"))
  }
})

watchEffect(() => {
  $q.dark.set(darkMode.value)
  localStorage.set('darkMode', darkMode.value)
})

watchEffect(() => {
  (gitRepoUrl.value && gitRepoUrl.value.trim().length > 0) ?
    LocalStorage.set(SYNC_GIT_URL, gitRepoUrl.value) :
    LocalStorage.remove(SYNC_GIT_URL)
  gitTestResult.value = undefined
})

watchEffect(() => {
  (gitRepoToken.value && gitRepoToken.value.trim().length > 0) ?
    LocalStorage.set(SYNC_GIT_TOKEN, gitRepoToken.value) :
    LocalStorage.remove(SYNC_GIT_TOKEN)
  gitTestResult.value = undefined
})

watchEffect(() => {
  //localStorage.set('sync.type', tempSyncOption.value)
  syncType.value = localStorage.getItem('sync.type') as SyncType
})

watchEffect(() => {
  (subscription.value && subscription.value.trim().length > 0) ?
    LocalStorage.set(SUBSCRIPTION_ID_IDENT, subscription.value) :
    LocalStorage.remove(SUBSCRIPTION_ID_IDENT)
})

watchEffect(() => {
  (installationTitle.value && installationTitle.value.trim().length > 0) ?
    LocalStorage.set(TITLE_IDENT, installationTitle.value.replace(STRIP_CHARS_IN_USER_INPUT, '')) :
    LocalStorage.remove(TITLE_IDENT)
})

watchEffect(() => {
  (nickname.value && nickname.value.trim().length > 0) ?
    LocalStorage.set(SHARING_AUTHOR_IDENT, nickname.value.replace(STRIP_CHARS_IN_USER_INPUT, '')) :
    LocalStorage.remove(SHARING_AUTHOR_IDENT)
})

watchEffect(() => {
  (avatar.value && avatar.value.trim().length > 0) ?
    LocalStorage.set(SHARING_AVATAR_IDENT, avatar.value.replace(STRIP_CHARS_IN_USER_INPUT, '')) :
    LocalStorage.remove(SHARING_AVATAR_IDENT)
})

watchEffect(() => {
  console.log("setting sharing.mqttUrl to", mqttUrl.value.replace(STRIP_CHARS_IN_USER_INPUT, ''))
  useUiStore().sharingMqttUrl = mqttUrl.value
})

watchEffect(() => {
  localStorage.set('ui.detailLevel', detailLevel.value)
  sendMsg('detail-level-changed', {level: detailLevel.value})
})

watchEffect(() => {
  localStorage.set('ui.fullUrls', fullUrls.value)
  sendMsg('fullUrls-changed', {value: fullUrls.value})
})

watchEffect(() => {
  localStorage.set('ui.detailsPerTabset', detailLevelPerTabset.value)
  sendMsg('detail-level-perTabset-changed', {level: detailLevelPerTabset.value})
})

watchEffect(() => {
  //featuresStore.setFeatureToggle("stats", statsEnabled.value)
  featuresStore.setFeatureToggle("dev", devEnabled.value)
  featuresStore.setFeatureToggle("noDDG", !ddgEnabled.value)
  featuresStore.setFeatureToggle("extensionsAsTabs", !ignoreExtensionsEnabled.value)
})

watchEffect(() => {
  localStorage.set("layout", view.value)
})

watchEffect(() => {
  // @ts-ignore
  indexSize.value = searchStore?.getIndex().size()
})

watchEffect(() => {
  LocalStorage.set("ui.tabSwitcher", autoSwitcherOption.value)
})

const downloadIndex = () => {
  const data = JSON.stringify(searchStore?.getIndex())
  return TabsetService.createFile(data, "tabsetIndex.json");
}

const clearIndex = () => searchStore.init()

const archivedTabsets = () => {
  let tabsets = [...tabsStore.tabsets.values()]
  return _.sortBy(_.filter(tabsets, (ts: Tabset) => ts.status === TabsetStatus.ARCHIVED), ['name'])
}

const unarchive = (tabset: Tabset) => useCommandExecutor().executeFromUi(new MarkTabsetAsDefaultCommand(tabset.id))

// const ignoredUrls = () => useTabsStore().ignoredTabset?.tabs

const simulateNewVersion = (version: string) => NavigationService.updateAvailable({version: version})

const restoreHints = () => useUiStore().restoreHints()

const showExportDialog = () => $q.dialog({component: ExportDialog, componentProps: {inSidePanel: true}})
const showImportDialog = () => $q.dialog({component: ImportDialog, componentProps: {inSidePanel: true}})

const simulateStaticSuggestion = () => {
  const suggestions: [Suggestion] = [
    // @ts-ignore
    Suggestion.getStaticSuggestion(StaticSuggestionIdent.TRY_SPACES_FEATURE),
    Suggestion.getStaticSuggestion(StaticSuggestionIdent.TRY_BOOKMARKS_FEATURE)
  ]
  useSuggestionsStore().addSuggestion(suggestions[suggestionsCounter++ % 2])
}

const testGitConnection = async () => {
  if (gitRepoUrl.value) {
    console.log("testing git connection with", gitRepoUrl.value, gitRepoToken.value?.substring(0, 5) + "...")
    const res = await GitPersistentService.testConnection(gitRepoUrl.value)//, gitRepoToken)
    console.log("got res:", res)
    gitTestResult.value = res
  } else {
    gitTestResult.value = "no repo URL given"
  }
}

const startGitSyncing = () => localStorage.set("sync.type", SyncType.GIT)
const stopGitSyncing = () => localStorage.set("sync.type", SyncType.NONE)

const subscribe = async () => {
  const callbackUrl = chrome.runtime.getURL("/www/index.html#/thanks")
  FirebaseCall.post("/stripe/create-checkout-session/tabsets", {
    callbackUrl: btoa(callbackUrl)
  })
    .then((res) => {
      console.log("res", res)
      window.location.href = res.data.url
    })
}

const testSubscription = async () => {
  FirebaseCall.post("/stripe/test-subscription/tabsets", {})
    .then((res) => {
      console.log("res", res)
      window.location.href = res.data.url
    })
}


//const syncingSetTo = (t: SyncType) => localStorage.getItem('sync.type') as SyncType === SyncType.GIT

</script>

