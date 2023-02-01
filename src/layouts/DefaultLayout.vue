<template>
  <q-layout view="hHh lpR lFr">
    <q-header elevated>
      <q-toolbar>

        <q-img class="q-ml-xs q-mr-none cursor-pointer" style="margin-top:-7px"
               @click="toggleLeftDrawer"
               src="favicon.ico" height="32px" width="32px">
          <q-tooltip class="tooltip">Toggle the tabset list view by clicking here</q-tooltip>
        </q-img>

        <q-toolbar-title
          @click.stop="goHome()" class="cursor-pointer"
          style="min-width:200px" shrink>
          {{ title() }}
          <q-tooltip class="tooltip">Reload Tabsets Extension</q-tooltip>
        </q-toolbar-title>


        <q-space/>

        <SearchWidget style="position: absolute; left:300px;top:5px;max-width:500px"
                      v-if="tabsStore.tabsets.size > 4"/>

        <q-space/>

        <SpacesSelectorWidget v-if="featuresStore.isEnabled('spaces')"/>

        <Transition name="colorized-appear">
          <div v-if="permissionsStore.hasFeature('opentabsThreshold') && tabsStore.tabsets.size > 0">
            <OpenTabsThresholdWidget/>
          </div>
        </Transition>

        <!--        <div v-if="tabsStore.pendingTabset?.tabs.length > 0 && tabsStore.tabsets.size >= 1"-->
        <!--             class="q-mr-lg cursor-pointer no-wrap" style="min-width:200px">-->
        <!--          <UnassignedTabsWidget/>-->
        <!--        </div>-->

        <div v-if="tabsStore.audibleTabs.length > 0">
          <span v-if="tabsStore.audibleTabs.length > 1">{{ tabsStore.audibleTabs.length }}x</span>
          <q-icon name="volume_up" size="22px" class="q-mr-md">
            <!--            <q-tooltip>{{tabsStore.audibleTabs}}</q-tooltip>-->
          </q-icon>
          <q-menu :offset="[0, 15]">
            <q-list style="min-width: 200px">
              <q-item v-for="tab in tabsStore.audibleTabs"
                      clickable v-close-popup @click="NavigationService.openTab(tab.id)">
                <q-item-section>{{ tab.title }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </div>

        <q-btn v-if="featuresStore.isEnabled('stats')"
               class="q-mr-md" icon="o_query_stats" size="12px" style="min-width:24px" flat
               @click="router.push('/stats')">
          <q-tooltip>Check out stats (experimental)</q-tooltip>
        </q-btn>

        <q-btn v-if="featuresStore.isEnabled('dev')"
               class="q-mr-md" icon="o_list" size="12px" style="width:24px" flat @click="router.push('/logs')">
          <q-tooltip>Logs (developer mode)</q-tooltip>
        </q-btn>

        <div v-if="unreadNotifications().length > 0">
          <q-btn flat icon="o_notifications" class="q-mr-md cursor-pointer">
            <q-badge floating color="red" rounded/>
          </q-btn>
          <q-menu :offset="[0, 7]">
            <q-list style="min-width: 200px">
              <q-item>New Notifications:</q-item>
              <q-item v-for="n in unreadNotifications()"
                      clickable v-close-popup @click="showNotificationDialog(n.id)">
                <q-item-section>{{ n.title }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </div>

        <!--        <q-btn class="q-mr-md" icon="o_help" size="12px" style="width:24px" flat @click="router.push('/help/howto')">-->
        <!--          <q-tooltip>About tabsets browser extension v{{ appVersion }}</q-tooltip>-->
        <!--        </q-btn>-->
        <!--        <q-tab v-if="rssTabsCount > 0"-->
        <!--               name="rss" icon="o_rss_feed" @click="tabsClicked(DrawerTabs.RSS)">-->
        <!--          <q-tooltip class="tooltip" anchor="center right" self="center left" :delay="200">RSS Feeds</q-tooltip>-->
        <!--        </q-tab>-->

        <span v-if="SuggestionsService.getSuggestions().length > 0">
          <q-btn
            flat
            name="rss" icon="o_assistant">
            <q-tooltip class="tooltip" anchor="center right" self="center left" :delay="200">You have suggestions
            </q-tooltip>
            <q-badge :label="useSuggestionsStore().getSuggestions().length"/>
          </q-btn>
          <q-menu :offset="[0, 7]">
            <q-list style="min-width: 200px">
              <q-item clickable v-close-popup @click="suggestionDialog(s)"
                      v-for="s in SuggestionsService.getSuggestions()">
                <q-item-section>
                  <div>{{ s.title }}</div>
                  <div class="text-caption">{{ s.msg }}</div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </span>

        <Transition name="colorized-appear">
          <q-btn v-if="permissionsStore.hasFeature('rss') && !inBexMode()"
                 flat
                 name="rss" icon="o_rss_feed" @click="tabsClicked(DrawerTabs.RSS)">
            <q-tooltip class="tooltip" anchor="center right" self="center left" :delay="200">Access to your rss feed
              tabs
            </q-tooltip>
          </q-btn>
        </Transition>

        <Transition name="colorized-appear">
          <q-btn v-if="permissionsStore.hasFeature('bookmarks')"
                 flat
                 name="sidebar" icon="o_bookmark" @click="tabsClicked(DrawerTabs.BOOKMARKS)">
            <q-tooltip class="tooltip" anchor="center right" self="center left" :delay="200">Access to your bookmarks
            </q-tooltip>
          </q-btn>
        </Transition>

        <Transition name="colorized-appear">
          <q-btn v-if="permissionsStore.hasFeature('sidebar')"
                 flat
                 name="sidebar" icon="o_input" @click="tabsClicked(DrawerTabs.SIDEBAR)">
            <q-tooltip class="tooltip" anchor="center right" self="center left" :delay="200">Your current tabset as
              'sidebar'
            </q-tooltip>
          </q-btn>
        </Transition>

        <div>
          <q-btn class="q-mr-md" icon="o_settings" size="12px" style="width:24px" flat>
            <q-tooltip class="tooltip" anchor="center right" self="center left" :delay="200">Customize Tabsets
            </q-tooltip>
          </q-btn>
          <q-menu :offset="[0, 7]">
            <q-list style="min-width: 200px">
              <q-item clickable @click="router.push('/settings')">Settings</q-item>
              <q-item clickable @click="useUiService().rightDrawerSetActiveTab(DrawerTabs.FEATURES)" v-close-popup>
                Activate more Features
              </q-item>
              <q-item clickable @click="showImportDialog" v-close-popup>
                Import Tabsets
              </q-item>
              <q-item clickable @click="showExportDialog" v-close-popup>
                Export Tabsets
              </q-item>
            </q-list>
          </q-menu>
        </div>

        <div class="cursor-pointer" @click="router.push('/about')" v-if="notificationsStore.updateToVersion !== ''">
          <q-btn
            class="text-primary bg-warning"
            @click="installNewVersion"
            :label="'New Version ' + notificationsStore.updateToVersion + ' available. Click here to update'"/>
        </div>
      </q-toolbar>
    </q-header>

    <!--    <q-drawer v-model="leftDrawerOpen" :mini=uiService.useSmallDrawerView() side="left" bordered>-->
    <!--      <DrawerLeft/>-->
    <!--      <template v-slot:mini>-->
    <!--        <DrawerLeftMini/>-->
    <!--      </template>-->
    <!--    </q-drawer>-->

    <q-drawer v-model="leftDrawerOpen" side="left" bordered>
      <Navigation></Navigation>
    </q-drawer>

    <q-drawer show-if-above
              v-model="rightDrawerOpen" side="right" bordered
              content-class="column justify-between no-wrap bg-grey-1">
      <DrawerRight/>

      <!--      <UnassignedTabs v-else-if="tab ===  DrawerTabs.UNASSIGNED_TABS" :filter="filter"/>-->

    </q-drawer>

    <q-page-container>
      {{suggestions}}
      <router-view/>
      <div id="fixed-footer" class="q-pl-md q-pa-xs">{{ useUiStore().footerInfo }}</div>
    </q-page-container>

  </q-layout>

</template>

<script setup lang="ts">
import {ref, watchEffect} from 'vue';
import {useQuasar} from "quasar";
import {useTabsStore} from "src/stores/tabsStore";
import {useRoute, useRouter} from "vue-router";
import {useMeta} from 'quasar'
import {useNotificationsStore} from "src/stores/notificationsStore";
import Navigation from "src/components/Navigation.vue"
import NavigationService from "src/services/NavigationService"
import {useSearchStore} from "src/stores/searchStore";
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import _ from "lodash";
import {useSpacesStore} from "stores/spacesStore"
import {useSettingsStore} from "stores/settingsStore"
import OpenTabsThresholdWidget from 'src/components/widgets/OpenTabsThresholdWidget.vue'
import SpacesSelectorWidget from 'src/components/widgets/SpacesSelectorWidget.vue'
import SearchWidget from 'src/components/widgets/SearchWidget.vue'
import {useUiService} from "src/services/useUiService";
import {DrawerTabs, useUiStore} from "stores/uiStore";
import NotificationDialog from "components/dialogues/NotificationDialog.vue"
import {usePermissionsStore} from "stores/permissionsStore";
import {Notification, NotificationStatus} from "src/models/Notification";
import {useUtils} from "src/services/Utils";
import DrawerRight from "components/DrawerRight.vue";
import ExportDialog from "components/dialogues/ExportDialog.vue";
import ImportDialog from "components/dialogues/ImportDialog.vue";
import {Suggestion, SuggestionState} from "src/models/Suggestion";
import SuggestionDialog from "components/dialogues/SuggestionDialog.vue";
import {useSuggestionsStore} from "stores/suggestionsStore";
import SuggestionsService from "src/services/SuggestionsService";

const router = useRouter()
const tabsStore = useTabsStore()
const searchStore = useSearchStore()
const uiStore = useUiStore()

const localStorage = useQuasar().localStorage

const rightDrawerOpen = ref(true)
const leftDrawerOpen = ref(true)
const filter = ref<string>('')
const model = ref(85)

const notificationsStore = useNotificationsStore()
const permissionsStore = usePermissionsStore()
const featuresStore = useFeatureTogglesStore()
const settingsStore = useSettingsStore()
const spacesStore = useSpacesStore()
const uiService = useUiService()
const route = useRoute()

const spacesOptions = ref<object[]>([])
const suggestions = ref<Suggestion[]>(useSuggestionsStore().getSuggestions())
const search = ref('')
const $q = useQuasar()

const {inBexMode} = useUtils()

$q.loadingBar.setDefaults({
  color: 'positive',
  size: '10px',
  position: 'top'
})

watchEffect(() => {
  suggestions.value = useSuggestionsStore().getSuggestions()
})

watchEffect(() => {
  spacesOptions.value = _.map([...spacesStore.spaces.keys()], key => {
    const label = spacesStore.spaces.get(key)?.label || 'undef'
    return {id: key, label: label}
  })
    .concat({id: '', label: '(unassigned)'})
    .concat({id: '', label: 'create new space'})
})

//@ts-ignore
const appVersion = import.meta.env.PACKAGE_VERSION

useMeta(() => {
  return {
    // @ts-ignore
    title: 'Tabsets Extension' //+ appVersion
  }
})


function submitSearch() {
  searchStore.term = search.value
  router.push("/search")
}

const title = () => {
  return inBexMode() ? 'Tabsets' : process.env.MODE === 'spa' ? 'Tabsets Web' : 'Tabsets (' + process.env.MODE + ')'
}

const goHome = () => router.push("/")

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value
  //useUiService().toggleDrawer()
}

const installNewVersion = () => {
  notificationsStore.updateAvailable(false)
  chrome.runtime.reload()
}

const unreadNotifications = () => _.filter(notificationsStore.notifications, (n: Notification) => n.status === NotificationStatus.UNREAD)

const showNotificationDialog = (nId: string) => $q.dialog({
  component: NotificationDialog, componentProps: {
    notificationId: nId
  }
})

const tabsClicked = (tab: DrawerTabs) => uiService.rightDrawerSetActiveTab(tab)

const showExportDialog = () => $q.dialog({component: ExportDialog})
const showImportDialog = () => $q.dialog({component: ImportDialog})

const suggestionDialog = (s: Suggestion) => $q.dialog({
  component: SuggestionDialog, componentProps: {
    suggestion: s
  }
})

</script>
