<template>
  <q-page padding>

    <div class="text-h5 q-ma-md">
      Welcome to Tabsets Pro
    </div>

    <div class="text-body1 q-ma-md" v-if="tabsStore.tabsets.size === 0">
      Tabsets is a browser extension which helps you organize your tabs.<br><br>
      A <span class="text-body1 text-dark">tabset</span> is just a collection of tabs you can give a name to.
    </div>
    <div class="text-body1 q-ma-md" v-else>
      Tabsets is a browser extension which helps you organize your tabs.<br><br>
      You are managing <b>{{ tabsStore.allTabsCount }} tabs</b> in <b>{{ tabsStore.tabsets.size }} Tabsets</b> already.<br><br>
      <b>{{tabsStore.localTabsCount}}</b> of those tabs are stored <b>only locally in this browser</b>.
    </div>

    <div class="text-h5 q-ma-md">
      Pro Features
    </div>

    <div class="text-body1 q-ma-md">
      <ul>
        <li>synchronize your tabsets across multiple devices</li>
        <li>planned: tabsets sharing</li>
        <li>planned: bookmarks integration</li>
        <li>planned: advanced search</li>
      </ul>
    </div>

    <div class="text-h5 q-ma-md">
      Get started with Tabsets Pro
    </div>

    <div class="row q-ma-lg q-pa-lg items-center justify-center">
      <br><br><br><br>
      <q-btn
             outline rounded
             icon="cloud_upload"
             size="24px"
             color="primary" label="Start Syncing Tabsets..."
             class="q-mr-md"
             @click="syncTabsetsDialog = true">
        <q-tooltip>Synchronizing Tabsets allows you to use tabsets across multiple browsers and computers</q-tooltip>
      </q-btn>
    </div>

    <div class="row q-ma-lg q-pa-lg items-center justify-center">
      <br><br><br><br>
      <q-btn
        outline rounded
        icon="cloud_off"
        size="12px"
        color="bg-grey-6" label="or... stay offline"
        class="q-mr-md"
        @click="router.push('/tabset')">
        <q-tooltip>Keep using tabsets as before with locally stored tabsets</q-tooltip>
      </q-btn>
    </div>

<!--    <fab></fab>-->
  </q-page>

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

</template>

<script setup lang="ts">
import {useTabsStore} from "src/stores/tabsStore"
import Fab from "src/components/Fab.vue"
import {useNotificationsStore} from "stores/notificationsStore";
import {ref} from "vue";
import _ from "lodash";
import TabsetService from "src/services/TabsetService";
import {SyncMode} from "stores/syncStore";
import {useFeatureTogglesStore} from "stores/featureTogglesStore";
import {useQuasar} from "quasar";
import {useRouter} from "vue-router";

const featuresStore = useFeatureTogglesStore()
const tabsStore = useTabsStore()
const router = useRouter()
const $q = useQuasar()


const syncTabsetsDialog = ref(false)

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
</script>
