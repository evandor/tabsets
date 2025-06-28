<template>
  <q-page style="padding-top: 50px">
    <div class="q-mt-md q-ma-none q-pa-none">
      <InfoMessageWidget
        :probability="1"
        ident="sidePanelTagsListViewer_overview"
        hint="Tabs you add are being tagged automatically (or you can tag them
            yourself). This is a list of the most often used tags." />
    </div>

    <div class="row q-ma-none q-pa-none">
      <div class="col-12 q-ma-none q-pa-none q-pb-md">
        <q-tabs
          v-model="tab"
          dense
          class="text-grey q-ma-none q-pa-none"
          active-color="primary"
          indicator-color="primary"
          align="left"
          narrow-indicator>
          <q-tab name="list" label="As List" />
          <q-tab name="cloud" label="As Word Cloud" />
        </q-tabs>

        <q-tab-panels v-model="tab" animated>
          <q-tab-panel class="q-ma-none q-pa-none" name="list">
            <TagsListViewerWidget :tags="tags" @tagSelected="(value: string) => selectTag(value)" />
          </q-tab-panel>
          <q-tab-panel class="q-ma-none q-pa-none" name="cloud">
            <!--            <Bar id="my-chart-id" :options="{                    responsive: true                  }"-->
            <!--                 :data="{                    labels: [ 'January', 'February', 'March' ],                    datasets: [ { data: [40, 20, 12] } ]                  }"/>-->

            <div style="width: 100%; height: 500px">
              <canvas ref="myCanvas" style="width: 100%; height: 500px"></canvas>
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </div>
    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">
      <ViewToolbarHelper title="Tags List" />
    </q-page-sticky>
  </q-page>
</template>

<script lang="ts" setup>
import { Chart, LinearScale } from 'chart.js'
import { WordCloudController, WordElement } from 'chartjs-chart-wordcloud'
import _ from 'lodash'
import { SidePanelViews } from 'src/app/models/SidePanelViews'
import ViewToolbarHelper from 'src/core/pages/sidepanel/helper/ViewToolbarHelper.vue'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset, TabsetStatus, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import TagsListViewerWidget from 'src/tabsets/widgets/TagsListViewerWidget.vue'
import { useUiStore } from 'src/ui/stores/uiStore'
import InfoMessageWidget from 'src/ui/widgets/InfoMessageWidget.vue'
import { ref, watchEffect } from 'vue'

Chart.register(WordCloudController, WordElement, LinearScale)

let myCanvas = ref<HTMLCanvasElement>(null as unknown as HTMLCanvasElement)

const tab = ref('list')

const selectTag = (tag: string) => {
  console.log('selecting', tag)
  useUiStore().setSelectedTag(tag)
  useUiStore().sidePanelSetActiveView(SidePanelViews.TAG)
}

const tags = ref<Map<string, number>>(new Map())
const wordCloud = ref<Map<string, number>>(new Map())

watchEffect(() => {
  console.log('calculating tags')
  let t = new Map<string, number>()
  let max = 0
  _.forEach([...useTabsetsStore().tabsets.values()] as Tabset[], (tabset: Tabset) => {
    if (
      tabset.type === TabsetType.DEFAULT &&
      (tabset.status === TabsetStatus.DEFAULT || tabset.status === TabsetStatus.FAVORITE)
    ) {
      _.forEach(tabset.tabs, (tab: Tab) => {
        _.forEach(tab.tags, (tag: string) => {
          const newCount = (t.get(tag) || 0) + 1
          t.set(tag, newCount)
          if (newCount > max) {
            max = newCount
          }
        })
      })
    }
  })
  t = new Map([...t.entries()].sort((a, b) => b[1] - a[1]))
  tags.value = t
  // console.log("tags", t)

  const sliced: [string, number][] = Array.from(t).slice(0, 100)
  const limitedMap = new Map<string, number>()
  sliced.forEach(([s, n]: [string, number]) => {
    limitedMap.set(s, Math.round((12 * n) / max))
  })
  console.log('tags', limitedMap)
  wordCloud.value = limitedMap
})

watchEffect(() => {
  if (myCanvas.value && wordCloud.value) {
    const words: { key: string; value: number }[] = []
    for (let [key, value] of wordCloud.value) {
      words.push({ key, value })
    }
    // console.log("heier", words.map((d) => d.key))
    // console.log("heier", words.map((d) => 10 + d.value * 2))
    // const ctx = document.getElementById("myCanvas")
    // console.log("ctx", ctx)
    const chart = new Chart(myCanvas.value, {
      type: 'wordCloud',
      data: {
        labels: words.map((d) => d.key),
        datasets: [
          {
            label: '',
            data: words.map((d) => 10 + d.value * 2),
          },
        ],
      },
      options: {
        responsive: false,
        events: ['click'],
        onClick: (e, b) => {
          selectTag(b[0]!.element['text' as keyof object])
        },
        elements: {
          word: {
            strokeStyle: 'white',
            strokeWidth: 2,
            fontSize: 5,
          },
        },
      },
    })
  }
})
</script>
