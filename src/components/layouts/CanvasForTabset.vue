<template>

  <div class="row q-ma-none q-pa-none" style="border:1px dotted #bfbfbf">
    <div class="col-1 bg-white">
      <div>
        <q-btn flat icon="maximize" on-click="addLine()" />
      </div>
      <div>
        <q-btn flat icon="o_stop" />
      </div>
      <div>
        <q-btn flat icon="text_fields" />
      </div>
    </div>
    <div class="col-8 q-ma-none q-pa-none">
      <div id="idraw" ref="mount" class="q-ma-none q-pa-none"></div>
    </div>
    <div class="col-3 bg-white q-pa-sm" style="border-left: 1px solid #bfbfbf">
      <PanelTabListElementWidget
          v-if="selectedTab"
          :key="'cft__' + selectedTab.id"
          :hideMenu="true"
          :preventDragAndDrop="true"
          :tab="selectedTab"
      />
    </div>
  </div>

</template>

<script setup lang="ts">
import iDraw from 'idraw';
import {ref, onMounted, watchEffect} from 'vue'
import {useRoute} from "vue-router";
import {useTabsetService} from "src/services/TabsetService2";
import {Tabset} from "src/models/Tabset";
import EditorJS, {OutputData} from "@editorjs/editorjs";
import EditorJsConfig from "src/utils/EditorJsConfig";
import {useTabsStore} from "stores/tabsStore";
import tabsetService from "src/services/TabsetService";
import {Tab} from "src/models/Tab";
import PanelTabListElementWidget from "components/widgets/PanelTabListElementWidget.vue";

const route = useRoute()

const mount = ref();
let idraw: any = undefined;
const tabsetId = ref<string | undefined>(route.query.tsId as string)
const tabset = ref<Tabset | undefined>(undefined)
const selectedTab = ref<Tab | undefined>(undefined)
const selectedTabsetId = ref<string | undefined>(undefined)

onMounted(() => {
  console.log("mounting...")

  const options = {
    width: 800,
    height: 400,
    contextWidth: 800,
    contextHeight: 400,
    devicePixelRatio: 4,
    onlyRender: true
  }
  const config = {
    scrollWrapper: {
      use: true,
      width: 16,
      color: '#666666',
    },
    elementWrapper: {
      color: '#e91e63',
      controllerSize: 8,
      lineWidth: 1,
      lineDash: [12, 12],
    },
  }

  idraw = new iDraw(mount.value, options, config)
  if (tabset.value) {
    let offset = 20
    for (const t of tabset.value.tabs) {
      console.log("adding", t)
      let y = offset
      if (t.canvasTop) {
        y = t.canvasTop
      } else {
        offset += 40
      }
      const element = {
        name: "tab-" + t.id,
        uuid: t.id,
        x: t.canvasLeft || 40,
        y: y,
        w: t.canvasWidth || 180,
        h: t.canvasHeight || 28,
        type: "text",
        desc: {
          text: t.name || t.title,
          color: "#3f51b5",
          fontSize: 14,
          textAlign: 'center',
          borderRadius: 5,
          borderWidth: 2,
          borderColor: "#3f51b5",
        },
      }
      const e = idraw.addElement(element)
      console.log("e", element)
    }
  }

  idraw.on('changeData', (e: any) => {
    //console.log('changeData: event = ', e);
    let tabId = undefined
    if (selectedTab.value) {
      for (const element of e.elements) {
        if (element.name === "tab-" + selectedTab.value?.id) {
          console.log("found", element)
          selectedTab.value.canvasTop = element.y
          selectedTab.value.canvasLeft = element.x
          selectedTab.value.canvasHeight = element.h
          selectedTab.value.canvasWidth = element.w

         // console.log("selectedTab", selectedTab)

          // assuming we are in the "current tabset"
          useTabsetService().saveCurrentTabset()
        }
      }


    }
  });

  idraw.on('screenSelectElement', (e: any) => {
    //console.log('screenSelectElement: event = ', e.element);
    const tabId = e.element.name.replace("tab-", "")
    useTabsStore().getTab(tabId)
        .then((tabData: any) => {
          if (tabData) {
            selectedTab.value = tabData.tab
            selectedTabsetId.value = tabData.tabsetId
          }
        })

  });
})

watchEffect(() => {
  tabsetId.value = route.params.tabsetId as string
  if (tabsetId.value) {
    //console.log("got tabset id", tabsetId.value)
    tabset.value = useTabsetService().getTabset(tabsetId.value) as Tabset | undefined
    useTabsStore().selectCurrentTabset(tabsetId.value)
  }
})
</script>

<style>
#idraw {
  margin-top: 0px;
  text-align: center;
}

#idraw canvas {
  border-right: 1px solid #aaaaaa00;
  border-bottom: 1px solid #aaaaaa00;
  background-image: linear-gradient(#aaaaaa00 1px, transparent 0),
  linear-gradient(90deg, #aaaaaa00 1px, transparent 0),
  linear-gradient(#aaaaaa00 1px, transparent 0),
  linear-gradient(90deg, #aaaaaa00 1px, transparent 0);
  background-size: 10px 10px, 10px 10px, 50px 50px, 50px 50px;
}
</style>