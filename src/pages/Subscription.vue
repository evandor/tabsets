<template>
  <q-page padding>

    <div class="text-h5 q-ma-md">
      Welcome to Tabsets Pro
    </div>

    <div class="text-body1 q-ma-md">
      Tabsets is a browser extension which helps you organize your tabs.<br><br>
      Tabsets Pro adds some additional features like synchronization across devices.
    </div>

    <div class="text-h5 q-ma-md">
      Status
    </div>

    <div class="text-body1 q-ma-md">
      You are managing <b>{{ tabsStore.allTabsCount }} tabs</b> in <b>{{ tabsStore.tabsets.size }} Tabsets</b> already.<br><br>
      <b>{{tabsStore.localTabsCount}}</b> of those tabs are stored <b>only locally in this browser</b>.
    </div>

<!--    <div class="text-h5 q-ma-md">-->
<!--      Subscription-->
<!--    </div>-->

<!--    <div class="text-body1 q-ma-md" v-if="auth.subscription.account === Subscription.FREE">-->
<!--      You are on the free tier of Tabsets Pro and can try out its features for another x days.-->
<!--    </div>-->

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
        @click="stayOffline()">
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
import {ref} from "vue";
import _ from "lodash";
import TabsetService from "src/services/TabsetService";
import {useFeatureTogglesStore} from "stores/featureTogglesStore";
import {useQuasar} from "quasar";
import {useRouter} from "vue-router";
import {useAuthStore} from "stores/auth";
import {SyncMode} from "src/models/Subscription";
import backendApi from "src/services/BackendApi";

const featuresStore = useFeatureTogglesStore()
const tabsStore = useTabsStore()
const router = useRouter()
const auth = useAuthStore()
const $q = useQuasar()


const syncTabsetsDialog = ref(false)

const stayOffline = () => {
  auth.subscription.syncMode = SyncMode.DECLINED
  backendApi.updateUser()
  router.push('/tabset')
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
</script>
