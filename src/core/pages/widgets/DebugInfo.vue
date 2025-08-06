<template>
  <div class="row q-pa-none q-ma-none q-mt-lg fit boxed">
    <div class="col-12 text-caption text-bold">DEBUG</div>

    <div class="col-4 text-caption">current tabset</div>
    <div class="col-8 text-caption ellipsis" style="font-size: smaller">
      {{ useTabsetsStore().currentTabsetName }} ({{ useTabsetsStore().getCurrentTabset?.type }})
    </div>

    <div class="col-4 text-caption">title</div>
    <div class="col-8 text-caption ellipsis" style="font-size: smaller">
      {{ useContentStore().currentTabTitle }}
      <q-tooltip class="tooltip-small">{{ useContentStore().currentTabTitle }}</q-tooltip>
    </div>

    <div class="col-4 text-caption">description</div>
    <div class="col-8 text-caption ellipsis-3-lines" style="font-size: smaller">
      {{ useContentStore().currentTabMetas['description' as keyof object] }}
      <q-tooltip class="tooltip-small"
        >{{ useContentStore().currentTabMetas['description' as keyof object] }}
      </q-tooltip>
    </div>

    <div class="col-4 text-caption">last accessed</div>
    <div class="col-8 text-caption ellipsis" style="font-size: smaller">
      {{ formatDistance(useContentStore().getCurrentTabLastAccessed || 0, new Date(), { addSuffix: true }) }}
    </div>
    <div class="col-4 text-caption">content store</div>
    <div class="col-8 text-caption ellipsis" style="font-size: smaller">
      {{ useContentStore().getCurrentTabUrl }}
    </div>
    <div class="col-4 text-caption">tabs store</div>
    <div
      class="col-8 text-caption ellipsis"
      style="font-size: smaller"
      :class="useContentStore().getCurrentTabUrl !== useTabsStore2().currentChromeTab?.url ? 'text-negative' : ''">
      {{ useTabsStore2().currentChromeTab?.url }}
    </div>
    <!--    <div class="col-4 text-caption">tabs store</div>-->
    <!--    <div class="col-8 text-caption ellipsis" style="font-size: smaller">-->
    <!--      {{ useTabsetsStore().get}}-->
    <!--    </div>-->
    <div class="col-4 text-caption">category</div>
    <div class="col-8 text-caption text-bold" style="font-size: smaller">
      {{ useTagsService().getCurrentTabContentClassification() }}/{{ aiCategory }}
    </div>

    <div class="col-4 text-caption">content length</div>
    <div class="col-8 text-caption" style="font-size: smaller">
      {{ useContentStore().getCurrentTabContent?.length }}
      <span
        v-if="useContentStore().getCurrentTabContent?.length === 0"
        class="cursor-pointer text-blue-8"
        @click="reloadCurrentTab()">
        reload
      </span>
    </div>

    <div class="col-4 text-caption">Tags ({{ useContentStore().currentTabTags.length }})</div>
    <div class="col-8 text-caption" style="font-size: smaller">
      <i>LD+JSON</i>: {{ tagsWithType('linkingData') }}<br />
      <i>URL</i>: {{ tagsWithType('url') }}<br />
      <i>Keywords</i>: {{ tagsWithType('keyword') }}<br />
      <i>Hierarchy</i>: {{ tagsWithType('hierarchy') }}<br />
      <i>Language</i>: {{ tagsWithType('langDetection') }}<br />
      <i>LangModel</i>: {{ tagsWithType('languageModel') }}<br />
    </div>

    <div class="col-4 text-caption">Meta Data</div>
    <div
      class="col-8 text-caption cursor-pointer"
      style="font-size: smaller"
      @click="infoDialog('Meta', useContentStore().getCurrentTabMetas)">
      {{ Object.keys(useContentStore().getCurrentTabMetas).length }}
    </div>

    <div class="col-4 text-caption">storage</div>
    <div class="col-8 text-caption" style="font-size: smaller">
      <div
        class="ellipsis"
        @click="infoDialog('Storage', useContentStore().getCurrentTabStorage['tabsetsManaged' as keyof object])">
        <i>managed:</i>
        {{ useContentStore().getCurrentTabStorage['tabsetsManaged' as keyof object] }}
      </div>
      <div class="ellipsis">
        <i>annotations</i>:
        {{ (useContentStore().getCurrentTabStorage['tabsetsAnnotations' as keyof object] as object[])?.length || 0 }}
      </div>
      <div
        class="ellipsis cursor-pointer"
        @click="
          infoDialog('Categorization', useContentStore().getCurrentTabStorage['tabsetsCategorization' as keyof object])
        ">
        <i>categorizations</i>:
        {{ useContentStore().getCurrentTabStorage['tabsetsCategorization' as keyof object] }}
      </div>
      <div class="ellipsis">
        <i>installation#</i>:
        {{ useContentStore().getCurrentTabStorage['tabsetsInstallationId' as keyof object] }}
      </div>
    </div>
    <div class="col-4 text-caption">tabReferences</div>
    <div class="col-8 text-caption ellipsis-3-lines" style="font-size: smaller">
      <template v-for="tr in useContentStore().getCurrentTabReferences">
        <span class="cursor-pointer text-blue-8" @click="infoDialog('Tab Reference ' + tr.type, tr)">
          <span v-if="tr.type === 'LINKING_DATA'">{{ tr.data['@type' as keyof object] }} (LD),&nbsp;</span>
          <span v-else>{{ tr.type }},&nbsp;</span>
        </span>
      </template>
    </div>
    <div class="col-4 text-caption">derived data</div>
    <div class="col-8 text-caption ellipsis-3-lines" style="font-size: smaller">
      {{ useContentStore().currentTabDerivedData }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { formatDistance } from 'date-fns'
import { QDialogOptions, useQuasar } from 'quasar'
import { useContentStore } from 'src/content/stores/contentStore'
import { TagInfo, TagType } from 'src/core/models/TagInfo'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useNavigationService } from 'src/core/services/NavigationService'
import { RefreshTabCommand } from 'src/tabsets/commands/RefreshTabCommand'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useTagsService } from 'src/tags/TagsService'
import { ref, watchEffect } from 'vue'

type Props = { inPopup?: boolean }
const props = withDefaults(defineProps<Props>(), { inPopup: false })

const $q = useQuasar()

const aiCategory = ref<string>('---')

watchEffect(() => {
  const tsCat = useContentStore().getCurrentTabStorage['tabsetsCategorization' as keyof object]
  if (tsCat) {
    const url = useContentStore().getCurrentTabUrl
    console.log('got tsCat', tsCat, url)
    const cat = tsCat[url as keyof object]
    console.log('got cat', cat)
    if (cat) {
      aiCategory.value = cat['category']
    }
  }
})

const infoDialog = (title: string, input: object) => {
  if (props.inPopup) {
    return
  }
  let message = JSON.stringify(input, null, 2)
  let externalLink: string | undefined = undefined
  if (title === 'Tab Reference LINKING_DATA') {
    message = JSON.stringify(input['data' as keyof object], null, 2)
    externalLink = 'https://json-ld.org/playground/#startTab=tab-table&json-ld=' + encodeURIComponent(message)
    // externalLink = chrome.runtime.getURL(`/www/index.html#/mainpanel/tab/${}?tab=linkedData`)
  }
  let dialogOptions: QDialogOptions = {
    title,
    message: '<pre style="font-size:12px">' + message + '<pre>',
    cancel: true,
    html: true,
  }
  if (externalLink) {
    dialogOptions.options = {
      type: 'checkbox',
      model: ['open'],
      // inline: true
      items: [{ label: 'Open', value: 'open', color: 'secondary' }],
    }
  }
  $q.dialog(dialogOptions).onOk((res: string[]) => {
    if (res.indexOf('open') >= 0 && externalLink) {
      useNavigationService().browserTabFor(externalLink)
    }
  })
}

const reloadCurrentTab = () => {
  chrome.tabs.query({ active: true, currentWindow: true }).then((tabs: chrome.tabs.Tab[]) => {
    console.log('got', tabs)
    if (tabs.length > 0) {
      useCommandExecutor().executeFromUi(new RefreshTabCommand(tabs[0]!.id!, tabs[0]!.url!))
    }
  })
}

const tagsWithType = (type: TagType) => {
  return useContentStore()
    .currentTabTags.filter((ti: TagInfo) => ti.type === type)
    .map((ti: TagInfo) => ti.label)
    .join(', ')
}
</script>
