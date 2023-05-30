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

  <InfoMessageWidget
    :probability="1"
    ident="featuresPage_overview"
    hint="The Tabsets Extension starts simple - you can manage tabs - but it has more to offer. Check out the optional or
      experimental features described below. Some of the features may require additional browser permissions which you will have to grant."/>

  <div class="row q-ma-lg">

    <div class="col-7">
      <div class="text-h6">{{ text.get(feature)?.name }}</div>
      <div>Status: {{ hasFeature() ? 'active' : 'inactive' }}</div>
    </div>
    <div class="col text-right q-mr-xl">
      <div v-if="!text.get(feature)?.planned">
        <q-btn v-if="!hasFeature()"
               label="Activate Feature" @click="grant(feature)"/>
        <q-btn v-else
               label="Deactivate Feature" @click="revoke(feature)"/>
      </div>
    </div>

    <div class="col-12 q-my-sm">
      <div class="text-subtitle2">Type</div>
    </div>

    <div class="col-12 q-my-md">
      <div v-if="appFeature.type === FeatureType.RECOMMENDED">
        This feature is considered stable and useful, but not activated by default. To use it, switch this feature on.
      </div>
      <div v-if="appFeature.type === FeatureType.OPTIONAL">
        This feature is considered stable but might not be useful for everybody. To use it, switch this feature on.
      </div>
      <div v-if="appFeature.type === FeatureType.EXPERIMENTAL">
        This feature is not considered stable and might break other parts of this extension. To use it at your
        own risk, switch this feature on.
      </div>
    </div>

    <div class="col-12 q-my-sm">
      <div class="text-subtitle2">Description</div>
    </div>

    <div class="col-12 q-my-md">
      <div>{{ text.get(feature)?.description }}</div>
      <div v-if="hasFeature()" class="text-primary q-mt-md">{{ text.get(feature)?.activatedMsg }}</div>
    </div>

    <div class="col-12 q-my-sm" v-if="getDependentFeatures(feature).length > 0 && !hasFeature()">
      <div class="text-subtitle2">Dependent Features</div>
    </div>
    <div class="col-12 q-my-sm" v-if="getDependentFeatures(feature, true).length > 0 && hasFeature()">
      <div class="text-subtitle2">Dependent Features</div>
    </div>

    <div class="col-12 q-my-md" v-if="getDependentFeatures(feature).length > 0 && !hasFeature()">
      Activating this feature will make {{ getDependentFeatures(feature).length }} more feature(s) available:
      <ul>
        <li v-for="f in getDependentFeatures(feature)">{{ f.name }}</li>
      </ul>
    </div>

    <div class="col-12 q-my-md" v-if="getDependentFeatures(feature, true).length > 0 && hasFeature()">
      Deactivating this feature would deactivate {{ getDependentFeatures(feature, true).length }} more feature(s):
      <ul>
        <li v-for="f in getDependentFeatures(feature, true)">{{ f.name }} (currently active)</li>
      </ul>
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
      <div> {{ permissionText(text.get(feature)) }}</div>
    </div>

  </div>

</template>

<script setup lang="ts">
import {ref, watchEffect} from 'vue'
import {useRoute, useRouter} from "vue-router";
import {useQuasar} from "quasar";
import {useTabsStore} from "src/stores/tabsStore";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {AppFeature, FeatureIdent, FeatureType} from "src/models/AppFeature";
import {AppFeatures} from "src/models/AppFeatures";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {useSettingsStore} from "src/stores/settingsStore"
import InfoMessageWidget from "components/widgets/InfoMessageWidget.vue";
import {useUiService} from "src/services/useUiService";
import {DrawerTabs} from "stores/uiStore";

const route = useRoute();
const router = useRouter();
const localStorage = useQuasar().localStorage
const tabsStore = useTabsStore()
const featuresStore = useSettingsStore()
const permissionsStore = usePermissionsStore()
const uiService = useUiService()

const title = ref('')
const filter = ref('')
const $q = useQuasar()

uiService.rightDrawerSetActiveTab(DrawerTabs.FEATURES)

const feature = ref(null as unknown as string)
const appFeature = ref<AppFeature | undefined>(undefined)

const text: Map<string, object> = new Map()

text.set(FeatureIdent.OPENTABS_THRESHOLD.toLowerCase(), {
  name: 'Open Tabs Warning',
  description: 'The Idea behind the tabset extension is to keep your tabs count small - and still deal with all the URLs you need to handle. Tabsets' +
    ' can help you by tracking your open tabs count and alert you when it gets too big. Furthermore, it offers you ways to reduce your tab count on the fly. This ' +
    'feature is customizable in the settings.',
  img: 'open_tabs_warning.png',
  permissions: []
})
text.set(FeatureIdent.BOOKMARKS.toLowerCase(), {
  name: 'Bookmarks',
  img: 'bookmarks.png',
  description: 'The Bookmarks Feature lets you access the browsers bookmarks to view (or delete) them and to turn them into tabsets if you wish. Futhermore, the search will ' +
    'take the URLs and titles of your bookmarks into account as well.',
  permissions: ['bookmarks']
})
// text.set(FeatureIdent.DETAILS.toLowerCase(), {
//   name: 'Tab and Tabset Details',
//   img: 'details.png',
//   description: 'When clicking on a tab, a detail view will open providing you with meta information about the tab.',
//   activatedMsg: 'Now open a tabset and select a tab by clicking somewhere outside of the text',
//   permissions: []
// })
text.set(FeatureIdent.GROUP_BY_DOMAIN.toLowerCase(), {
  name: 'Group By Domain',
  img: 'groupedByDomain.png',
  description: 'The "Grouped By Domain" Feature provides a view where you can see all your tabs grouped by Domains. All Domains with at least two matching tabs will be considered.',
  permissions: []
})
text.set(FeatureIdent.SAVE_TAB.toLowerCase(), {
  name: 'Save Tabs',
  description: 'You can save tabs in a format called MHtml.',
  permissions: []
})
text.set(FeatureIdent.RSS.toLowerCase(), {
  name: 'RSS View',
  img: 'rss.png',
  description: 'The "RSS View" list all your RSS Pages. It is recommended to enable the "analyse Tabs" feature as well to automatically find ' +
    'linked rss feeds from your tabsets.',
  permissions: []
})
text.set(FeatureIdent.THUMBNAILS.toLowerCase(), {
  experimental: false,
  name: 'Thumbnails',
  img: 'thumbnails.png',
  description: 'This extension can create thumbnails of the tabs you visit, so that they can presented in an more appealing way. ' +
    'Please note that only tabs that you visit (or revisit) after the activation of this feature are going to have thumbnails.',
  permissions: ['thumbnails']
})
// text.set(FeatureIdent.ANALYSE_TABS.toLowerCase(), {
//   experimental: false,
//   name: 'Analyse Tabs',
//   img: 'analyse.png',
//   img_width: '700px',
//   description: 'This extension can analyse the tabs you visit, so that the search can be improved significantly. The tab\'s content, ' +
//     'its links and the received http headers are taken into account. ' +
//     'Please note that only tabs that you visit (or revisit) after the activation of this feature are going to be analysed.',
//   permissions: ['allOrigins']
// })

text.set(FeatureIdent.EXPERIMENTAL_VIEWS.toLowerCase(), {
  experimental: true,
  name: 'Experimental Views',
  description: 'The default view of your tabset is a list - but there can be other views as well like grids or even a canvas.',
  permissions: []
})
text.set(FeatureIdent.DYNAMIC.toLowerCase(), {
  experimental: true,
  name: 'Dynamic Tabsets',
  description: 'The idea is to provide you with tabset data which is defined outside the scope of this extension - e.g. defined by a website like wikipedia. ' +
    'For now, there is only one example; the wikipedia "List of most visited websites" is added to your tabsets as a readonly tab.',
  permissions: []
})
text.set(FeatureIdent.SESSIONS.toLowerCase(), {
  experimental: true,
  name: 'Sessions',
  description: 'A session is a special type of tabsets where your newly opened tabs will be tracked automatically',
  permissions: []
})
// text.set('useGroups', {
//   experimental: true,
//   name: 'Use Browser Groups',
//   img: 'useGroups.png',
//   img_width: '700px',
//   description: 'Some Browsers can groups tabs to help you organize them. Activate this feature to use groups and pinned tabs inside this extension',
//   permissions: []
// })
text.set(FeatureIdent.BACKUP.toLowerCase(), {
  experimental: true,
  name: 'Backup Tabset',
  description: 'Simply get rid of all open tabs by assigning them to this special tabset - a backup tabset which you can revisit later for proper assignment',
  permissions: []
})

text.set(FeatureIdent.IGNORE.toLowerCase(), {
  experimental: true,
  name: 'Ignore Tabset',
  description: 'This is a list of urls you want to ignore. This can be normal urls or urls with placeholders to catch all google search results for example',
  permissions: []
})

text.set(FeatureIdent.SPACES.toLowerCase(), {
  experimental: true,
  name: 'Spaces',
  description: 'The "Spaces" Feature lets you organize your tabsets in a larger structure, which might become handy if you start having many tabsets.',
  permissions: []
})
text.set(FeatureIdent.WINDOWS.toLowerCase(), {
  planned: true,
  name: 'Multiple Windows Support',
  description: 'Currently, only the active window is tracked by the Tabsets Extension. This feature will support all open Browser windows.',
  permissions: []
})
text.set(FeatureIdent.SCHEDULED.toLowerCase(), {
  planned: true,
  name: 'Schedule Tabs Support',
  description: 'Be reminded about tabs you want to revisit',
  permissions: []
})
text.set(FeatureIdent.OLD_TABS.toLowerCase(), {
  planned: true,
  name: 'Old Tabs View',
  description: 'Get a list of old tabs to decide which ones to keep.',
  permissions: []
})
text.set(FeatureIdent.TABSET_PAGE.toLowerCase(), {
  name: 'Tabset Page',
  description: 'Use an editor to add additional information about this tabset',
  permissions: []
})
text.set(FeatureIdent.NOTES.toLowerCase(), {
  name: 'Notes Feature',
  description: 'Add Notes to tabsets',
  permissions: []
})
text.set(FeatureIdent.TAGS.toLowerCase(), {
  name: 'Tags for Tabs',
  description: 'Assign tags to tabs',
  permissions: []
})
text.set(FeatureIdent.NOTES.toLowerCase(), {
  name: 'Quick Notes with Drag&Drop',
  description: 'Drag and drop a text selection from a website to create a note',
  permissions: []
})


watchEffect(() => {
    feature.value = route.params.feature as string
    const f = feature.value?.toUpperCase() as FeatureIdent
    if (f) {
      appFeature.value = new AppFeatures().getFeature(f)
      if (appFeature.value) {
        switch (appFeature.value.type) {
          case FeatureType.EXPERIMENTAL:
            title.value = "Experimental Feature"
            break;
          case FeatureType.RECOMMENDED:
            title.value = "Recommended Feature"
            break;
          case FeatureType.OPTIONAL:
            title.value = "Optional Feature"
            break;
          case FeatureType.PLANNED:
            title.value = "Planned Feature"
            break;
        }
      }
    }
  }
)

const hasFeature = () => {
  if (appFeature.value) {
    return permissionsStore.hasFeature(appFeature.value.ident)
  }
  return false;
}

const grant = (ident: string) => {
  if (appFeature.value && appFeature.value.activateCommand) {
    useCommandExecutor().execute(appFeature.value.activateCommand)
      .then((executionResult: ExecutionResult<any>) => {
        if (executionResult.result) {
          permissionsStore.activateFeature(ident)
        }
      })
  } else {
    permissionsStore.activateFeature(ident)
  }

}

const revoke = (ident: string) => {
  if (appFeature.value && appFeature.value.deactivateCommand) {
    console.log("revoking1", ident, appFeature.value.deactivateCommand)
    useCommandExecutor().execute(appFeature.value.deactivateCommand)
      .then(() => permissionsStore.deactivateFeature(ident))
  } else {
    console.log("revoking2", ident)
    permissionsStore.deactivateFeature(ident)
  }
}

const permissionText = (f: any) => {
  const permissions: string[] = f.permissions
  if (permissions.length === 0) {
    return "This feature does not need additional browser permissions."
  } else {
    return "This feature needs additional browser permissions: " + JSON.stringify(permissions)
  }

}

const getDependentFeatures = (rootFeature: string, onlyActive: boolean = false): AppFeature[] => {
  const featureIdent = rootFeature.toUpperCase() as FeatureIdent
  const dependentFeatures: AppFeature[] = []
  new AppFeatures().getFeatures().forEach(appFeature => {
    if (appFeature.requires.findIndex((r: FeatureIdent) => r === featureIdent && (onlyActive ? isActive(appFeature) : true)) >= 0) {
      dependentFeatures.push(appFeature)
    }
  })
  return dependentFeatures
}

const isActive = (f: AppFeature) => usePermissionsStore().hasFeature(f.ident)


</script>

