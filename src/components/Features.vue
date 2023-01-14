<template>

  <div class="q-ma-md">
    <b>Optional Features</b>
  </div>

  <q-list>
    <q-item
      clickable v-ripple
      v-for="f in optionalFeatures"
      @click="router.push(f.target)">

      <q-item-section avatar>
        <q-icon :name="f.icon" size="1.3em" :color="iconColor(f.ident)"/>
      </q-item-section>

      <q-item-section>{{ f.name }}</q-item-section>
    </q-item>

  </q-list>

  <q-card flat v-for="f in optionalFeatures">
    <q-card-section
      class="q-pt-xs cursor-pointer"
      style="width:100%;" @click="router.push(f.target)">
      <div class="row items-baseline">
        <div class="col-2">
          <q-icon :name="f.icon" size="1.3em" :color="iconColor(f.ident)"/>
        </div>
        <div class="col-9 text-body2">
          {{ f.name }}
        </div>
        <div class="col-1"></div>
      </div>
    </q-card-section>
  </q-card>

  <div class="q-ma-md">
    <b>Experimental Features</b>
  </div>

  <q-card flat v-for="f in experimantalFeatures">
    <q-card-section class="q-pt-xs cursor-pointer" style="width:100%;" @click="router.push(f.target)">
      <div class="row items-baseline">
        <div class="col-2">
          <q-icon :name="f.icon" size="1.3em" :color="iconColor(f.ident)"/>
        </div>
        <div class="col-9 text-body2">
          {{ f.name }}
        </div>
        <div class="col-1"></div>
      </div>
    </q-card-section>
  </q-card>

  <div class="q-ma-md text-grey-8">
    <b>Planned Features</b>
  </div>

  <q-card flat v-for="f in plannedFeatures">
    <q-card-section class="q-pt-xs cursor-pointer" style="width:100%;" @click="router.push(f.target)">
      <div class="row items-baseline">
        <div class="col-2">
          <q-icon :name="f.icon" size="1.3em" :color="iconColor(f.ident)"/>
        </div>
        <div class="col-9 text-body2 text-grey-8">
          {{ f.name }}
        </div>
        <div class="col-1"></div>
      </div>
    </q-card-section>
  </q-card>

</template>

<script setup lang="ts">

import {useTabsStore} from "src/stores/tabsStore"
import {ref, watchEffect} from "vue";
import {useRouter} from "vue-router";
import {Tab} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {usePermissionsStore} from "stores/permissionsStore";

const tabsStore = useTabsStore()
const router = useRouter()

const optionalFeatures = [
  {ident: 'opentabsThreshold', name: 'Open Tabs Warning', icon: 'o_tab', target: '/features/opentabsThreshold'},
  {ident: 'bookmarks', name: 'Bookmarks', icon: 'o_bookmarks', target: '/features/bookmarks'},
  {ident: 'pendingTabs', name: 'New Tabs Tracking', icon: 'o_tab', target: '/features/pendingTabs'},
  {ident: 'details', name: 'Tab(set) Details View', icon: 'o_tab', target: '/features/details'},
  {ident: 'groupedByDomain', name: 'Group By Domain View', icon: 'o_dns', target: '/features/groupedByDomain'},
  {ident: 'thumbnails', name: 'Thumbnails', icon: 'o_image', target: '/features/thumbnails'},
  {ident: 'analyseTabs', name: 'Analyse Tabs', icon: 'o_analytics', target: '/features/analyseTabs'}
]

const experimantalFeatures = [
  // {ident: 'mhtml', name: 'Saving Pages', icon: 'o_bookmarks', target: '/features/pageCapture'},
  // {ident: 'scheduled', name: 'Schedule Tabs', icon: 'o_update', target: '/features/scheduled'},
  {ident: 'sessions', name: 'Sessions', icon: 'o_explore', target: '/features/sessions'},
  {ident: 'history', name: 'History', icon: 'o_history', target: '/features/history'}
]

const plannedFeatures = [
  // {ident: 'mhtml', name: 'Saving Pages', icon: 'o_bookmarks', target: '/features/pageCapture'},
  // {ident: 'scheduled', name: 'Schedule Tabs', icon: 'o_update', target: '/features/scheduled'},
  {ident: 'spaces', name: 'Spaces', icon: 'o_history', target: '/features/spaces'},
  {ident: 'windows', name: 'Multiple Windows', icon: 'o_history', target: '/features/windows'},
  {ident: 'scheduled', name: 'Scheduled Tabs', icon: 'o_history', target: '/features/scheduled'},
  {ident: 'oldTabs', name: 'Old Tabs View', icon: 'o_history', target: '/features/oldTabs'}
]


const open = (ident: string) => {
  router.push("/help/" + ident)
}

//@ts-ignore
const appVersion = import.meta.env.PACKAGE_VERSION

const iconColor = (ident: string) => {
  switch (ident) {
    // case "Bookmarks":
    //   return usePermissionsStore().hasFeature('bookmarks') ? 'green' : 'primary'
    // case "Bookmarks":
    //   return usePermissionsStore().hasFeature('bookmarks') ? 'green' : 'primary'
    default:
      return usePermissionsStore().hasFeature(ident) ? 'green' : 'primary'
  }
}

</script>
