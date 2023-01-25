<template>

  <div class="q-ma-md">
    <b>Optional Features</b>
  </div>

  <q-list>
    <q-item
      v-for="f in filterBexMode(optionalFeatures)"
      clickable v-ripple
      :active="f.ident === selected"
      @click="showFeature(f)">

      <q-item-section avatar>
        <q-icon :name="f.icon" size="1.3em" :color="iconColor(f.ident)"/>
      </q-item-section>
      <q-item-section>{{ f.name }}</q-item-section>

    </q-item>
  </q-list>

  <div class="q-ma-md">
    <b>Experimental Features</b>
  </div>

  <q-list>
    <q-item
      v-for="f in filterBexMode(experimantalFeatures)"
      clickable v-ripple
      :active="f.ident === selected"
      @click="showFeature(f)">

      <q-item-section avatar>
        <q-icon :name="f.icon" size="1.3em" :color="iconColor(f.ident)"/>
      </q-item-section>
      <q-item-section>{{ f.name }}</q-item-section>

    </q-item>
  </q-list>

  <div class="q-ma-md text-grey-8">
    <b>Planned Features</b>
  </div>

  <q-list>
    <q-item
      v-for="f in plannedFeatures"
      clickable v-ripple
      :active="f.ident === selected"
      @click="showFeature(f)">

      <q-item-section avatar>
        <q-icon :name="f.icon" size="1.3em" :color="iconColor(f.ident)"/>
      </q-item-section>
      <q-item-section class="text-grey-8">{{ f.name }}</q-item-section>

    </q-item>
  </q-list>

  <div class="q-ma-md text-grey-8">
    <b>Ideas</b>
  </div>

  <q-list>
    <q-item
      v-for="f in ideas"
      clickable v-ripple>

      <q-item-section avatar>
        <q-icon :name="f.icon" size="1.3em" :color="iconColor(f.ident)"/>
      </q-item-section>
      <q-item-section class="text-grey-8">{{ f.name }}</q-item-section>

    </q-item>
  </q-list>

</template>

<script setup lang="ts">

import {useTabsStore} from "src/stores/tabsStore"
import {ref} from "vue";
import {useRouter} from "vue-router";
import {usePermissionsStore} from "stores/permissionsStore";
import _ from "lodash"

const tabsStore = useTabsStore()
const router = useRouter()
const selected = ref('')

const optionalFeatures = [
  {
    ident: 'opentabsThreshold',
    name: 'Open Tabs Warning',
    icon: 'o_tab',
    bexOnly: true,
    target: '/features/opentabsThreshold'
  },
  {ident: 'bookmarks', name: 'Bookmarks', icon: 'o_bookmarks', bexOnly: true, target: '/features/bookmarks'},
  // {ident: 'pendingTabs', name: 'New Tabs Tracking', icon: 'o_tab', bexOnly: true, target: '/features/pendingTabs'},
  {ident: 'details', name: 'Tab(set) Details View', icon: 'o_tab', target: '/features/details'},
  {ident: 'sidebar', name: 'Sidebar View', icon: 'o_input', target: '/features/sidebar'},
  {ident: 'groupedByDomain', name: 'Group By Domain View', icon: 'o_dns', target: '/features/groupedByDomain'},
  {ident: 'thumbnails', name: 'Thumbnails', icon: 'o_image', bexOnly: true, target: '/features/thumbnails'},
  {ident: 'analyseTabs', name: 'Analyse Tabs', icon: 'o_analytics', bexOnly: true, target: '/features/analyseTabs'},
]

const experimantalFeatures = [
  // {ident: 'mhtml', name: 'Saving Pages', icon: 'o_bookmarks', target: '/features/pageCapture'},
  // {ident: 'scheduled', name: 'Schedule Tabs', icon: 'o_update', target: '/features/scheduled'},
  {ident: 'experimentalViews', name: 'Experimental Views', icon: 'o_explore', bexOnly: false, target: '/features/experimentalViews'},
  {ident: 'sessions', name: 'Sessions', icon: 'o_explore', bexOnly: true, target: '/features/sessions'},
  {ident: 'history', name: 'History', icon: 'o_history', bexOnly: true, target: '/features/history'},
  {ident: 'useGroups', name: 'Use Tab Groups', icon: 'o_toc', bexOnly: false, target: '/features/useGroups'}
]

const plannedFeatures = [
  // {ident: 'mhtml', name: 'Saving Pages', icon: 'o_bookmarks', target: '/features/pageCapture'},
  // {ident: 'scheduled', name: 'Schedule Tabs', icon: 'o_update', target: '/features/scheduled'},
  {ident: 'spaces', name: 'Spaces', icon: 'o_history', target: '/features/spaces'},
  {ident: 'windows', name: 'Multiple Windows', icon: 'o_history', bexOnly: true, target: '/features/windows'},
  {ident: 'scheduled', name: 'Scheduled Tabs', icon: 'o_history', target: '/features/scheduled'},
  {ident: 'oldTabs', name: 'Old Tabs View', icon: 'o_history', target: '/features/oldTabs'}
]

const ideas = [
  {ident: 'stats', name: 'Gather and show stats', icon: 'o_history'},
  {ident: 'tagcloud', name: 'Tag clouds from titles', icon: 'o_history'},
  {ident: 'tagcloud', name: 'Tag clouds from content', icon: 'o_history'}
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

const showFeature = (f: any) => {
  selected.value = f.ident
  router.push(f.target)
}

const checkBexMode = (f: any) => process.env.MODE === "bex" ? true : !f.bexOnly

const filterBexMode = (fs: any[]) => _.filter(fs, (f: any) => checkBexMode(f))

</script>
