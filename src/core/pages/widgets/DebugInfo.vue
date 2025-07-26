<template>
  <div class="row q-pa-none q-ma-none q-mt-lg fit boxed">
    <div class="col-12 text-caption text-bold">DEBUG</div>

    <div class="col-4 text-caption">title</div>
    <div class="col-8 text-caption ellipsis" style="font-size: smaller">
      {{ useContentStore().currentTabTitle }}
    </div>
    <div class="col-4 text-caption">last accessed</div>
    <div class="col-8 text-caption ellipsis" style="font-size: smaller">
      {{ date.formatDate(useContentStore().getCurrentTabLastAccessed, 'DD.MM.YYYY HH:MM') }}
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
    </div>

    <div class="col-4 text-caption">Tags</div>
    <div class="col-8 text-caption" style="font-size: smaller">
      {{ useContentStore().currentTabTags }}
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
      {{ tabReferences() }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { date, useQuasar } from 'quasar'
import { TabReference } from 'src/content/models/TabReference'
import { useContentStore } from 'src/content/stores/contentStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'

const $q = useQuasar()

const tabReferences = () => {
  const types = useContentStore().getCurrentTabReferences.map((tR: TabReference) => tR.type)
  return types.join(', ')
}

const infoDialog = (title: string, input: object) => {
  const message = JSON.stringify(input, null, 2)
  $q.dialog({
    title,
    message: '<pre>' + message + '<pre>',
    html: true,
  })
}
</script>
