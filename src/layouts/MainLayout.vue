<template>
  <q-layout view="hHh lpR lFr">
    <q-header elevated>
      <q-toolbar>

        <q-btn v-if="tabsStore.tabsets.size > 0"
          dense flat round icon="menu" @click="toggleLeftDrawer"/>

        <q-toolbar-title @click.stop="goHome()" class="cursor-pointer" shrink>
          Tabsets
          <span class="text-caption" v-show="spacesStore.spaces.size === 0">Handle more links, with less tabs open</span>
        </q-toolbar-title>

        <q-select
                  bg-color="white"
                  v-if="spacesStore.spaces.size > 0"
                  filled v-model="spacesStore.space" :options="spacesOptions" dense options-dense>
          <template v-slot:selected>
            Space:
            <q-chip
              v-if="spacesStore.space"
              dense
              square
              color="white"
              text-color="primary"
              class="q-my-none q-ml-xs q-mr-none">
              {{ spacesStore.space.label }}
            </q-chip>
            <q-badge v-else>*none*</q-badge>
          </template>
        </q-select>

        <q-input dark dense standout v-model="search"
                 ref="searchBox"
                 style="width:460px;"
                 v-if="tabsStore.tabsets.size > 0"
                 @keydown.enter.prevent="submitSearch()"
                 class="q-ml-md">
          <template v-slot:prepend>
            <q-icon v-if="search === ''" name="search"/>
            <q-icon v-else name="clear" class="cursor-pointer" @click="search = ''"/>
          </template>
        </q-input>


        <q-space/>

        <div v-if="tabsStore.pendingTabset?.tabs.length > 0 && tabsStore.tabsets.size > 1" class="q-mr-lg">
          {{ tabsStore.pendingTabset?.tabs.length }} unassigned tab(s)
        </div>

        <q-btn class="q-mr-md" icon="o_settings" size="12px" style="width:24px" flat @click="router.push('/settings')">
          <q-tooltip>Customize Tabsets and utilize advanced features</q-tooltip>
        </q-btn>

        <q-btn class="q-mr-md"  icon="o_help" size="12px" style="width:24px" flat @click="router.push('/about')">
          <q-tooltip>About tabsets browser extension</q-tooltip>
        </q-btn>

<!--        <q-btn label="Actions" style="width:200px" class="q-mr-lg" v-if="tabsStore.tabsets.size > 0">-->
<!--          <q-menu fit>-->
<!--            <q-list style="min-width: 100px">-->
<!--              <q-item clickable>-->
<!--                <q-item-section @click="closeTrackedTabs()" v-close-popup>Close all tracked tabs</q-item-section>-->
<!--              </q-item>-->
<!--              <q-separator/>-->
<!--              <q-item clickable v-if="useRouter().currentRoute.value.fullPath !== '/about'"-->
<!--                      @click="router.push('/about')">-->
<!--                <q-item-section>About tabsets</q-item-section>-->
<!--              </q-item>-->
<!--            </q-list>-->
<!--          </q-menu>-->
<!--        </q-btn>-->

        <div class="cursor-pointer" @click="router.push('/about')" v-if="notificationsStore.updateToVersion === ''">
          v{{ appVersion }}
        </div>
        <div class="cursor-pointer" @click="router.push('/about')" v-else>
          <q-btn
            class="text-primary bg-warning"
            @click="installNewVersion"
            :label="'New Version ' + notificationsStore.updateToVersion + ' available. Click here to update'"/>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" side="left" bordered>
      <DrawerLeft/>
    </q-drawer>

    <q-drawer show-if-above v-model="rightDrawerOpen" side="right" bordered
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
import DrawerLeft from "src/components/DrawerLeft.vue"
import TabsetService from "src/services/TabsetService";
import {useSearchStore} from "src/stores/searchStore";
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import _ from "lodash";
import {useSpacesStore} from "stores/spacesStore";

const router = useRouter()
const tabsStore = useTabsStore()
const searchStore = useSearchStore()

const localStorage = useQuasar().localStorage

const rightDrawerOpen = ref(true)
const leftDrawerOpen = ref(false)

const notificationsStore = useNotificationsStore()
const featuresStore = useFeatureTogglesStore()
const spacesStore = useSpacesStore()
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
  console.log("s", search.value)
  searchStore.term = search.value
  router.push("/search/" + search.value)
}

const title = () => {
  return spacesStore.spaces.size === 0 ? 'Tabsets' : 'Tabsets - Space: '
}

const goHome = () => router.push("/")

const toggleLeftDrawer = () => {
  useNotificationsStore().showDrawer = !useNotificationsStore().showDrawer
  localStorage.set("showLeftDrawer", useNotificationsStore().showDrawer)
}

onMounted(() => {
  leftDrawerOpen.value = localStorage.getItem<boolean>("showLeftDrawer") || false
  useNotificationsStore().showDrawer = leftDrawerOpen.value
})

watchEffect(() => {
  leftDrawerOpen.value = useNotificationsStore().showDrawer
})

const closeTrackedTabs = () => {
  TabsetService.closeTrackedTabs()
}


const installNewVersion = () => {
  notificationsStore.updateAvailable(false)
  chrome.runtime.reload()
}


</script>
