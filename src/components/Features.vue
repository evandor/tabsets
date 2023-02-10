<template>

  <div class="q-ma-md">
    <b>Recommended Features</b>
  </div>

  <q-list>
    <q-item
      v-for="f in recommendedFeatures"
      clickable v-ripple
      :active="f.ident === selected"
      :disable="wrongMode(f)"
      @click="showFeature(f)">

      <q-item-section avatar>
        <q-icon :name="f.icon" size="1.3em" :color="iconColor(f.ident)"/>
      </q-item-section>
      <q-item-section>{{ f.name }}</q-item-section>
      <q-tooltip class="tooltip" v-if="wrongMode(f)">
        This feature is not available in this mode of tabsets
      </q-tooltip>
    </q-item>

  </q-list>

  <div class="q-ma-md">
    <b>Optional Features</b>
  </div>

  <q-list>
    <q-item
      v-for="f in optionalFeatures"
      clickable v-ripple
      :active="f.ident === selected"
      :disable="wrongMode(f)"
      @click="showFeature(f)">

      <q-item-section avatar>
        <q-icon :name="f.icon" size="1.3em" :color="iconColor(f.ident)"/>
      </q-item-section>
      <q-item-section>{{ f.name }}</q-item-section>
      <q-tooltip class="tooltip" v-if="wrongMode(f)">
        This feature is not available in this mode of tabsets
      </q-tooltip>
    </q-item>
  </q-list>

  <div class="q-ma-md" v-if="useFeatureTogglesStore().isEnabled('dev')">
    <b>Experimental Features</b>
  </div>

  <q-list v-if="useFeatureTogglesStore().isEnabled('dev')">
    <q-item
      v-for="f in experimantalFeatures"
      clickable v-ripple
      :active="f.ident === selected"
      :disable="wrongMode(f)"
      @click="showFeature(f)">

      <q-item-section avatar>
        <q-icon :name="f.icon" size="1.3em" :color="iconColor(f.ident)"/>
      </q-item-section>
      <q-item-section>{{ f.name }}</q-item-section>
      <q-tooltip class="tooltip" v-if="wrongMode(f)">
        This feature is not available in this mode of tabsets
      </q-tooltip>
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

  <!--  <div class="q-ma-md text-grey-8">-->
  <!--    <b>Ideas</b>-->
  <!--  </div>-->

  <!--  <q-list>-->
  <!--    <q-item-->
  <!--      v-for="f in ideas"-->
  <!--      clickable v-ripple>-->

  <!--      <q-item-section avatar>-->
  <!--        <q-icon :name="f.icon" size="1.3em" :color="iconColor(f.ident)"/>-->
  <!--      </q-item-section>-->
  <!--      <q-item-section class="text-grey-8">{{ f.name }}</q-item-section>-->

  <!--    </q-item>-->
  <!--  </q-list>-->

</template>

<script setup lang="ts">

import {useTabsStore} from "src/stores/tabsStore"
import {ref} from "vue";
import {useRouter} from "vue-router";
import {usePermissionsStore} from "stores/permissionsStore";
import _ from "lodash"
import {useFeatureTogglesStore} from "stores/featureTogglesStore";

const tabsStore = useTabsStore()
const router = useRouter()
const selected = ref('')

const recommendedFeatures = [
  {ident: 'bookmarks', name: 'Bookmarks', icon: 'o_bookmarks', useIn: ['bex'], target: '/features/bookmarks'}
]

const optionalFeatures = [
  {
    ident: 'opentabsThreshold',
    name: 'Open Tabs Warning',
    icon: 'o_tab',
    useIn: ['bex'],
    target: '/features/opentabsThreshold'
  },
  // {ident: 'pendingTabs', name: 'New Tabs Tracking', icon: 'o_tab', useIn: ['bex'], target: '/features/pendingTabs'},
  {ident: 'sidebar', name: 'Sidebar View', icon: 'o_input', useIn: ['electron'], target: '/features/sidebar'},
  {ident: 'groupedByDomain', name: 'Group By Domain View', icon: 'o_dns', useIn: ['all'], target: '/features/groupedByDomain'}
]

const experimantalFeatures = [
  // {ident: 'mhtml', name: 'Saving Pages', icon: 'o_bookmarks', target: '/features/pageCapture'},
  // {ident: 'scheduled', name: 'Schedule Tabs', icon: 'o_update', target: '/features/scheduled'},
  {
    ident: 'experimentalViews',
    name: 'Experimental Views',
    icon: 'o_explore',
    useIn: ['all'],
    target: '/features/experimentalViews'
  },
  {ident: 'newTab', name: 'New Tab', icon: 'o_create_new_folder', useIn: ['bex'], target: '/features/newTab'}, // does not work properly right now (keeps re-catching the source)
  {ident: 'rss', name: 'RSS View', icon: 'o_rss_feed', useIn: ['all'], target: '/features/rss'}, // does not work properly right now (keeps re-catching the source)
  {ident: 'thumbnails', name: 'Thumbnails', icon: 'o_image', useIn: ['bex'], target: '/features/thumbnails'},
  {ident: 'analyseTabs', name: 'Analyse Tabs', icon: 'o_analytics', useIn: ['bex'], target: '/features/analyseTabs'},
  {ident: 'details', name: 'Tab(set) Details View', icon: 'o_tab', target: '/features/details'},
  {ident: 'sessions', name: 'Sessions', icon: 'o_explore', useIn: ['bex'], target: '/features/sessions'},
  // {ident: 'dynamic', name: 'Dynamic Tabsets', icon: 'o_file_open', bexOnly: false, target: '/features/dynamic'},
  // {ident: 'history', name: 'History', icon: 'o_history', useIn: ['bex'], target: '/features/history'},
  // {ident: 'useGroups', name: '' +
  //     'Use Tab Groups', icon: 'o_toc', useIn: ['all'], target: '/features/useGroups'}
]

const plannedFeatures = [
  // {ident: 'mhtml', name: 'Saving Pages', icon: 'o_bookmarks', target: '/features/pageCapture'},
  // {ident: 'scheduled', name: 'Schedule Tabs', icon: 'o_update', target: '/features/scheduled'},
  {ident: 'spaces', name: 'Spaces', icon: 'o_history', target: '/features/spaces'},
  {ident: 'windows', name: 'Multiple Windows', icon: 'o_history', useIn: ['bex'], target: '/features/windows'},
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

const filterMode = (fs: any[]) => _.filter(fs, (f: any) =>
  f.useIn?.indexOf('all') >= 0 || f.useIn?.indexOf(process.env.MODE) >= 0)

const wrongMode = (f: any) => {
  return f.useIn?.indexOf('all') < 0 && f.useIn?.indexOf(process.env.MODE) < 0
}
</script>
