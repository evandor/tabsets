<template>
  <q-layout view="hHh LpR lFr">
    <q-header elevated>
      <q-toolbar>
        <template v-if="leftDrawerOpen">
          <q-img
            class="q-ml-xs q-mr-none cursor-pointer"
            style="margin-top: -7px"
            @click="toggleLeftDrawer"
            src="favicon.ico"
            height="32px"
            width="32px">
            <q-tooltip class="tooltip">Toggle the tabset list view by clicking here</q-tooltip>
          </q-img>
          <q-toolbar-title
            v-if="!useFeaturesStore().hasFeature(FeatureIdent.SPACES)"
            @click.stop="goHome()"
            class="cursor-pointer"
            style="min-width: 200px"
            shrink>
            {{ title() }}
            <q-tooltip class="tooltip">Reload Tabsets Extension</q-tooltip>
          </q-toolbar-title>
          <q-toolbar-title v-else>
            {{ title() }}
          </q-toolbar-title>
        </template>
        <!-- left drawer closed -->
        <template v-else>
          <q-icon class="q-ml-xs q-mr-none cursor-pointer" name="menu" size="18px" @click="toggleLeftDrawer">
            <q-tooltip class="tooltip">Toggle the tabset list view by clicking here</q-tooltip>
          </q-icon>
          <template v-if="useFeaturesStore().hasFeature(FeatureIdent.SPACES)">
            <SpacesSelectorWidget class="q-mx-md" />
          </template>
        </template>

        <q-space />

        <SearchWidget
          style="position: absolute; left: 300px; top: 5px; max-width: 500px"
          v-if="useTabsetsStore().tabsets.size > 1 || useSettingsStore().has('DEBUG_MODE')" />

        <div v-if="useAuthStore().user">
          <!--          <q-icon name="person" />-->
          <span class="cursor-pointer">{{ useAuthStore().user.email }}</span>
          <q-menu :offset="[0, 7]">
            <q-list style="min-width: 200px">
              <q-item clickable @click="logout()">Logout</q-item>
            </q-list>
          </q-menu>
        </div>

        <div v-if="useAuthStore().user && !useAuthStore().user.isAnonymous">
          <q-btn @click="toggleSettings" flat size="12px" class="q-mr-md" icon="o_settings"></q-btn>
          <q-menu :offset="[0, 7]">
            <q-list style="min-width: 200px">
              <q-item clickable @click="router.push('/settings')">Settings</q-item>
              <q-item clickable @click="tabsClicked(DrawerTabs.FEATURES)" v-close-popup>
                Activate more Features
              </q-item>
              <q-item clickable @click="showImportDialog" v-close-popup> Import Tabsets</q-item>
              <q-item clickable @click="showExportDialog" v-close-popup> Export Tabsets</q-item>
            </q-list>
          </q-menu>
        </div>

        <div class="cursor-pointer" @click="login()" v-if="!useAuthStore().user || useAuthStore().user.isAnonymous">
          Log in
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" side="left" :behavior="leftDrawerBehavior" bordered>
      <PublicTabsetsNavigation />
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { EXTENSION_NAME } from 'boot/constants'
import _ from 'lodash'
import { useMeta, useQuasar } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import PublicTabsetsNavigation from 'src/core/components/PublicTabsetsNavigation.vue'
import { useUtils } from 'src/core/services/Utils'
import { useSettingsStore } from 'src/core/stores/settingsStore'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import SearchWidget from 'src/search/widgets/SearchWidget.vue'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import SpacesSelectorWidget from 'src/spaces/widgets/SpacesSelectorWidget.vue'
import { Suggestion } from 'src/suggestions/domain/models/Suggestion'
import { useSuggestionsStore } from 'src/suggestions/stores/suggestionsStore'
import ExportDialog from 'src/tabsets/dialogues/ExportDialog.vue'
import ImportDialog from 'src/tabsets/dialogues/ImportDialog.vue'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { DrawerTabs, useUiStore } from 'src/ui/stores/uiStore'
import { useAuthStore } from 'stores/authStore'
import { ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

const $q = useQuasar()
const router = useRouter()

const leftDrawerOpen = ref($q.screen.gt.sm)
const leftDrawerBehavior = ref<'default' | 'desktop' | 'mobile' | undefined>('desktop')

const spacesStore = useSpacesStore()

const spacesOptions = ref<object[]>([])
const relevantSuggestions = ref<Suggestion[]>([])

const { inBexMode } = useUtils()

if ($q.platform.is.mobile) {
  leftDrawerBehavior.value = 'mobile'
}

$q.loadingBar.setDefaults({
  color: 'positive',
  size: '10px',
  position: 'top',
})

const settingsClicked = ref(false)

watchEffect(() => {
  relevantSuggestions.value = useSuggestionsStore().getSuggestions(['NEW', 'DECISION_DELAYED'])
})

watchEffect(() => {
  spacesOptions.value = _.map([...spacesStore.spaces.keys()], (key: any) => {
    const label = spacesStore.spaces.get(key)?.label || 'undef'
    return { id: key, label: label }
  })
    .concat({ id: '', label: '(unassigned)' })
    .concat({ id: '', label: 'create new space' })
})

useMeta(() => {
  return {
    title: 'Tabsets Extension', //+ appVersion
  }
})

const title = () => {
  const extensionName = EXTENSION_NAME
  return inBexMode() ? extensionName : process.env.MODE === 'spa' ? extensionName + ' Web' : extensionName + ' Pro'
}

const goHome = () => router.push('/')

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value
  useUiStore().toggleLeftDrawer()
}

const tabsClicked = (tab: DrawerTabs, data: object = {}) => {} //useUiStore().rightDrawerSetActiveTab(tab, data)

const showExportDialog = () => $q.dialog({ component: ExportDialog })
const showImportDialog = () => $q.dialog({ component: ImportDialog })

const toggleSettings = () => (settingsClicked.value = !settingsClicked.value)

const login = () => router.push('/mainpanel/login')

const logout = () => {
  useAuthStore()
    .logout()
    .then(() => {
      // router.push("/refresh/sidepanel")
    })
    .catch((err: any) => {
      console.log('error logging out', err)
    })
}
</script>
