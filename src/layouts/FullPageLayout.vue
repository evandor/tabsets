<template>
  <q-layout view="hHh LpR lFr">
    <q-header elevated>
      <q-toolbar class="">

        <template v-if="leftDrawerOpen">
          <q-img
            class="q-ml-xs q-mr-none cursor-pointer" style="margin-top:-7px"
            @click="toggleLeftDrawer"
            src="favicon.ico" height="32px" width="32px">
            <q-tooltip class="tooltip">Toggle the tabset list view by clicking here</q-tooltip>
          </q-img>
          <q-toolbar-title v-if="!usePermissionsStore().hasFeature(FeatureIdent.SPACES)"
                           @click.stop="goHome()" class="cursor-pointer"
                           style="min-width:200px" shrink>
            {{ title() }}
            <q-tooltip class="tooltip">Reload Tabsets Extension</q-tooltip>
          </q-toolbar-title>
          <q-toolbar-title v-else>
            {{ title() }}
          </q-toolbar-title>
        </template>
        <!-- left drawer closed -->
        <template v-else>
          <q-icon
            class="q-ml-xs q-mr-none cursor-pointer"
            name="menu" size="18px" @click="toggleLeftDrawer">
            <q-tooltip class="tooltip">Toggle the tabset list view by clicking here</q-tooltip>
          </q-icon>
          <template v-if="usePermissionsStore().hasFeature(FeatureIdent.SPACES)">
            <SpacesSelectorWidget class="q-mx-md"/>
          </template>
        </template>


        <q-space/>

        <SearchWidget style="position: absolute; left:300px;top:5px;max-width:500px"
                      v-if="useTabsetsStore().tabsets.size > 1 || useSettingsStore().isEnabled('dev')"/>

        <Transition name="colorized-appear">
          <div v-if="permissionsStore.hasFeature(FeatureIdent.OPENTABS_THRESHOLD) && useTabsetsStore().tabsets.size > 0">
            <OpenTabsThresholdWidget/>
          </div>
        </Transition>

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

        <span
          v-if="useSuggestionsStore().getSuggestions([SuggestionState.NEW, SuggestionState.DECISION_DELAYED]).length > 0">
          <q-btn
            flat
            :color="dependingOnStates()"
            name="rss" icon="o_assistant">
            <q-tooltip class="tooltip" anchor="center right" self="center left" :delay="200">You have suggestions
            </q-tooltip>
            <q-badge
              :label="useSuggestionsStore().getSuggestions([SuggestionState.NEW, SuggestionState.DECISION_DELAYED]).length"/>
          </q-btn>
          <q-menu :offset="[0, 7]">
            <q-list style="min-width: 200px">
              <q-item clickable v-close-popup v-ripple @click="suggestionDialog(s)"
                      v-for="s in useSuggestionsStore().getSuggestions([SuggestionState.NEW, SuggestionState.DECISION_DELAYED])">
                <q-item-section avatar>
                  <q-icon color="primary" :name="s.img ? s.img : 'rss_feed'"/>
                </q-item-section>
                <q-item-section>
                  <div>{{ s.title }}</div>
                  <div class="text-caption">{{ s.msg }}</div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </span>

        <ToolbarButton
          :feature="FeatureIdent.SAVE_TAB"
          :drawer="DrawerTabs.SAVED_TABS"
          icon="o_save"
          tooltip="List of MTHML Snapshots"/>

        <ToolbarButton
          :feature="FeatureIdent.SAVE_TAB_AS_PNG"
          :drawer="DrawerTabs.SAVED_TABS_AS_PNG"
          icon="o_image"
          tooltip="The List of PNGs"/>

        <ToolbarButton
          :feature="FeatureIdent.SAVE_TAB_AS_PDF"
          :drawer="DrawerTabs.SAVED_TABS_AS_PDF"
          icon="o_picture_as_pdf"
          tooltip="The List of PDFs"/>

        <ToolbarButton
          :feature="FeatureIdent.GROUP_BY_DOMAIN"
          :drawer="DrawerTabs.GROUP_BY_HOST_TABS"
          icon="o_dns"
          tooltip="Your tabs grouped by domain"/>

        <ToolbarButton
          :feature=FeatureIdent.RSS
          :drawer="DrawerTabs.RSS"
          icon="o_rss_feed"
          tooltip="Access to your rss feed"/>

        <ToolbarButton
          :drawer="DrawerTabs.BOOKMARKS"
          icon="o_bookmark"
          tooltip="Access to your bookmarks"/>

        <!--        <ToolbarButton-->
        <!--            :drawer="DrawerTabs.UNASSIGNED_TABS"-->
        <!--            icon="o_playlist_add"-->
        <!--            tooltip="Show add tabs view"-->
        <!--            :restricted="false"/>-->

        <ToolbarButton
          :drawer="DrawerTabs.OPEN_TABS"
          icon="o_playlist_add"
          tooltip="Show Open Tabs View"
          :restricted="$q.platform.is.chrome"/>

        <ToolbarButton
          :drawer="DrawerTabs.TAGS_VIEWER"
          icon="o_label"
          tooltip="Show tags viewer"
          :restricted="$q.platform.is.chrome"/>

        <div>
          <q-btn
            @click="toggleSettings"
            flat
            size="12px"
            class="q-mr-md" icon="o_settings">
          </q-btn>
          <q-menu :offset="[0, 7]">
            <q-list style="min-width: 200px">
              <q-item v-if="!useAuthStore().isAuthenticated()" clickable @click="router.push('/login')">Login</q-item>
              <q-item v-else clickable @click="logout()">Logout</q-item>
              <q-item clickable @click="router.push('/settings')">Settings</q-item>
              <q-item clickable @click="tabsClicked(DrawerTabs.FEATURES)" v-close-popup>
                Activate more Features
              </q-item>
              <q-item clickable v-close-popup>
                <q-item-section @click="subscribe()">Subscribe to Pro Features</q-item-section>
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

        <div class="cursor-pointer" @click="router.push('/')" v-if="notificationsStore.updateToVersion !== ''">
          <q-btn
            class="text-primary bg-warning"
            @click="installNewVersion(notificationsStore.updateToVersion)"
            :label="'New Version ' + notificationsStore.updateToVersion + ' available. Click here to update'"/>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" side="left" behavior="desktop" bordered>
      <Navigation></Navigation>
    </q-drawer>

    <q-drawer v-model="useUiStore().rightDrawerOpen" side="right" bordered
              content-class="column justify-between no-wrap bg-grey-1">
      <DrawerRight/>
    </q-drawer>

    <q-page-container>
      <router-view/>
      <!--      <div id="fixed-footer" class="q-pl-md q-pa-xs">{{ useUiStore().footerInfo }}</div>-->
    </q-page-container>

  </q-layout>

</template>

<script setup lang="ts">
import {ref, watchEffect} from 'vue';
import {useMeta, useQuasar} from "quasar";
import {useTabsStore} from "src/stores/tabsStore";
import {useRouter} from "vue-router";
import {useNotificationsStore} from "src/stores/notificationsStore";
import Navigation from "src/components/Navigation.vue"
import {useSearchStore} from "src/stores/searchStore";
import _ from "lodash";
import {useSpacesStore} from "src/spaces/stores/spacesStore"
import OpenTabsThresholdWidget from 'src/components/widgets/OpenTabsThresholdWidget.vue'
import SpacesSelectorWidget from 'src/spaces/widgets/SpacesSelectorWidget.vue'
import SearchWidget from 'src/components/widgets/SearchWidget.vue'
import {DrawerTabs, UserLevel, useUiStore} from "src/stores/uiStore";
import NotificationDialog from "components/dialogues/NotificationDialog.vue"
import {usePermissionsStore} from "src/stores/permissionsStore";
import {Notification, NotificationStatus} from "src/models/Notification";
import {useUtils} from "src/services/Utils";
import DrawerRight from "components/DrawerRight.vue";
import ExportDialog from "components/dialogues/ExportDialog.vue";
import ImportDialog from "components/dialogues/ImportDialog.vue";
import {Suggestion, SuggestionState} from "src/suggestions/models/Suggestion";
import SuggestionDialog from "src/suggestions/dialogues/SuggestionDialog.vue";
import {useSuggestionsStore} from "src/suggestions/stores/suggestionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {useSettingsStore} from "src/stores/settingsStore"
import ToolbarButton from "components/widgets/ToolbarButton.vue";
import {FirebaseCall} from "src/services/firebase/FirebaseCall";
import {useAuthStore} from "stores/authStore";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";

const $q = useQuasar()
const router = useRouter()
const tabsStore = useTabsStore()

const leftDrawerOpen = ref($q.screen.gt.lg)

const notificationsStore = useNotificationsStore()
const permissionsStore = usePermissionsStore()
const settingsStore = useSettingsStore()
const spacesStore = useSpacesStore()

const spacesOptions = ref<object[]>([])
const suggestions = ref<Suggestion[]>(useSuggestionsStore().getSuggestions([SuggestionState.NEW, SuggestionState.DECISION_DELAYED]))

const {inBexMode} = useUtils()

$q.loadingBar.setDefaults({
  color: 'positive',
  size: '10px',
  position: 'top'
})

const settingsClicked = ref(false)

watchEffect(() => {
  suggestions.value = useSuggestionsStore().getSuggestions([SuggestionState.NEW, SuggestionState.DECISION_DELAYED])
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


const title = () => {
  return inBexMode() ? 'Tabsets' : process.env.MODE === 'spa' ?
    'Tabsets Web' : 'Tabsets'
}

const goHome = () => router.push("/")

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value
  useUiStore().toggleLeftDrawer()
}

const subscribe = async () => {
  FirebaseCall.post("/stripe/create-checkout-session/tabsets", {})
    .then((res) => {
      console.log("res", res)
      window.location.href = res.data.url
    })
}

const installNewVersion = (version: string) => {
  notificationsStore.updateAvailable(false)
  chrome.tabs.create({
    active: true,
    url: "https://tabsets.web.app/#/updatedTo/" + version
  })
  chrome.runtime.reload()
}

const unreadNotifications = () => _.filter(notificationsStore.notifications, (n: Notification) => n.status === NotificationStatus.UNREAD)

const showNotificationDialog = (nId: string) => $q.dialog({
  component: NotificationDialog, componentProps: {
    notificationId: nId
  }
})

const tabsClicked = (tab: DrawerTabs, data: object = {}) => useUiStore().rightDrawerSetActiveTab(tab, data)

const showExportDialog = () => $q.dialog({component: ExportDialog})
const showImportDialog = () => $q.dialog({component: ImportDialog})

const suggestionDialog = (s: Suggestion) => $q.dialog({
  component: SuggestionDialog, componentProps: {
    suggestion: s
  }
})

const dependingOnStates = () =>
  _.find(useSuggestionsStore().getSuggestions([SuggestionState.NEW, SuggestionState.DECISION_DELAYED]), s => s.state === SuggestionState.NEW) ? 'warning' : 'white'

const toggleSettings = () => settingsClicked.value = !settingsClicked.value

const logout = () => {
  useAuthStore().logout()
}

</script>
