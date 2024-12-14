<template>
  <!-- TabsAsTree -->

  <div class="row q-mt-xs">
    <div class="col-12 q-mb-xs">
      <q-input
        dense
        autofocus
        ref="filterRef"
        filled
        v-model="filter"
        label="Filter Urls">
        <template v-slot:append>
          <q-icon v-if="filter !== ''" name="clear" class="cursor-pointer" @click="resetFilter"/>
        </template>
      </q-input>
    </div>
  </div>

  <q-tree v-if="!loading"
          :nodes="tabNodes"
          node-key="id"
          :filter="filter"
          :filter-method="filterMethod"
          selected-color="dark"
          @mouseenter="entered(true)"
          @mouseleave="entered(false)"
          v-model:selected="selected">

    <template v-slot:default-header="prop">

      <q-img v-if="prop.node.header === 'root'"
             class="rounded-borders q-mr-sm"
             width="20px"
             height="20px"
             :src="getFaviconUrl(prop.node)">
      </q-img>

      <q-icon v-else name="o_folder" class="q-mr-sm"/>

      <Highlighter class="cursor-pointer fit no-wrap my-highlight"
                   :highlightStyle="{backgroundColor:'yellow'}"
                   :searchWords="[filter]"
                   :autoEscape="true"
                   :textToHighlight="prop.node.label"/>
    </template>
  </q-tree>
  <q-spinner v-else></q-spinner>

</template>

<script setup lang="ts">

import {ref, watch, watchEffect} from "vue";
import {uid, useQuasar} from "quasar";
import {useBookmarksStore} from "src/bookmarks/stores/bookmarksStore";
import NavigationService from "src/services/NavigationService";
import _ from "lodash"
import {TreeNode} from "src/bookmarks/models/Tree";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import Highlighter from 'vue-highlight-words'
import {useSettingsStore} from "stores/settingsStore";
import {useUtils} from "src/core/services/Utils";
import {Tab} from "src/tabsets/models/Tab";

const {favIconFromUrl} = useUtils()

const $q = useQuasar();

const mouseHover = ref(false)
const selected = ref('')
const deleteButtonId = ref('')
const nodesToUrl = ref<Map<string, string>>(new Map())
const bookmarksPermissionGranted = ref<boolean | undefined>(undefined)
const filterRef = ref(null)
const filter = ref('')
const loading = ref(true)

const tabNodes = ref([])

function createNodes(tabs: object[], level = 0): TreeNode[] {
  //console.log("---creating nodes", tabs.length, level)
  const nodes: TreeNode[] = []

  const levelIdents = new Map<string, object>()
  for (const e of tabs) {
    const segments = e['segments' as keyof object] as string[]
    if (segments && segments.length > level) {
      const name = segments[level]
      //console.log("got name", name)
      levelIdents.set(name!, e)
    }
  }

  for (const name of _.sortBy([...levelIdents.keys()], (k:any) => k)) {
    //console.log("name", name, level)
    const t: object = levelIdents.get(name) || {}
    const filteredTabs:object[] = _.filter(tabs, (t:object) => {
      const segments = t['segments' as keyof object] as string[]
      //console.log("checking", segments.length, level, segments[level], name)
      return (segments && segments.length > level + 1 && segments[level] === name)
    })
    const children: TreeNode[] = createNodes(filteredTabs, level + 1)
    // console.log("calculated children", children.length)
    const newNodeId = uid()
    let url: string = t['protocol' as keyof object] + "//" + t['hostname' as keyof object]
    for (let i = 1; i <= level; i++) {
      url += "/" + t['segments' as keyof object][i]
    }
    children.length === 0 ?
      nodesToUrl.value.set(newNodeId, t['url' as keyof object]) :
      nodesToUrl.value.set(newNodeId, url)
    const newNode = new TreeNode(newNodeId, name as string, name as string, url, "", children, level)
    nodes.push(newNode)
  }
  return nodes
}

watchEffect(() => {
  loading.value = true
  const tabs: object[] = []
  for (const ts of useTabsetsStore().tabsets.values()) {
    for (const t of ts.tabs) {
      if (t.url) {
        try {
          const url = new URL(t.url)
          const segments: string[] = []
          segments.push(url.host.replace("www.", ""))
          const splits = _.filter(url.pathname.split("/"), (e:string) => e.trim().length > 0)
          segments.push(...(splits))
          tabs.push({
            protocol: url.protocol,
            hostname: url.hostname,
            url: t.url,
            name: t.name,
            title: t.title,
            segments: segments
          })
        } catch (err) {
        }
      }
    }
  }
  const nodes = createNodes(tabs, 0);
  tabNodes.value = JSON.parse(JSON.stringify(nodes))
  // console.log("v", tabNodes.value)
  loading.value = false
})

watchEffect(() => {
  console.log("loading", loading.value)
})

watchEffect(() => {
  bookmarksPermissionGranted.value = true// useFeaturesStore().hasFeature(FeatureIdent.BOOKMARKS)
  useBookmarksStore().loadBookmarks()
})

watch(() => selected.value, (currentValue, oldValue) => {
  if (currentValue !== oldValue) {
    const found = nodesToUrl.value.get(currentValue)
    console.log("found", found)
    if (found) {
      NavigationService.openOrCreateTab([found])
    }
  }
})

watchEffect(() => {
  deleteButtonId.value = selected.value
})

$q.loadingBar.setDefaults({
  color: 'positive',
  size: '10px',
  position: 'bottom'
})

const resetFilter = () => {
  filter.value = ''
  if (filterRef.value) {
    // @ts-ignore
    filterRef.value.focus()
  }
}

const filterMethod = (node: TreeNode, filter: any): boolean =>
  (node.url !== undefined) && (node.url.toLowerCase().indexOf(filter.toLowerCase()) > -1)


const entered = (b: boolean) => mouseHover.value = b

const getFaviconUrl = (n: TreeNode) => {
  // if (!useSettingsStore().isEnabled('noDDG')) {
  let theUrl = n.url || ''
  //   let theRealUrl
  //   try {
  //     theRealUrl = new URL(theUrl)
  //   } catch (err) {
  //     if (!theUrl.startsWith('http')) {
  //       theUrl = 'https://' + theUrl
  //       try {
  //         theRealUrl = new URL(theUrl)
  //       } catch (err) {
  //       }
  //     }
  //   }
  //   return theRealUrl ? "https://icons.duckduckgo.com/ip3/" + theRealUrl.hostname + ".ico" : 'favicon-unknown-32x32.png'
  //}

    //const chromeTab = tab?.chromeTab
    if (theUrl.startsWith("chrome")) {
      return ''
    }
    if (!useSettingsStore().isEnabled('noDDG')) {
      return favIconFromUrl(theUrl)
    }
    return ''
}
</script>

<style lang="sass" scoped>
.drop-zone
  background-color: #eee
  margin-bottom: 10px
  padding: 10px

.v-enter-active,
.v-leave-active
  transition: opacity 0.5s ease

.v-enter-from,
.v-leave-to
  opacity: 0

</style>
