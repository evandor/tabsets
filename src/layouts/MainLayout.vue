<template>
  <q-layout view="hHh lpR lFr">
    <q-header elevated>
      <q-toolbar>

        <q-toolbar-title @click="goHome()" class="cursor-pointer">
          {{ title() }}
        </q-toolbar-title>

        <q-input dark dense standout v-model="search"
                 ref="searchBox"
                 style="width:460px;"
                 v-if="tabsStore.tabsets.size > 0"
                 @keydown.enter.prevent="submitSearch()"
                 class="q-ml-md">
          <template v-slot:prepend>
            <q-icon v-if="search === ''" name="search"/>
            <q-icon v-else name="clear" class="cursor-pointer" @click="search = ''"/>
          </template>
        </q-input>

        <q-space/>

        <q-space/>


        <q-space/>

        <q-btn v-if="syncStore.showSyncButton"
               outline rounded
               flat dense icon="cloud_upload"
               color="warning" label="Sync Tabsets..."
               class="q-mr-md"
               @click="syncTabsetsDialog = true">
          <q-tooltip>Synchronizing Tabsets allows you to use tabsets across multiple browsers and computers</q-tooltip>
        </q-btn>

        <div v-if="tabsStore.pendingTabset?.tabs.length > 0 && tabsStore.tabsets.size > 1" class="q-mr-lg">
          {{ tabsStore.pendingTabset?.tabs.length }} unassigned tab(s)
        </div>

<!--        <q-toggle-->
<!--          v-if="syncStore.showSyncMode"-->
<!--          left-label-->
<!--          color="green"-->
<!--          v-model="syncModel"-->
<!--          @update:model-value="val => syncModeToggled(val)"-->
<!--          label=""-->
<!--        />-->


        <span class="q-pr-lg" style="cursor: pointer" v-if="featuresStore.firebaseEnabled && auth.user">
          <q-icon name="person" class="q-mr-md" size="28px"></q-icon>
          <span>{{ auth.user?.email }}</span>
          <q-menu
            touch-position
          >
            <q-list dense style="min-width: 100px">
              <q-item clickable v-close-popup>
                <q-item-section @click="logout()">Logout</q-item-section>
              </q-item>
            </q-list>

          </q-menu>
        </span>

        <span class="q-pr-lg" style="cursor: pointer"
              v-if="featuresStore.firebaseEnabled && !auth.user && someoneSubscribed()">
          <q-icon name="person" class="q-mr-md" size="28px"></q-icon>
          <span @click="router.push('/login')">Login</span>
        </span>

<!--        <q-btn v-if="featuresStore.firebaseEnabled && !auth.user && tabsStore.tabsets.size > 1 && !someoneSubscribed()"-->
<!--               outline rounded color="warning" :disable="onProPage()" label="Check out Tabsets Pro..." class="q-mr-lg"-->
<!--               @click="router.push('/trypro')">-->
<!--          <q-tooltip>Tabsets Pro let's you synchronize your tabsets across devices</q-tooltip>-->
<!--        </q-btn>-->

<!--        <q-icon name="settings" size="2em"-->
<!--                class="q-mr-md cursor-pointer"-->
<!--                @click="openSettingsPage()"-->
<!--                v-if="featuresStore.settingsEnabled"></q-icon>-->

        <q-btn label="Actions" style="width:200px" class="q-mr-lg">
          <q-menu fit>
            <q-list style="min-width: 100px">
              <q-item clickable>
                <q-item-section @click="addTabset()" v-close-popup>Add Tabset</q-item-section>
              </q-item>
              <q-item clickable v-if="useNotificationsStore().bookmarksActive">
                <q-item-section v-close-popup @click="useNotificationsStore().showBookmarks = !useNotificationsStore().showBookmarks">
                  {{useNotificationsStore().showBookmarks ? 'Hide Bookmarks' : 'Show Bookmarks'}}
                </q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable>
                <q-item-section @click="showExportDialog()" v-close-popup>Export</q-item-section>
              </q-item>
              <q-item clickable>
                <q-item-section @click="showImportDialog()" v-close-popup>Import (Json)</q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable>
                <q-item-section @click="router.push('/settings')">Settings</q-item-section>
              </q-item>
              <q-separator />

<!--              <q-separator />-->
<!--              <q-item clickable>-->
<!--                <q-item-section>Help &amp; Feedback</q-item-section>-->
<!--              </q-item>-->
              <q-separator v-if="featuresStore.firebaseEnabled && !auth.user && tabsStore.tabsets.size > 1 && !someoneSubscribed()"/>
              <q-item clickable v-if="featuresStore.firebaseEnabled && !auth.user && tabsStore.tabsets.size > 1 && !someoneSubscribed()">
                <q-item-section @click="router.push('/trypro')">Check out Tabsets Pro...</q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-if="useRouter().currentRoute.value.fullPath !== '/about'" @click="router.push('/about')">
                <q-item-section>About tabsets</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>

        <div class="cursor-pointer" @click="router.push('/about')">
          v{{ appVersion }}
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" side="left" bordered>
      <BookmarksTree/>
    </q-drawer>

    <q-drawer show-if-above v-model="rightDrawerOpen" side="right" bordered
              content-class="column justify-between no-wrap bg-grey-1">
      <Navigation></Navigation>

      <TabInfo style="position: absolute;bottom:0"/>


    </q-drawer>

    <q-page-container>
      <router-view/>
    </q-page-container>


  </q-layout>

  <q-dialog v-model="syncTabsetsDialog">
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">Synchronize tabsets</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">
          Once you start synchronization of your tabsets, the data will not be stored
          locally any more so that you can access it from any device once logged in.
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">

      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" v-close-popup/>
        <q-btn flat label="Start synchronizing tabsets" v-close-popup
               @click="startSync()"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="unsyncTabsetsDialog">
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">Stop syncing Tabsets</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">
          If you click on 'stop synchronizing tabsets', all your remote tabsets are
          exported to this browser, stored locally and then deleted from your account.<br><br>
          You can keep using them in this browser only.
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">

      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" v-close-popup/>
        <q-btn flat label="Stop synchronizing tabsets" v-close-popup
               @click="stopSync()"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

</template>

<script setup lang="ts">
import {onMounted, onUnmounted, ref, watchEffect} from 'vue';
import {useQuasar} from "quasar";
import {useTabsStore} from "src/stores/tabsStore";
import {useTabGroupsStore} from "src/stores/tabGroupsStore";
import {useRoute, useRouter} from "vue-router";
import {useMeta} from 'quasar'
import {useNotificationsStore} from "stores/notificationsStore";
import TabInfo from "src/components/layouts/TabInfo.vue"
import Navigation from "src/components/Navigation.vue"
import BookmarksTree from "src/components/BookmarksTree.vue"
import TabsetService from "src/services/TabsetService";
import {useSearchStore} from "stores/searchStore";
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import {useAuthStore} from "src/stores/auth"
import {} from "src/stores/notificationsStore"
import {useSyncStore} from "src/stores/syncStore";
import _ from "lodash"
import {SyncMode} from "src/models/Subscription";
import NewTabset from "components/dialogues/NewTabset.vue";
import ExportDialog from "components/dialogues/ExportDialog.vue";
import ImportDialog from "components/dialogues/ImportDialog.vue";

const router = useRouter()
const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()
const searchStore = useSearchStore()
const auth = useAuthStore()
const syncStore = useSyncStore()

const rightDrawerOpen = ref(true)
const leftDrawerOpen = ref(false)
const showBookmarksDrawer = ref(false)

const syncTabsetsDialog = ref(false)
const unsyncTabsetsDialog = ref(false)
// const showNewTabsetDialog = ref(false)
const syncModel = ref(false)

const notificationsStore = useNotificationsStore()
const featuresStore = useFeatureTogglesStore()
const route = useRoute()

if (featuresStore.bookmarksEnabled) {
  showBookmarksDrawer.value = true
}

const $q = useQuasar()

$q.loadingBar.setDefaults({
  color: 'positive',
  size: '10px',
  position: 'top'
})

const caption = ref('yyy')
const search = ref('')
const merge = ref("false")

const localStorage = useQuasar().localStorage
//@ts-ignore
const appVersion = import.meta.env.PACKAGE_VERSION

const searchBox = ref(null)

const syncingActive = ref(false)

useMeta(() => {
  return {
    // @ts-ignore
    title: 'Tabsets Extension ' + appVersion
  }
})

watchEffect(() => {
  console.log("notificationsStore.showBookmarks", notificationsStore.showBookmarks)
  leftDrawerOpen.value = notificationsStore.showBookmarks
})

watchEffect(() => {
  console.log(" > watchEffect", auth.subscription)
  syncingActive.value = syncStore.showSyncMode && auth.subscription.syncMode !== SyncMode.INACTIVE
})

function checkKeystroke(e: any) {
  if (e.key === '/') {
    console.log("e", e, searchBox, search.value)
    // @ts-ignore
    searchBox.value.focus()
    search.value = ''
    console.log("e2", search.value)
  }
}

onMounted(() => {
  window.addEventListener('keypress', checkKeystroke);
})

onUnmounted(() => {
  window.removeEventListener('keypress', checkKeystroke);
})

function tabsForGroup(groupId: number): chrome.tabs.Tab[] {
  return tabsStore.tabsForGroup(groupId)
}

function submitSearch() {
  console.log("s", search.value)
  searchStore.term = search.value
  router.push("/search/" + search.value)
}

const title = () => {
  return auth.isAuthenticated ? 'TabsetsPro' : 'Tabsets'
}
const goHome = () => router.push("/")
const openSettingsPage = () => router.push("/settings")

// const tabNameExists = () => tabsStore.nameExistsInContextTabset(newTabsetName.value)

const someoneSubscribed = () => {
  return _.find(localStorage.getAllKeys(), (k: string) => k.indexOf(".subscription") >= 0)
}

const onProPage = () => useRouter().currentRoute.value.fullPath === "/trypro"

const showNewTabsetDialog = ref(false)
const addTabset = () => {
  $q.dialog({
    component: NewTabset
  }).onDismiss(() => {
    showNewTabsetDialog.value = false
  })
}

const startSync = () => {
  $q.loadingBar.start()
  if (featuresStore.firebaseEnabled) {
    console.log("start syncing...")
    const keys = [...tabsStore.tabsets.keys()]
    let count = 0
    let successCount = 0
    _.forEach(keys, key => {
      const increment = Math.round(100 / keys.length)
      console.log("incrementing loadingbar by ", increment)
      $q.loadingBar.increment(increment)
      TabsetService.syncTabset(key)
        .then(res => {
          count++
          successCount++
          //syncStore.setSyncMode(SyncMode.ACTIVE)
        })
        .catch(err => {
          console.log("error", err)
          count++
        })
    })
  }
  $q.loadingBar.stop()
}

const stopSync = () => {
  $q.loadingBar.start()
  if (featuresStore.firebaseEnabled) {
    console.log("stop syncing...")
    //syncStore.setSyncMode(SyncMode.INACTIVE)
    syncModel.value = false
    const keys = [...tabsStore.tabsets.keys()]
    let count = 0
    let successCount = 0
    _.forEach(keys, key => {
      console.log("got keys", key, tabsStore.tabsets.get(key))
      const increment = Math.round(100 / keys.length)
      console.log("incrementing loadingbar by ", increment)
      $q.loadingBar.increment(increment)
      TabsetService.unsyncTabset(key)
        .then(res => {
          console.log("unsyncing got result " + res)
          count++
          successCount++

        })
        .catch(err => {
          console.log("error", err)
          count++
        })
    })
  }
  $q.loadingBar.stop()
}

const syncModeToggled = (val: boolean) => {
  console.log("syncmode toggled", val)
  if (!val) {
    console.log("setting back to true...")
    syncModel.value = true
    unsyncTabsetsDialog.value = true
  } else {
    syncModel.value = true
  }
}

const logout = () => {
  console.log("logout!")

  auth.logout()
    .then((res: any) => {
      //this.localStorage.remove("skysailcms.uid")
      //this.byeNotification()
      router.push("/about")
    })
    .catch(error => {
      //this.handleError(error)
    })
}

const showExportDialog = () => {
  $q.dialog({component: ExportDialog})
}

const showImportDialog = () => {
  $q.dialog({component: ImportDialog})
}


</script>
