<template>
  <q-header :style="edit ? 'background-color: grey' : 'background-color: white'">
    <div class="row">
      <div class="col-12 text-right">
        <q-icon
          v-if="!props.edit"
          name="edit"
          color="primary"
          size="xs"
          class="q-mx-md q-my-xs cursor-pointer"
          @click="editPage()" />
        <template v-else>
          {{ page?.version }} - {{ date.formatDate(page?.changed || 0, 'DD.MM.YYYY HH:MM:SS') }}
          <q-icon name="edit_off" size="xs" class="q-mx-md q-my-xs cursor-pointer" @click="editOff()" />
        </template>
      </div>
    </div>
  </q-header>
  <!--  <q-page padding class="home-page column justify-center items-center">-->
  <q-page style="max-width: 1200px; margin: 0 auto">
    <div class="row">
      <div class="col-2 q-pa-md q-mr-xl">
        <q-list>
          <q-item clickable v-ripple v-for="p in pageTabs" @click="switchPage(p)">
            <q-item-section>{{ p.name || p.title || '?' }}</q-item-section>
          </q-item>
        </q-list>
      </div>
      <div class="col q-mt-lg">
        <component-list :page="page" :editable="props.edit" @content-changed="savePage()"></component-list>
      </div>
      <div class="col-2">
        <div v-for="heading in headings()">
          {{ heading.data['text' as keyof object] }}
        </div>
      </div>
    </div>
  </q-page>
</template>
<script lang="ts" setup>
import { date } from 'quasar'
import ComponentList from 'src/tabsets/components/cms/ComponentList.vue'
import { Page } from 'src/tabsets/models/cms/backend'
import { ContentBlock, ContentBlockType } from 'src/tabsets/models/cms/frontend'
import { Tab } from 'src/tabsets/models/Tab'
import { TabAndTabsetId } from 'src/tabsets/models/TabAndTabsetId'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps<{ edit: boolean }>()

const page = ref<Page | undefined>(undefined)
const pageTabs = ref<Tab[]>([])
const tabAndTabsetId = ref<TabAndTabsetId | undefined>(undefined)
const tabset = ref<Tabset | undefined>(undefined)

const route = useRoute()

const pageId = route.params.pageId as string

// eslint-disable-next-line @typescript-eslint/no-misused-promises
watchEffect(async () => {
  console.log('pageId', pageId)
  tabAndTabsetId.value = useTabsetsStore().getTabAndTabsetId(pageId)
  if (tabAndTabsetId.value) {
    page.value = tabAndTabsetId.value.tab.page
    tabset.value = useTabsetsStore().getTabset(tabAndTabsetId.value.tabsetId)

    pageTabs.value = useTabsetsStore().getPageTabs(tabset.value)
  }
})

const editOff = () => {
  const partsArray = window.location.href.split('/')
  partsArray.pop()
  window.location.href = partsArray.join('/')
}

const editPage = () => (window.location.href = window.location.href + '/edit')
const savePage = () => {
  if (page.value && tabAndTabsetId.value) {
    //usePagesStore().updatePage(page.value)
    if (tabset.value) {
      page.value.version++
      page.value.changed = new Date().getTime()
      useTabsetsStore().saveTabset(tabset.value)
    }
  }
}

const switchPage = (page: Tab) => {
  const prefixUrl = chrome.runtime.getURL('www/index.html#/mainpanel/pages/' + page.id)
  window.location.replace(props.edit ? prefixUrl + '/edit' : prefixUrl)
}

const headings = (): ContentBlock[] => {
  return page.value?.elements.filter((c: ContentBlock) => c.data.kind == ContentBlockType.ContentBlockHeading) || []
}
</script>
