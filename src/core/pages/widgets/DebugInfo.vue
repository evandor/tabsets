<template>
  <div class="row q-pa-none q-ma-none q-mt-lg fit boxed">
    <div class="col-12 text-caption text-bold">DEBUG</div>

    <div class="col-4 text-caption">title</div>
    <div class="col-8 text-caption ellipsis" style="font-size: smaller">
      {{ useContentStore().currentTabTitle }}
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
      {{
        useContentStore()
          .currentTabTags.map((ti: TagInfo) => ti.label + '(' + ti.type + ')')
          .join(', ')
      }}
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
      <div class="ellipsis">
        {{ useContentStore().getCurrentTabStorage['tabsetsManaged' as keyof object] }}
      </div>
      <div class="ellipsis">
        annotations:
        {{ (useContentStore().getCurrentTabStorage['tabsetsAnnotations' as keyof object] as object[])?.length || 0 }}
      </div>
    </div>
    <div class="col-4 text-caption">tabReferences</div>
    <div class="col-8 text-caption ellipsis-3-lines" style="font-size: smaller">
      <template v-for="tr in useContentStore().getCurrentTabReferences">
        <span class="cursor-pointer text-blue-8" @click="infoDialog('Tab Reference ' + tr.type, tr)"
          >{{ tr.type }},
        </span>
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import { formatDistance } from 'date-fns'
import { QDialogOptions, useQuasar } from 'quasar'
import { useContentStore } from 'src/content/stores/contentStore'
import { TagInfo } from 'src/core/models/TagInfo'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useNavigationService } from 'src/core/services/NavigationService'
import { RefreshTabCommand } from 'src/tabsets/commands/RefreshTabCommand'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'

const $q = useQuasar()

const infoDialog = (title: string, input: object) => {
  let message = JSON.stringify(input, null, 2)
  let externalLink: string | undefined = undefined
  if (title === 'Tab Reference LINKING_DATA') {
    message = JSON.stringify(input['data' as keyof object], null, 2)
    externalLink = 'https://json-ld.org/playground/#startTab=tab-table&json-ld=' + encodeURIComponent(message)
  }
  let dialogOptions: QDialogOptions = {
    title,
    message: '<pre>' + message + '<pre>',
    cancel: true,
    html: true,
  }
  if (externalLink) {
    dialogOptions.options = {
      type: 'checkbox',
      model: [],
      // inline: true
      items: [{ label: 'Open', value: 'open', color: 'secondary' }],
    }
  }
  $q.dialog(dialogOptions).onOk((res: string[]) => {
    console.log('res', res)
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
</script>
