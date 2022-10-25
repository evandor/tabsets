<template>
  <q-layout view="hHh lpR lFr">
    <q-header elevated>
      <q-toolbar>

        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer"/>

        <q-toolbar-title @click="goHome()" class="cursor-pointer" style="width:350px;">
          {{ title() }} <span class="text-caption">Handle more links, with less tabs open</span>
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
              <q-item clickable>
                <q-item-section @click="closeTrackedTabs()" v-close-popup>Close all tracked tabs</q-item-section>
              </q-item>

              <q-separator/>
              <q-item clickable>
                <q-item-section @click="showExportDialog()" v-close-popup>Export</q-item-section>
              </q-item>
              <q-item clickable>
                <q-item-section @click="showImportDialog()" v-close-popup>Import (Json)</q-item-section>
              </q-item>
              <q-separator/>
              <q-item clickable>
                <q-item-section @click="router.push('/settings')">Settings</q-item-section>
              </q-item>
              <!--              <q-separator />-->
              <!--              <q-item clickable>-->
              <!--                <q-item-section>Help &amp; Feedback</q-item-section>-->
              <!--              </q-item>-->
              <q-separator
                v-if="featuresStore.firebaseEnabled && !auth.user && tabsStore.tabsets.size > 1 && !someoneSubscribed()"/>
              <q-item clickable
                      v-if="featuresStore.firebaseEnabled && !auth.user && tabsStore.tabsets.size > 1 && !someoneSubscribed()">
                <q-item-section @click="router.push('/trypro')">Check out Tabsets Pro...</q-item-section>
              </q-item>
              <q-separator/>
              <q-item clickable v-if="useRouter().currentRoute.value.fullPath !== '/about'"
                      @click="router.push('/about')">
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
      <DrawerLeft />
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
import {onMounted, onUnmounted, ref} from 'vue';
import {useQuasar} from "quasar";
import {useTabsStore} from "src/stores/tabsStore";
import {useTabGroupsStore} from "src/stores/tabGroupsStore";
import {useRoute, useRouter} from "vue-router";
import {useMeta} from 'quasar'
import {useNotificationsStore} from "src/stores/notificationsStore";
import TabInfo from "src/components/layouts/TabInfo.vue"
import Navigation from "src/components/Navigation.vue"
import DrawerLeft from "src/components/DrawerLeft.vue"
import TabsetService from "src/services/TabsetService";
import {useSearchStore} from "src/stores/searchStore";
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import _ from "lodash"
import NewTabset from "components/dialogues/NewTabset.vue";
import ExportDialog from "components/dialogues/ExportDialog.vue";
import ImportDialog from "components/dialogues/ImportDialog.vue";

const router = useRouter()
const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()
const searchStore = useSearchStore()

const rightDrawerOpen = ref(true)
const leftDrawerOpen = ref(false)

const syncTabsetsDialog = ref(false)
const unsyncTabsetsDialog = ref(false)
const syncModel = ref(false)

const notificationsStore = useNotificationsStore()
const featuresStore = useFeatureTogglesStore()
const route = useRoute()

const $q = useQuasar()

$q.loadingBar.setDefaults({
  color: 'positive',
  size: '10px',
  position: 'top'
})

const search = ref('')

const localStorage = useQuasar().localStorage
//@ts-ignore
const appVersion = import.meta.env.PACKAGE_VERSION

const searchBox = ref(null)

const syncingActive = ref(false)

useMeta(() => {
  return {
    // @ts-ignore
    title: 'Tabsets Extension' //+ appVersion
  }
})

function checkKeystroke(e: any) {
  if (e.key === '/') {
    //console.log("e", e, searchBox, search.value)
    // @ts-ignore
    searchBox.value.focus()
    search.value = ''
    //console.log("e2", search.value)
  }
}

onMounted(() => {
  window.addEventListener('keypress', checkKeystroke);
})

onUnmounted(() => {
  window.removeEventListener('keypress', checkKeystroke);
})

function submitSearch() {
  console.log("s", search.value)
  searchStore.term = search.value
  router.push("/search/" + search.value)
}

const title = () => {
  return 'Tabsets'
}
const goHome = () => router.push("/")

const someoneSubscribed = () => {
  return _.find(localStorage.getAllKeys(), (k: string) => k.indexOf(".subscription") >= 0)
}

const toggleLeftDrawer = () => leftDrawerOpen.value = !leftDrawerOpen.value

const showNewTabsetDialog = ref(false)
const addTabset = () => {
  $q.dialog({
    component: NewTabset
  }).onDismiss(() => {
    showNewTabsetDialog.value = false
  })
}

const closeTrackedTabs = () => {
  TabsetService.closeTrackedTabs()
}


const showExportDialog = () => {
  $q.dialog({component: ExportDialog})
}

const showImportDialog = () => {
  $q.dialog({component: ImportDialog})
}


</script>
