<template>

  <!-- toolbar -->
  <q-toolbar class="text-primary lightgrey">
    <div class="row fit">
      <div class="col-xs-12 col-md-5">
        <q-toolbar-title>
          <div class="row justify-start items-baseline">
            <div class="col-1"><span class="text-dark">{{ title }}</span> <span
              class="text-primary">
            </span></div>
          </div>
        </q-toolbar-title>
      </div>
      <div class="col-xs-12 col-md-7 text-right">


      </div>
    </div>
  </q-toolbar>

  <div class="row fit greyBorderTop"></div>

  <div class="row q-ma-lg">
    <q-banner rounded class="bg-grey-1 text-primary">
      The Tabsets Extension starts simple - you can manage tabs - but it has more to offer. Check out the optional or
      experimental features
      described below.<br><br>
      Some of the features may require additional browser permissions which you will have to grant.
    </q-banner>
  </div>

  <div class="row q-ma-lg">

    <div class="col-7">
      <div class="text-h6">{{ text.get(feature)?.name }}</div>
      <div>Status: {{ hasFeature(feature) ? 'active' : 'inactive' }}</div>
    </div>
    <div class="col text-right q-mr-xl">
      <div v-if="!text.get(feature)?.planned">
        <q-btn v-if="!hasFeature(feature)"
               label="Activate Feature" @click="grant(feature)"/>
        <q-btn v-else
               label="Deactivate Feature" @click="revoke(feature)"/>
      </div>
    </div>

    <div class="col-12 q-my-sm">
      <div class="text-subtitle2">Description</div>
    </div>

    <div class="col-12 q-my-md">
      <div>{{ text.get(feature)?.description }}</div>
    </div>

    <div class="col-12 q-my-md" v-if="text.get(feature)?.img">
      <div>
        <q-img :src="text.get(feature)?.img" :width="text.get(feature)?.img_width || '250px'"/>
      </div>
    </div>

    <div class="col-12 q-my-sm">
      <div class="text-subtitle2">Permissions</div>
    </div>

    <div class="col-12 q-my-md">
      <div>{{ permissionText(text.get(feature)) }}</div>
    </div>

  </div>

</template>

<script setup lang="ts">
import {ref, watchEffect} from 'vue'
import {useRoute, useRouter} from "vue-router";
import {useQuasar} from "quasar";
import {useTabsStore} from "src/stores/tabsStore";
import {useTabGroupsStore} from "src/stores/tabGroupsStore";
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {GrantPermissionCommand} from "src/domain/commands/GrantPermissionCommand";
import {GrantOriginCommand} from "src/domain/commands/GrantOriginCommand";
import {RevokePermissionCommand} from "src/domain/commands/RevokePermissionCommand";
import {RevokeOriginCommand} from "src/domain/commands/RevokeOriginCommand";
import {CreateDynamicTabsetCommand} from "src/domain/commands/CreateDynamicTabsetCommand";

const route = useRoute();
const router = useRouter();
const localStorage = useQuasar().localStorage
const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()
const featuresStore = useFeatureTogglesStore()
const permissionsStore = usePermissionsStore()

const title = ref('')
const filter = ref('')
const $q = useQuasar()

const highlightUrl = ref('')

const feature = ref(null as unknown as string)

const text: Map<string, object> = new Map()

text.set('opentabsThreshold', {
  name: 'Open Tabs Warning',
  description: 'The Idea behind the tabset extension is to keep your tabs count small - and still deal with all the URLs you need to handle. Tabsets' +
    ' can help you by tracking your open tabs count and alert you when it gets too big. Furthermore, it offers you ways to reduce your tab count on the fly. This ' +
    'feature is customizable in the settings.',
  img: 'open_tabs_warning.png',
  permissions: []
})
text.set('bookmarks', {
  name: 'Bookmarks',
  img: 'bookmarks.png',
  description: 'The Bookmarks Feature lets you access the browsers bookmarks to view (or delete) them and to turn them into tabsets if you wish. Futhermore, the search will ' +
    'take the URLs and titles of your bookmarks into account as well.',
  permissions: ['bookmarks']
})
text.set('pendingTabs', {
  name: 'New Tabs Tracking',
  img: 'pending.png',
  img_width: '700px',
  description: 'This feature aims to provide a more advanced way to track currently open tabs to be added to your tabsets (additionally to the default drag-and-drop approach from the open tabs view).',
  permissions: []
})
text.set('details', {
  name: 'Tab and Tabset Details',
  img: 'details.png',
  description: 'Click on the info icon to get more details about the selected tab',
  permissions: []
})
text.set('sidebar', {
  name: 'Sidebar View',
  img: 'sidebar.png',
  description: 'The sidebar view lets you open the tabs of a tabset in the extension page itself via an iframe. Please note that not all pages can be displayed like this.',
  permissions: []
})
text.set('groupedByDomain', {
  name: 'Group By Domain',
  img: 'groupedByDomain.png',
  description: 'The "Grouped By Domain" Feature provides a view where you can see all your tabs grouped by Domains. All Domains with at least two matching tabs will be considered.',
  permissions: []
})
text.set('newTab', {
  name: 'new Tab Feature',

  description: 'use tabset as your browsers default "New Tab" page.',
  permissions: []
})
text.set('rss', {
  name: 'RSS View',
  img: 'rss.png',
  description: 'The "RSS View" list all your RSS Pages. It is recommended to enable the "analyse Tabs" feature as well to automatically find ' +
    'linked rss feeds from your tabsets.',
  permissions: []
})
text.set('thumbnails', {
  experimental: false,
  name: 'Thumbnails',
  img: 'thumbnails.png',
  description: 'This extension can create thumbnails of the tabs you visit, so that they can presented in an more appealing way. ' +
    'Please note that only tabs that you visit (or revisit) after the activation of this feature are going to have thumbnails.',
  permissions: ['thumbnails']
})
text.set('analyseTabs', {
  experimental: false,
  name: 'Analyse Tabs',
  img: 'analyse.png',
  img_width: '700px',
  description: 'This extension can analyse the tabs you visit, so that the search can be improved significantly. The tab\'s content, ' +
    'its links and the received http headers are taken into account. ' +
    'Please note that only tabs that you visit (or revisit) after the activation of this feature are going to be analysed.',
  permissions: ['allOrigins']
})

text.set('history', {
  experimental: true,
  name: 'History',
  description: 'The "History" Feature provides access to your browser\'s history to provide additional features.',
  permissions: ['history']
})
text.set('experimentalViews', {
  experimental: true,
  name: 'Experimental Views',
  description: 'The default view of your tabset is a list - but there can be other views as well like grids or even a canvas.',
  permissions: []
})
text.set('dynamic', {
  experimental: true,
  name: 'Dynamic Tabsets',
  description: 'The idea is to provide you with tabset data which is defined outside the scope of this extension - e.g. defined by a website like wikipedia. ' +
    'For now, there is only one example; the wikipedia "List of most visited websites" is added to your tabsets as a readonly tab.',
  permissions: []
})
text.set('sessions', {
  experimental: true,
  name: 'Sessions',
  description: 'A session is a special type of tabsets where your newly opened tabs will be tracked automatically',
  permissions: []
})
text.set('useGroups', {
  experimental: true,
  name: 'Use Browser Groups',
  img: 'useGroups.png',
  img_width: '700px',
  description: 'Some Browsers can groups tabs to help you organize them. Activate this feature to use groups and pinned tabs inside this extension',
  permissions: []
})

text.set('spaces', {
  experimental: true,
  name: 'Spaces',
  description: 'The "Spaces" Feature lets you organize your tabsets in a larger structure, which might become handy if you start having many tabsets.',
  permissions: []
})
text.set('windows', {
  planned: true,
  name: 'Multiple Windows Support',
  description: 'Currently, only the active window is tracked by the Tabsets Extension. This feature will support all open Browser windows.',
  permissions: []
})
text.set('scheduled', {
  planned: true,
  name: 'Schedule Tabs Support',
  description: 'Be reminded about tabs you want to revisit',
  permissions: []
})
text.set('oldTabs', {
  planned: true,
  name: 'Old Tabs View',
  description: 'Get a list of old tabs to decide which ones to keep.',
  permissions: []
})

watchEffect(() => {
    feature.value = route.params.feature as string
    if (feature.value === "history") {
      title.value = "Experimental Features"
    } else if (feature.value === "spaces") {
      title.value = "Planned Features"
    } else {
      title.value = "Optional Features"
    }
  }
)

const hasFeature = (feature: string) => permissionsStore.hasFeature(feature)

const grant = (ident: string) => {
  if ("thumbnails" === ident || "analyseTabs" === ident) {
    useCommandExecutor()
      .executeFromUi(new GrantOriginCommand(ident))
  } else if ("pageCapture" === ident || "bookmarks" === ident || "history" === ident) {
    useCommandExecutor()
      .executeFromUi(new GrantPermissionCommand(ident))
  } else if ("dynamic" === ident) {
    useCommandExecutor()
      .executeFromUi(new CreateDynamicTabsetCommand(ident))
  } else {
    permissionsStore.activateFeature(ident)
  }

}

const revoke = (ident: string) => {
  if ("thumbnails" === ident || "analyseTabs" === ident) {
    useCommandExecutor()
      .executeFromUi(new RevokeOriginCommand(ident))
  } else if ("pageCapture" === ident || "bookmarks" === ident || "history" === ident) {
    useCommandExecutor()
      .executeFromUi(new RevokePermissionCommand(ident))
  } else {
    permissionsStore.deactivateFeature(ident)
  }
}

const permissionText = (f: any ) => {
  const permissions: string[] = f.permissions
  if (permissions.length === 0) {
    return "This feature does not need additional browser permissions."
  } else {
    return "This feature needs additional browser permissions: " + JSON.stringify(permissions)
  }

}


</script>

