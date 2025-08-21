<template>
  <q-page>
    <div class="row">
      <div class="col q-mt-lg q-ml-xl">
        <component-list
          :page="page"
          :editable="props.editable"
          @content-changed="(cc: ContentBlock) => savePage(cc)"></component-list>
      </div>
      <div class="col-2 q-mt-lg">
        <template v-if="headings().length > 1">
          <div v-for="heading in headings()">{{ heading.data['text' as keyof object] }}</div>
        </template>
      </div>
    </div>
  </q-page>
</template>
<script lang="ts" setup>
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useUtils } from 'src/core/services/Utils'
import { CreatePageCommand } from 'src/tabsets/commands/cms/CreatePageCommand'
import ComponentList from 'src/tabsets/components/cms/ComponentList.vue'
import { Page } from 'src/tabsets/models/cms/backend'
import { ContentBlock, ContentBlockType } from 'src/tabsets/models/cms/frontend'
import { TabAndTabsetId } from 'src/tabsets/models/TabAndTabsetId'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps<{ editable: boolean }>()

const route = useRoute()
const { sendMsg } = useUtils()

const page = ref<Page | undefined>(undefined)
const pages = ref<Page[]>([])

const tabAndTabsetId = ref<TabAndTabsetId | undefined>(undefined)
const tabset = ref<Tabset | undefined>(undefined)
const tabId = route.params.tabId as string
const pageId = ref(Number(route.params.pageId || 0))

// eslint-disable-next-line @typescript-eslint/no-misused-promises
watchEffect(async () => {
  console.log('tabId', tabId)
  tabAndTabsetId.value = useTabsetsStore().getTabAndTabsetId(tabId)
  console.log('tabAndTabsetId', tabAndTabsetId.value?.tab.pages)
  if (tabAndTabsetId.value) {
    page.value = tabAndTabsetId.value.tab.pages[pageId.value]
    tabset.value = useTabsetsStore().getTabset(tabAndTabsetId.value.tabsetId)

    // pageTabs.value = useTabsetsStore().getPageTabs(tabset.value)
  }
})

const savePage = (cc: ContentBlock) => {
  // console.log('savePage1: ', page.value)
  // console.log('savePage2: ', cc)
  if (page.value && tabAndTabsetId.value) {
    //usePagesStore().updatePage(page.value)
    if (tabset.value) {
      page.value.version++
      page.value.changed = new Date().getTime()
      useTabsetsStore().saveTabset(tabset.value)
      sendMsg('tabsets.app.change.currentTabset', {})
    }
  }
}

const switchPage = (page: Page) => {
  // const prefixUrl = chrome.runtime.getURL('www/index.html#/mainpanel/pages/' + page.id)
  // window.location.replace(props.edit ? prefixUrl + '/edit' : prefixUrl)
}

const headings = (): ContentBlock[] => {
  return (
    page.value?.elements.filter((c: ContentBlock) => {
      // console.log('c.data.kind: ', c.data)
      return c.data?.kind === ContentBlockType.ContentBlockHeading
    }) || []
  )
}

const createSubPage = () => {
  useCommandExecutor().executeFromUi(new CreatePageCommand())
}
</script>
