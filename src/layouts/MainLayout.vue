<template>
  <q-layout view="hHh lpR lFr">
    <q-header elevated>
      <q-toolbar>

        <q-btn v-if="tabsStore.tabsets.size > 0"
               dense flat round icon="menu" @click="toggleLeftDrawer"/>

        <q-toolbar-title @click.stop="goHome()" class="cursor-pointer" shrink>
          Tabsets
          <span class="text-caption"
                v-show="!featuresStore.isEnabled('spaces')">Handle more links, with less tabs open</span>
        </q-toolbar-title>

        <SpacesSelectorWidget v-if="featuresStore.isEnabled('spaces')" />

        <SearchWidget />

        <q-space/>

        <div>
          <OpenTabsThresholdWidget v-if="tabsStore.tabsets.size > 0"/>
        </div>

        <div v-if="tabsStore.pendingTabset?.tabs.length > 0 && tabsStore.tabsets.size > 1" class="q-mr-lg">
          {{ tabsStore.pendingTabset?.tabs.length }} unassigned tab(s)
        </div>

        <div v-if="tabsStore.audibleTabs.length > 0">
          <span v-if="tabsStore.audibleTabs.length > 1">{{tabsStore.audibleTabs.length}}x</span>
          <q-icon name="volume_up" size="22px" class="q-mr-md">
<!--            <q-tooltip>{{tabsStore.audibleTabs}}</q-tooltip>-->
          </q-icon>
          <q-menu :offset="[0, 15]">
            <q-list style="min-width: 200px">
              <q-item v-for="tab in tabsStore.audibleTabs"
                clickable v-close-popup @click="NavigationService.openTab(tab.id)">
                <q-item-section>{{tab.title}}</q-item-section>
              </q-item>
<!--              <q-item-->
<!--                      clickable v-close-popup @click="NavigationService.muteAll()">-->
<!--                <q-item-section>Mute (all from window)</q-item-section>-->
<!--              </q-item>-->
            </q-list>
          </q-menu>
        </div>

        <q-btn v-if="featuresStore.isEnabled('stats')"
               class="q-mr-md" icon="o_query_stats" size="12px" style="width:24px" flat @click="router.push('/stats')">
          <q-tooltip>Check out stats (experimental)</q-tooltip>
        </q-btn>

        <q-btn class="q-mr-md" icon="o_settings" size="12px" style="width:24px" flat @click="router.push('/settings')">
          <q-tooltip>Customize Tabsets and utilize advanced features</q-tooltip>
        </q-btn>

        <q-btn class="q-mr-md" icon="o_help" size="12px" style="width:24px" flat @click="router.push('/about')">
          <q-tooltip>About tabsets browser extension v{{ appVersion }}</q-tooltip>
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
      <DrawerLeft />
      <template v-slot:mini>
        <DrawerLeftMini />
      </template>
    </q-drawer>

    <q-drawer show-if-above
              v-model="rightDrawerOpen" side="right" bordered
              content-class="column justify-between no-wrap bg-grey-1">
      <Navigation></Navigation>

      <TabInfo style="position: absolute;bottom:0"/>


    </q-drawer>

    <q-page-container>
      <router-view/>
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
import TabInfo from "src/components/layouts/TabInfo.vue"
import Navigation from "src/components/Navigation.vue"
import NavigationService from "src/services/NavigationService"
import DrawerLeft from "src/components/DrawerLeft.vue"
import DrawerLeftMini from "src/components/DrawerLeftMini.vue"
import TabsetService from "src/services/TabsetService";
import {useSearchStore} from "src/stores/searchStore";
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import _ from "lodash";
import {useSpacesStore} from "stores/spacesStore"
import {useSettingsStore} from "stores/settingsStore"
import OpenTabsThresholdWidget from 'src/components/widgets/OpenTabsThresholdWidget.vue'
import SpacesSelectorWidget from 'src/components/widgets/SpacesSelectorWidget.vue'
import SearchWidget from 'src/components/widgets/SearchWidget.vue'
import {useUiService} from "src/services/useUiService";
import {useUiStore} from "stores/uiStore";

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
const featuresStore = useFeatureTogglesStore()
const settingsStore = useSettingsStore()
const spacesStore = useSpacesStore()
const uiService = useUiService()
const route = useRoute()

const spacesOptions = ref<object[]>([])
const search = ref('')
const $q = useQuasar()

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

const searchBox = ref(null)

useMeta(() => {
  return {
    // @ts-ignore
    title: 'Tabsets Extension' //+ appVersion
  }
})

function checkKeystroke(e: any) {
  if (e.key === '/') {
    //console.log("e", e, searchBox, search.value)
    // @ts-ignore
    searchBox.value.focus()
    search.value = ''
    //console.log("e2", search.value)
  }
}

onMounted(() => {
  window.addEventListener('keypress', checkKeystroke);
})

onUnmounted(() => {
  window.removeEventListener('keypress', checkKeystroke);
})

function submitSearch() {
  searchStore.term = search.value
  router.push("/search")
}

const title = () => {
  return spacesStore.spaces.size === 0 ? 'Tabsets' : 'Tabsets - Space: '
}

const goHome = () => router.push("/")

const toggleLeftDrawer = () => {
  //useNotificationsStore().showDrawer = !useNotificationsStore().showDrawer
  //localStorage.set("showLeftDrawer", useNotificationsStore().showDrawer)
  useUiService().toggleDrawer()
}

const toggleLargeDrawer = () => {
  largeDrawer.value = !largeDrawer.value
}

watchEffect(() => {
  leftDrawerOpen.value = tabsStore.tabsets?.size > 0
})

const installNewVersion = () => {
  notificationsStore.updateAvailable(false)
  chrome.runtime.reload()
}



</script>
