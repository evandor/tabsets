<template>

  <div class="q-pa-sm">
    <q-table
      dense
      :rows="tableRows"
      :columns="columns"
      :pagination="initialPagination"
      row-key="name">

      <template v-slot:header="props">
        <q-tr :props="props">
          <q-th auto-width/>
          <q-th
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
            class="ellipsis">
            {{ col.label }}
          </q-th>
        </q-tr>
      </template>

      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td auto-width>
            <!--            <q-btn size="sm" color="accent" round dense @click="props.expand = !props.expand" :icon="props.expand ? 'remove' : 'add'" />-->
            <q-img
              class="rounded-borders" style="cursor: move"
              width="20px"
              height="20px"
              :src="getFaviconUrl(props.row['favIconUrl'])">
            </q-img>
          </q-td>
          <q-td
            key="url"
            :props="props"
            class="ellipsis">
            <div class="text-subtitle1 ellipsis"> {{ props.row.name }}</div>
            <div>{{ props.row.url }}</div>
          </q-td>
          <!--          <q-td-->
          <!--            v-for="col in props.cols"-->
          <!--            :key="col.name"-->
          <!--            :props="props"-->
          <!--            class="ellipsis">-->
          <!--            {{ col.value }}-->
          <!--          </q-td>-->
        </q-tr>
        <q-tr v-show="props.expand" :props="props">
          <q-td colspan="100%">
            <div class="text-left">This is expand slot for row above: {{ props.row.name }}.</div>
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>

</template>

<script setup lang="ts">
import {Tab} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {PropType, ref, watchEffect} from "vue";
import {VueDraggableNext} from 'vue-draggable-next'
import {useQuasar} from "quasar";
import _ from "lodash"
import {useTabsStore} from "src/stores/tabsStore";
import {useUiService} from "src/services/useUiService";
import {LeftDrawerState, DrawerTabs, useUiStore} from "src/stores/uiStore";
import {useTabsetService} from "src/services/TabsetService2";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {CreateTabFromOpenTabsCommand} from "src/domain/commands/CreateTabFromOpenTabs";
import TabListElementWidget from "src/components/widgets/TabListElementWidget.vue";
import {useUtils} from "src/services/Utils"

const {inBexMode} = useUtils()

const $q = useQuasar()
const tabsStore = useTabsStore()
const uiService = useUiService()

const {saveCurrentTabset} = useTabsetService()

const props = defineProps({
  tabs: {
    type: Array as PropType<Array<Tab>>,
    required: true
  },
  group: {
    type: String,
    required: true
  },
  highlightUrl: {
    type: String,
    required: false
  }
})

const tableRows = ref<any[]>([])

const columns = [
  {
    name: 'name',
    required: true,
    label: 'Title',
    align: 'left',
    field: (row: any) => row.name,
    format: (val: any) => `${val}`,
    sortable: true
  },
  {name: 'url', align: 'left', label: 'Title & Url', field: 'url', sortable: true},

  {name: 'iron', label: 'Iron (%)', field: 'iron', sortable: true, sort: (a, b) => parseInt(a, 10) - parseInt(b, 10)}
]

watchEffect(() => {
  console.log("watched", props.tabs)
  tableRows.value = _.map(props.tabs, t => {
    return {
      name: t.chromeTab.title,
      url: t.chromeTab.url,
      favIconUrl: t.chromeTab.favIconUrl,
      iron: '1%'
    }
  })
})

// const rows: any[] = _.map(props.tabs, t => {
//   return {
//     name: t.chromeTab.title,
//     url: t.chromeTab.url,
//     favIconUrl: t.chromeTab.favIconUrl,
//     iron: '1%'
//   }
// })

const initialPagination = {
  sortBy: 'name',
  descending: false,
  page: 1,
  rowsPerPage: 20
}
const getFaviconUrl = (url: string) => {
  if (!url) {
    return 'favicon-unknown-32x32.png'
  }
  return url
}

const thumbnails = ref<Map<string, string>>(new Map())
const tabAsTab = (tab: Tab): Tab => tab as unknown as Tab

const showButtonsProp = ref<Map<string, boolean>>(new Map())

const showButtons = (tabId: string, show: boolean) => showButtonsProp.value.set(tabId, show)

function adjustIndex(element: any, tabs: Tab[]) {
  //console.log("filtered", tabs)
  if (element.newIndex === 0) { // first element
    //console.log(" 0 - searching for ", tabs[0].id)
    return _.findIndex(tabsStore.getCurrentTabs, t => t.id === tabs[0].id)
  } else {
    //console.log(" 1 - searching for ", tabs[element.newIndex - 1].id)
    return 1 + _.findIndex(tabsStore.getCurrentTabs, t => t.id === tabs[element.newIndex - 1].id)
  }
}


const openOrShowOpenTabs = () => {
  // const activeTab = uiService.leftDrawerActiveTab()
  const drawerModel = uiService.drawerModel()
  if (drawerModel.state === LeftDrawerState.SMALL || drawerModel.activeTab !== DrawerTabs.OPEN_TABS) {
    uiService.leftDrawerSetActiveTab(DrawerTabs.OPEN_TABS)
  } else {
    uiService.leftDrawerAnimateLabel()
  }
  // useUiService().setWideDrawer()
}


</script>

<style lang="sass" scoped>
.my-card
  width: 100%
</style>
