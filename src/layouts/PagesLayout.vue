<template>
  <q-layout view="hHh lpR fFf" class="bg-grey-1">
    <q-header elevated class="bg-white text-grey-8" height-hint="64">
      <q-toolbar class="GNL__toolbar">
        <q-btn flat dense round @click="toggleLeftDrawer" aria-label="Menu" icon="menu" class="q-mr-sm" />

        <q-toolbar-title v-if="$q.screen.gt.xs" shrink class="row items-center no-wrap">
          <span class="q-ml-sm">
            {{ tabAndTabsetId?.tab.name || '?' }}
          </span>
        </q-toolbar-title>

        <q-space />

        <div class="q-gutter-sm row items-center no-wrap">
          <q-icon
            v-if="!route.path.endsWith('/edit')"
            name="edit"
            color="primary"
            size="xs"
            class="q-mx-md q-my-xs cursor-pointer"
            @click="editPage()" />
          <template v-else>
            <!--                      {{ page?.version }} - {{ date.formatDate(page?.changed || 0, 'DD.MM.YYYY HH:MM:SS') }}-->
            <q-icon name="edit_off" size="xs" class="q-mx-md q-my-xs cursor-pointer" @click="editOff()" />
          </template>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="bg-white" :width="280">
      <q-scroll-area class="fit">
        <div class="col-2 q-pa-md q-mr-xl" style="border: 1px solid red">
          <q-list>
            <q-item clickable v-ripple v-for="p in pages" @click="switchPage(p)">
              <q-item-section>{{ p.name || '?' }}</q-item-section>
            </q-item>
            <q-item clickable v-ripple v-if="edit" @click="createSubPage()">
              <q-item-section class="text-grey-7">+ Create new SubPage</q-item-section>
            </q-item>
          </q-list>
        </div>

        <q-list padding class="text-grey-8">
          <q-item class="GNL__drawer-item" v-ripple v-for="link in links1" :key="link.text" clickable>
            <q-item-section avatar>
              <q-icon :name="link.icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ link.text }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator inset class="q-my-sm" />

          <q-item class="GNL__drawer-item" v-ripple v-for="link in links2" :key="link.text" clickable>
            <q-item-section avatar>
              <q-icon :name="link.icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ link.text }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator inset class="q-my-sm" />

          <!--          <q-item class="GNL__drawer-item" v-ripple v-for="link in links3" :key="link.text" clickable>-->
          <!--            <q-item-section>-->
          <!--              <q-item-label>{{ link.text }} <q-icon v-if="link.icon" :name="link.icon" /></q-item-label>-->
          <!--            </q-item-section>-->
          <!--          </q-item>-->

          <div class="q-mt-md">
            <div class="flex flex-center q-gutter-xs">
              <a class="GNL__drawer-footer-link" href="javascript:void(0)" aria-label="Privacy">Privacy</a>
              <span> · </span>
              <a class="GNL__drawer-footer-link" href="javascript:void(0)" aria-label="Terms">Terms</a>
              <span> · </span>
              <a class="GNL__drawer-footer-link" href="javascript:void(0)" aria-label="About">About Google</a>
            </div>
          </div>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts" setup>
import { fasEarthAmericas } from '@quasar/extras/fontawesome-v6'
import { useUtils } from 'src/core/services/Utils'
import { Page } from 'src/tabsets/models/cms/backend'
import { TabAndTabsetId } from 'src/tabsets/models/TabAndTabsetId'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const leftDrawerOpen = ref(false)
const search = ref('')
const showAdvanced = ref(false)
const showDateOptions = ref(false)
const exactPhrase = ref('')
const hasWords = ref('')
const excludeWords = ref('')
const byWebsite = ref('')
const byDate = ref('Any time')

const props = defineProps<{ edit: boolean }>()

const pages = ref<Page[]>([])

// const pageTabs = ref<Tab[]>([])
const tabAndTabsetId = ref<TabAndTabsetId | undefined>(undefined)
const tabset = ref<Tabset | undefined>(undefined)

const route = useRoute()
const { sendMsg } = useUtils()

const pageId = route.params.pageId as string

// eslint-disable-next-line @typescript-eslint/no-misused-promises
watchEffect(async () => {
  console.log('pageId', pageId)
  tabAndTabsetId.value = useTabsetsStore().getTabAndTabsetId(pageId)
  console.log('tabAndTabsetId', tabAndTabsetId.value?.tab.pages)
  if (tabAndTabsetId.value) {
    //page.value = tabAndTabsetId.value.tab.pages[0]
    tabset.value = useTabsetsStore().getTabset(tabAndTabsetId.value.tabsetId)

    // pageTabs.value = useTabsetsStore().getPageTabs(tabset.value)
  }
})

function onClear() {
  exactPhrase.value = ''
  hasWords.value = ''
  excludeWords.value = ''
  byWebsite.value = ''
  byDate.value = 'Any time'
}

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

const links1 = [
  { icon: 'web', text: 'Top stories' },
  { icon: 'person', text: 'For you' },
  { icon: 'star_border', text: 'Favourites' },
  { icon: 'search', text: 'Saved searches' },
]
const links2 = [
  { icon: 'flag', text: 'Canada' },
  { icon: fasEarthAmericas, text: 'World' },
  { icon: 'place', text: 'Local' },
  { icon: 'domain', text: 'Business' },
  { icon: 'fitness_center', text: 'Health ' },
]

const editPage = () => (window.location.href = window.location.href + '/edit')

const editOff = () => {
  const partsArray = window.location.href.split('/')
  partsArray.pop()
  window.location.href = partsArray.join('/')
}
</script>
