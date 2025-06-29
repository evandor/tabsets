<template>
  <q-list>
    <q-item clickable v-ripple v-for="[host, val] in groupedTabs" @click="showByDomainPage(host)">
      <q-item-section>
        <q-item-label overline>{{ host }}</q-item-label>
        <q-item-label caption>{{ captionFor(val) }}</q-item-label>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script lang="ts" setup>
import _ from 'lodash'
import Analytics from 'src/core/utils/google-analytics'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset, TabsetStatus } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { onMounted, ref, watchEffect } from 'vue'

const emit = defineEmits(['domainSelected'])

const groupedTabs = ref<Map<string, Tab[]>>(new Map())

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelByDomainList', document.location.href)
})

watchEffect(() => {
  console.log('checkin tabs....')
  const allTabs: Tab[] = _.orderBy(
    _.filter(
      _.flatMap(
        _.filter(
          _.map([...useTabsetsStore().tabsets.values()] as Tabset[], (ts: Tabset) => ts),
          (ts: Tabset) => ts.status === TabsetStatus.DEFAULT || ts.status === TabsetStatus.FAVORITE,
        ),
        (ts: Tabset) => ts.tabs,
      ),
      (t: Tab) => true,
    ),
    (t: Tab) => t.activatedCount,
    ['desc'],
  )
  const r =
    //_.orderBy(

    _.groupBy(allTabs, (t: Tab) => {
      if (t.url) {
        try {
          const hostname = new URL(t.url).hostname
          const splits = hostname.split('.')
          switch (splits.length) {
            case 3:
              return hostname.substring(1 + hostname.indexOf('.'))
            default:
              return hostname
          }
        } catch (e) {
          return 'bad url'
        }
      } else {
        return 'unknown url'
      }
    })

  const sortedMap = new Map<string, Tab[]>()
  for (let i in r) {
    sortedMap.set(i, r[i]!)
  }
  const map3 = new Map([...sortedMap.entries()].sort((a, b) => b[1].length - a[1].length))
  //groupedTabs.value = new Map([...map3.entries()].filter((a) => a[1].length > 1))
  groupedTabs.value = map3
})

const captionFor = (t: any[]) => t.length + ' tab(s)'

const showByDomainPage = (host: string) => {
  console.log('clicked', host)
  //router.push("/sidepanel/bydomain/" + btoa(host))
  emit('domainSelected', host)
}
</script>
