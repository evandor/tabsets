<template>

  <q-toolbar class="text-primary lightgrey" v-if="tabsStore.tabsets.size > 0">
    <div class="row fit">
      <q-toolbar-title>
        <div class="row justify-start items-baseline">
          Welcome to Tabsets
        </div>
      </q-toolbar-title>

    </div>
  </q-toolbar>

  <q-page padding class="greyBorderTop">

    <div class="text-h4 q-ml-md">
      Tabsets Browser Extension
    </div>
    <div class="text-caption q-ml-md q-mb-md">Version {{ appVersion }}</div>

    <div class="text-body1 q-ma-md" v-if="tabsStore.tabsets.size === 0">
      Tabsets is a browser extension which helps you organize your tabs.<br><br>
      A
      <q-chip label="tabset" square color="warning"/>
      is just a collection of tabs you can give a name to.
    </div>
    <div class="text-body1 q-ma-md" v-else>
      Tabsets is a browser extension which helps you organize your tabs.<br><br>
      You are managing <b>{{ tabsStore.allTabsCount }} tabs</b> in <b>{{ tabsStore.tabsets.size }} Tabset(s)</b>
      already - and can access <b>{{ bookmarksStore.bookmarksLeaves.length }} bookmarks</b> of yours.
    </div>

    <div class="text-h5 q-ma-md">
      Features
    </div>

    <div class="q-pa-md">
      <div class="row q-gutter-lg">

        <div class="col-xs-12 col-sm-4 col-md-3 col-lg-2" v-for="feature in features">
          <q-card
            class="my-card text-primary"
            style="background: radial-gradient(circle, #efefef 0%, #ACBCBB 100%)"
          >
            <q-card-section>
              <div class="text-h6">{{ feature.title }}</div>
              <div class="text-subtitle2">{{ feature.caption }}</div>
            </q-card-section>

            <q-card-section class="q-pt-none text-black" style="height: 65px">
              {{ feature.text }}
            </q-card-section>
          </q-card>
        </div>

      </div>
    </div>

    <div class="text-h5 q-ma-md">
      Good to know
    </div>

    <div class="text-body1 q-ma-md">
      <ul>
        <li>All data remains on your computer - no backend communication whatsoever</li>
        <li>Open source: see <a href="https://www.github.com/evandor/tabsets" target="_blank">github project</a></li>
        <li><a href="https://opensource.org/licenses/MIT" target="_blank">MIT</a> license</li>
      </ul>
    </div>

    <div class="text-h5 q-ma-md">
      Supported Browsers
    </div>

    <div class="text-body1 q-ma-md">
      <ul>
        <li>Chrome (<a
          href="https://chrome.google.com/webstore/detail/tabsets-extension/afkknkdbgondbbfjehipnjmojndnjhjg?hl=en&authuser=0'"
          target="_blank">webstore</a>)
        </li>
        <li>Brave (<a
          href="https://chrome.google.com/webstore/detail/tabsets-extension/afkknkdbgondbbfjehipnjmojndnjhjg?hl=en&authuser=0'"
          target="_blank">webstore</a>)
        </li>
        <li class="text-grey-7">Firefox (once manifest v3 is supported)</li>
      </ul>
    </div>

    <div class="text-h5 q-ma-md">
      Official Extension Website
    </div>

    <div class="text-body1 q-ma-md">
      <a href="https://tabsets.web.app" target="_blank">https://tabsets.web.app</a>
    </div>

  </q-page>

</template>

<script setup lang="ts">
import {useTabsStore} from "src/stores/tabsStore"
import {useNotificationsStore} from "src/stores/notificationsStore";
import {ref} from "vue";
import {useBookmarksStore} from "stores/bookmarksStore";

//@ts-ignore
const appVersion = import.meta.env.PACKAGE_VERSION

const tabsStore = useTabsStore()
const bookmarksStore = useBookmarksStore()

const animateFab = () => useNotificationsStore().animateFab()

const features = ref([
  {title: 'Tabsets', caption: 'Creation', text: 'Turn your open tabs into tabsets'},
  {title: 'Tabs', caption: 'Utilization', text: 'Search for keywords or content in your tabs and bookmarks'},
  {title: 'Tabsets', caption: 'Reuse', text: 'Re-open your tabsets or tabs whenever you need them'},
  {title: 'Tabsets', caption: 'Management', text: 'Edit Tabsets'},
  {title: 'Tabsets', caption: 'Management', text: 'Use Spaces to organize your tabsets (experimental)'},
  {title: 'Tabsets', caption: 'Persistence', text: 'Export and Import Tabsets Data'},
  {title: 'Tabs', caption: 'Visualization', text: 'Thumbnails Preview (experimental)'},
  {title: 'Tabs', caption: 'Visualization', text: 'List View (experimental)'},
  {title: 'Bookmarks', caption: 'Integration', text: 'Bookmarks integration: create tabsets from bookmark folders'},
  {title: 'Tabsets', caption: 'Visualization', text: 'Dark Mode (experimental)'},
  {title: 'Tabsets', caption: 'Utilization', text: 'Drag and Drop Support (experimental)'},
  {title: 'RSS Feeds', caption: 'Integration', text: 'Displayment of RSS Feeds (experimental)'},
])

</script>


<style lang="sass" scoped>

.lightgrey
  background-color: $lightgrey

.greyBorderTop
  border-top: 1px solid $bordergrey

</style>
