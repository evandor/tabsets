<template>
  <q-layout view="hHh lpR lFr">
    <q-header elevated>
      <q-toolbar>

        <q-toolbar-title @click="goHome()" class="cursor-pointer">
          {{ title() }}
        </q-toolbar-title>

        <q-input dark dense standout v-model="search"
                 ref="searchBox"
                 style="width:360px;"
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

        <!--        <q-space/>-->
        <!--        <div v-if="tabsStore.active" class="q-mr-md">Layout</div>-->
        <!--        <q-icon name="grid_on" class="q-mr-md"></q-icon>&nbsp;-->
        <!--        <q-icon name="list"></q-icon>-->

        <q-space/>

        <q-btn v-if="syncStore.showSyncButton"
               flat dense icon="restore_page"
               color="warning" label="Sync Tabsets..."
               class="q-mr-md"
               @click="syncTabsetsDialog = true">
          <q-tooltip>Synchronizing Tabsets allows you to use tabsets across multiple browsers and computers</q-tooltip>
        </q-btn>

        <div v-if="tabsStore.pendingTabset?.tabs.length > 0 && tabsStore.tabsets.size > 1" class="q-mr-lg">
          {{ tabsStore.pendingTabset?.tabs.length }} unassigned tab(s)
        </div>

        <q-btn outline rounded color="secondary" label="new tabset" class="q-mr-lg">
          <q-popup-edit
            :model-value="newTabsetName"
            v-slot="scope"
            :validate="val => val.trim().length > 0"
            @update:model-value="val => createNewTabset( val)">
            <q-input
              v-model="scope.value"
              dense autofocus
              hint="new tabset's name"
              @keyup.enter="scope.set"
              :rules="[val => scope.validate(val) || 'More than 1 character required']">
              <template v-slot:after>
                <q-btn
                  flat dense color="negative" icon="cancel"
                  @click.stop.prevent="scope.cancel"
                />

                <q-btn
                  flat dense color="positive" icon="check_circle"
                  @click.stop.prevent="scope.set"
                  :disable="scope.validate(scope.value) === false || scope.initialValue === scope.value"
                />
              </template>
            </q-input>
          </q-popup-edit>
        </q-btn>


        <q-toggle
          v-if="syncStore.showSyncMode"
          left-label
          color="green"
          v-model="syncModel"
          @update:model-value="val => syncModeToggled(val)"
          label=""
        />

        <div v-if="syncStore.showSyncMode && syncStore.syncMode !== SyncMode.INACTIVE" class="q-mr-lg">Syncing active&nbsp;

        </div>
        <div v-if="syncStore.showSyncMode && syncStore.syncMode === SyncMode.INACTIVE" class="q-mr-lg">Syncing stopped

        </div>

        <span class="q-pr-lg" style="cursor: pointer" v-if="featuresStore.firebaseEnabled && auth.user">
          <q-icon name="person" class="q-mr-md" size="28px"></q-icon>
          <span>{{ auth.user?.email }}</span>
          <q-menu
            touch-position
          >
            <q-list dense style="min-width: 100px">
<!--              <q-item clickable v-close-popup>-->
              <!--                <q-item-section>Account Settings...</q-item-section>-->
              <!--              </q-item>-->
              <!--              <q-item clickable v-close-popup>-->
              <!--                <q-item-section>Installation Settings...</q-item-section>-->
              <!--              </q-item>-->
              <!--              <q-separator/>-->
              <q-item clickable v-close-popup>
                <q-item-section @click="logout()">Logout</q-item-section>
              </q-item>
            </q-list>

          </q-menu>
        </span>

        <span class="q-pr-lg" style="cursor: pointer" v-if="featuresStore.firebaseEnabled && !auth.user">
          <q-icon name="person" class="q-mr-md" size="28px"></q-icon>
          <span @click="router.push('/login')">Login</span>
        </span>

        <q-icon name="settings" size="2em"
                class="q-mr-md cursor-pointer"
                @click="openSettingsPage()"
                v-if="featuresStore.settingsEnabled"></q-icon>

        <div>
          v{{ appVersion }}
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer show-if-above :v-model="true" v-if="featuresStore.bookmarksEnabled" side="left" bordered>
      <BookmarksTree/>
    </q-drawer>

    <q-drawer show-if-above v-model="rightDrawerOpen" side="right" bordered
              content-class="column justify-between no-wrap bg-grey-1">
      <Navigation></Navigation>

      <TabInfo style="position: absolute;bottom:0px"/>


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
import {useRouter} from "vue-router";
import {useMeta} from 'quasar'
import {useNotificationsStore} from "stores/notificationsStore";
import TabInfo from "src/components/layouts/TabInfo.vue"
import Navigation from "src/components/Navigation.vue"
import BookmarksTree from "src/components/BookmarksTree.vue"
import TabsetService from "src/services/TabsetService";
import {useSearchStore} from "stores/searchStore";
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import {useAuthStore} from "src/stores/auth"
import {useSyncStore, SyncMode} from "src/stores/syncStore";
import _ from "lodash"

const router = useRouter()
const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()
const searchStore = useSearchStore()
const auth = useAuthStore()
const syncStore = useSyncStore()

const rightDrawerOpen = ref(true)
const showBookmarksDrawer = ref(false)

const syncTabsetsDialog = ref(false)
const unsyncTabsetsDialog = ref(false)
const syncModel = ref(false)

const notificationsStore = useNotificationsStore()
const featuresStore = useFeatureTogglesStore()

if (featuresStore.bookmarksEnabled) {
  showBookmarksDrawer.value = true
}

const $q = useQuasar()

$q.loadingBar.setDefaults({
  color: 'positive',
  size: '10px',
  position: 'top'
})

const newTabsetName = ref('')
const caption = ref('yyy')
const search = ref('')

const localStorage = useQuasar().localStorage
//@ts-ignore
const appVersion = import.meta.env.PACKAGE_VERSION

const searchBox = ref(null)

useMeta(() => {
  return {
    // @ts-ignore
    title: tabsStore.title
  }
})

watchEffect(() => {
  // console.log(" > watchEffect", syncStore.syncMode)
  if (syncStore.syncMode !== SyncMode.INACTIVE) {
    syncModel.value = true
  } else {
    syncModel.value = false
  }
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
const goHome = () => router.push("/about")
const openSettingsPage = () => router.push("/settings")

const createNewTabset = (newName: string) => {
  TabsetService.saveOrReplaceFromChromeTabs(newName, [], true)
    .then((result: object) => {
      // populate pending set
      TabsetService.createPendingFromBrowserTabs()


      //@ts-ignore
      const replaced = result.replaced
      //@ts-ignore
      const merged = result.merged
      let message = 'Tabset ' + newName + ' created successfully'
      if (replaced && merged) {
        message = 'Tabset ' + newName + ' was updated'
      } else if (replaced) {
        message = 'Tabset ' + newName + ' was overwritten'
      }
      router.push("/tabset")
      $q.notify({
        message: message,
        type: 'positive'
      })
    }).catch((ex: any) => {
    console.error("ex", ex)
    $q.notify({
      message: 'There was a problem creating the tabset ' + newName,
      type: 'warning',
    })

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
          syncStore.setSyncMode(SyncMode.ACTIVE)
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
    syncStore.setSyncMode(SyncMode.INACTIVE)
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

const syncModeToggled =  (val: boolean) => {
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
      this.router.push("/about")
    })
    .catch(error => {
      //this.handleError(error)
    })
}

</script>
