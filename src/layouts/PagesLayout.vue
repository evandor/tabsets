<template>
  <q-layout view="hHh lpR fFf" class="bg-grey-1">
    <q-header elevated class="bg-white text-grey-8" height-hint="64">
      <q-toolbar>
        <q-btn flat dense round @click="toggleLeftDrawer" aria-label="Menu" icon="menu" class="q-mr-sm" />

        <q-toolbar-title v-if="$q.screen.gt.xs" shrink class="row items-center no-wrap">
          <span class="q-ml-sm">
            {{ tabAndTabsetId?.tab.title || '?' }}
          </span>
        </q-toolbar-title>

        <q-space />

        <div class="q-gutter-sm row items-center no-wrap">
          <q-icon
            v-if="!editable"
            name="edit"
            color="primary"
            size="xs"
            class="q-mx-md q-my-xs cursor-pointer"
            @click="toggleEditable()" />
          <template v-else>
            <!--                      {{ page?.version }} - {{ date.formatDate(page?.changed || 0, 'DD.MM.YYYY HH:MM:SS') }}-->
            <q-icon name="edit_off" size="xs" class="q-mx-md q-my-xs cursor-pointer" @click="toggleEditable()" />
          </template>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="bg-white" :width="280">
      <q-scroll-area class="fit">
        <div class="col-2 q-pa-md">
          <q-list>
            <q-item clickable v-ripple v-for="(p, index) in pages" @click="switchPage(index)">
              <q-item-section :class="index === pageId ? 'bg-blue' : ''">{{ p.name || '?' }}</q-item-section>
            </q-item>
            <q-item clickable v-ripple v-if="editable" @click="createSubPage()">
              <q-item-section class="text-grey-7">+ Create new SubPage</q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <component :is="Component" :editable="editable"> </component>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts" setup>
import { uid } from 'quasar'
import { Page } from 'src/tabsets/models/cms/backend'
import { TabAndTabsetId } from 'src/tabsets/models/TabAndTabsetId'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useUiStore } from 'src/ui/stores/uiStore'
import { ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const leftDrawerOpen = ref(false)
const editable = ref(useUiStore().pageEditable || false)
const pages = ref<Page[]>([])
const tabAndTabsetId = ref<TabAndTabsetId | undefined>(undefined)
const tabset = ref<Tabset | undefined>(undefined)
const route = useRoute()
const tabId = route.params.tabId as string
const pageId = Number(route.params.pageId || 0)

// eslint-disable-next-line @typescript-eslint/no-misused-promises
watchEffect(async () => {
  console.log('tabId/pageId', tabId, pageId)
  tabAndTabsetId.value = useTabsetsStore().getTabAndTabsetId(tabId)
  console.log('tabAndTabsetId', tabAndTabsetId.value?.tab.pages)
  if (tabAndTabsetId.value) {
    tabset.value = useTabsetsStore().getTabset(tabAndTabsetId.value.tabsetId)
    pages.value = tabAndTabsetId.value.tab.pages
  }
})

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

const switchPage = (index: number) => {
  const prefixUrl = chrome.runtime.getURL(`www/index.html#/mainpanel/pages/${tabAndTabsetId.value!.tab.id}/`)
  window.location.replace(prefixUrl + index)
}

const createSubPage = () => {
  if (!tabset.value) {
    return
  }
  const newPage = new Page(uid(), 'new', tabset.value.id, 1, new Date().getTime(), new Date().getTime(), 0, [])
  if (tabAndTabsetId.value) {
    tabAndTabsetId.value.tab.pages.push(newPage)
    useTabsetsStore().saveTabset(tabset.value)
  }
}

const toggleEditable = () => {
  editable.value = !editable.value
  useUiStore().setPageEditable(editable.value)
}
</script>
