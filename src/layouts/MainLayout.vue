<template>
  <q-layout view="hHh lpR lFr">
    <q-header elevated>
      <q-toolbar>

        <q-btn v-if="tabsStore.tabsets.size > 0"
               dense flat round icon="menu" @click="toggleLeftDrawer"/>

        <q-img class="q-ml-lg" style="margin-top:-4px"
               src="favicon.ico" height="32px" width="32px"/>

        <q-toolbar-title @click.stop="goHome()" class="cursor-pointer"
                         style="min-width:200px" shrink>{{ title() }}
        </q-toolbar-title>

        <q-space/>

        <SearchWidget v-if="tabsStore.tabsets.size > 0"/>

        <q-space/>

        <SpacesSelectorWidget v-if="featuresStore.isEnabled('spaces')"/>

        <Transition name="colorized-appear">
          <div v-if="permissionsStore.hasFeature('opentabsThreshold') && tabsStore.tabsets.size > 0">
            <OpenTabsThresholdWidget/>
          </div>
        </Transition>

        <div v-if="tabsStore.pendingTabset?.tabs.length > 0 && tabsStore.tabsets.size >= 1"
             class="q-mr-lg cursor-pointer no-wrap" style="min-width:200px">
          <UnassignedTabsWidget/>
        </div>

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
              <!--              <q-item-->
              <!--                      clickable v-close-popup @click="NavigationService.muteAll()">-->
              <!--                <q-item-section>Mute (all from window)</q-item-section>-->
              <!--              </q-item>-->
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
            <q-badge floating color="red" rounded />
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

        <q-btn class="q-mr-md" icon="o_settings" size="12px" style="width:24px" flat @click="router.push('/settings')">
          <q-tooltip>Customize Tabsets and utilize advanced features</q-tooltip>
        </q-btn>

        <div class="cursor-pointer" @click="router.push('/about')" v-if="notificationsStore.updateToVersion !== ''">
          <q-btn
            class="text-primary bg-warning"
            @click="installNewVersion"
            :label="'New Version ' + notificationsStore.updateToVersion + ' available. Click here to update'"/>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" :mini=uiService.useSmallDrawerView() side="left" bordered>
      <DrawerLeft/>
      <template v-slot:mini>
        <DrawerLeftMini/>
      </template>
    </q-drawer>

    <q-drawer show-if-above
              v-model="rightDrawerOpen" side="right" bordered
              content-class="column justify-between no-wrap bg-grey-1">
      <Navigation></Navigation>

    </q-drawer>

    <q-page-container>
      <router-view />
      <div id="fixed-footer" class="q-pl-md q-pa-xs">{{ useUiStore().footerInfo }}</div>
    </q-page-container>

  </q-layout>

</template>

<script setup lang="ts">
import {onMounted, onUnmounted, ref, watchEffect} from 'vue';
import {useQuasar} from "quasar";
import {useTabsStore} from "src/stores/tabsStore";
import {useRoute, useRouter} from "vue-router";
import {useMeta} from 'quasar'
import {useNotificationsStore} from "src/stores/notificationsStore";
import Navigation from "src/components/Navigation.vue"
import NavigationService from "src/services/NavigationService"
import DrawerLeft from "src/components/DrawerLeft.vue"
import DrawerLeftMini from "src/components/DrawerLeftMini.vue"
import {useSearchStore} from "src/stores/searchStore";
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import _ from "lodash";
import {useSpacesStore} from "stores/spacesStore"
import {useSettingsStore} from "stores/settingsStore"
import OpenTabsThresholdWidget from 'src/components/widgets/OpenTabsThresholdWidget.vue'
import SpacesSelectorWidget from 'src/components/widgets/SpacesSelectorWidget.vue'
import UnassignedTabsWidget from 'src/components/widgets/UnassignedTabsWidget.vue'
import SearchWidget from 'src/components/widgets/SearchWidget.vue'
import {useUiService} from "src/services/useUiService";
import {useUiStore} from "stores/uiStore";
import NotificationDialog from "components/dialogues/NotificationDialog.vue"
import {usePermissionsStore} from "stores/permissionsStore";
import {Notification, NotificationStatus} from "src/models/Notification";
import {useUtils} from "src/services/Utils";

const router = useRouter()
const tabsStore = useTabsStore()
const searchStore = useSearchStore()
const uiStore = useUiStore()

const localStorage = useQuasar().localStorage

const rightDrawerOpen = ref(true)
const leftDrawerOpen = ref(false)
const largeDrawer = ref(false)
const model = ref(85)

const notificationsStore = useNotificationsStore()
const permissionsStore = usePermissionsStore()
const featuresStore = useFeatureTogglesStore()
const settingsStore = useSettingsStore()
const spacesStore = useSpacesStore()
const uiService = useUiService()
const route = useRoute()

const spacesOptions = ref<object[]>([])
const search = ref('')
const $q = useQuasar()

const {inBexMode} = useUtils()

$q.loadingBar.setDefaults({
  color: 'positive',
  size: '10px',
  position: 'top'
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
  return inBexMode() ? 'Tabsets' : process.env.MODE === 'spa' ? 'Tabsets Web' : 'Tabsets ('+process.env.MODE+')'
}

const goHome = () => router.push("/")

const toggleLeftDrawer = () => {
  //useNotificationsStore().showDrawer = !useNotificationsStore().showDrawer
  //localStorage.set("showLeftDrawer", useNotificationsStore().showDrawer)
  useUiService().toggleDrawer()
}


watchEffect(() => {
  leftDrawerOpen.value = tabsStore.tabsets?.size > 0
})

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



</script>
