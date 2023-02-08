<template>

  <div class="flex justify-center">

    <v-stage
      ref="stage"
      :config="configKonva">
      <v-layer>
        <v-rect :config="{x:0,y:0,height:65, width:35, stroke: 'grey', fill:'#efefef', strokeWidth:1}"/>
        <v-rect :config="{x:5,y:5,height:25, width:25, stroke: 'grey', fill:'white', strokeWidth:1}"/>
        <v-text @mouseover="handleMouseOver($event,'pointer')" @mouseout="handleMouseOut"
                @mousedown="addElement('text')"
                :config="{x:13, y:13, text: 'A'}"/>
        <v-rect @mouseover="handleMouseOver($event,'pointer')" @mouseout="handleMouseOut"
                :config="{x:5,y:35,height:25, width:25, stroke: 'gray', fill:'white',strokeWidth:1}"/>
        <v-line :config="{points: [10, 53,26, 40],
        stroke: 'black',
        strokeWidth: 2,
        lineCap: 'round',
        lineJoin: 'round'}"/>
      </v-layer>

      <v-layer ref="drawingLayer">
        <!--        <v-circle-->
        <!--          v-for="item in list"-->

        <!--          :config="{-->
        <!--            x : item.x, y: item.y, radius: 50, fill: 'red',-->
        <!--          }"></v-circle>-->
      </v-layer>

      <v-layer ref="urlsLayer">
        <v-group
          v-for="rec in urlElementGroups"
          :key="'node' + rec.id"
          @dragstart="handleDragstart"
          @dragend="handleDragend"
          @mouseover="handleMouseOver($event,'move')"
          @mouseout="handleMouseOut"
          :config="{ draggable: true, id:rec.id, x: rec.x, y: rec.y }">
          <v-rect
            :key="'node' + rec.id"
            :config="{
                          width: rec.width,
                          height: rec.height,
                          fill: 'rgb(255,255,255,100)',
                          stroke: 'grey',cornerRadius: 4,
                          strokeWidth: 1}"/>
          <v-text
            @mousedown="handleClick"
            @mouseover="handleMouseOver($event,'pointer')"
            @mouseout="handleMouseOut"
            :config="{id: rec.id, offsetX: -5, offsetY: -5, text: rec.name}"/>

          <v-image :config="{image: faviconFor(rec.id), offsetX: -5, offsetY: -18, height:25,width:25}"/>

        </v-group>
      </v-layer>

    </v-stage>
  </div>

</template>

<script setup lang="ts">
import _ from "lodash"
import {onMounted, ref} from "vue";
import {useTabsStore} from "stores/tabsStore";
import TabsetService from "src/services/TabsetService";
import NavigationService from "src/services/NavigationService";
import {useTabsetService} from "src/services/TabsetService2";
import {Tab} from "src/models/Tab";
import Konva from "konva";

const canvas = ref(null);
const stage = ref<any>(null);
const drawingLayer = ref<any>(null);
const tabsStore = useTabsStore()
const currentTabsetId = ref('')
const urlElementGroups = ref<object[]>([] as unknown as object[])
const dragItemId = ref<any>(null)
const images = ref<Map<string, any>>(new Map())
const list = ref([{x: 100, y: 100, radius: 50, fill: 'blue'}])

const configKonva = {
  width: window.innerWidth - 650,
  height: window.innerHeight - 400
}

const setupCanvas = (caller: string) => {


  let top = 0
  _.forEach(tabsStore.getCurrentTabs, t => {
    top += 60

    urlElementGroups.value.push({
      id: t.id,
      x: t.canvasLeft ? t.canvasLeft : 100,
      y: t.canvasTop ? t.canvasTop : top,
      width: 200,
      height: 50,
      name: t.chromeTab.title
    })

    const img = new window.Image();
    if (t.chromeTab.favIconUrl) {
      img.src = t.chromeTab.favIconUrl;
      img.onload = () => {
        images.value.set(t.id, img)
      };
    }


  })

  const layer = tabsStore.getCurrentTabset?.canvas || undefined
  if (layer) {
    const json = JSON.parse(layer)
    console.log("drawingLayer1", layer)
    console.log("drawingLayer2", json)
    console.log("drawingLayer3", drawingLayer.value.getNode())
    //drawingLayer.value = layer[0]
    //drawingLayer.value.getStage().add(layer[0])
    // drawingLayer.value.getNode().add([...layer])
    //Konva.Node.create(layer, drawingLayer)
    json.children.forEach((c: any) => {
      console.log("chidl", c)
      switch (c.className) {
        case "Text":
          const element = new Konva.Text(c.attrs)
          element.on('dblclick dbltap', () => {
            // create textarea over canvas with absolute position

            // first we need to find position for textarea
            // how to find it?

            // at first lets find position of text node relative to the stage:
            var textPosition = element.getAbsolutePosition();
            console.log("element", element, stage.value)
            // then lets find position of stage container on the page:
            var stageBox = stage.value.getNode().container().getBoundingClientRect();

            // so position of textarea will be the sum of positions above:
            var areaPosition = {
              x: stageBox.left + textPosition.x,
              y: stageBox.top + textPosition.y,
            };

            // create textarea and style it
            var textarea = document.createElement('textarea');
            document.body.appendChild(textarea);

            textarea.value = element.text();
            textarea.style.position = 'absolute';
            textarea.style.top = areaPosition.y + 'px';
            textarea.style.left = areaPosition.x + 'px';
            //textarea.style.width = element.width();

            textarea.focus();

            textarea.addEventListener('keydown', function (e) {
              // hide on enter
              if (e.keyCode === 13) {
                element.text(textarea.value);
                document.body.removeChild(textarea);
              }
            });
          })
          drawingLayer.value.getNode().add(element)
          break;
        default:
          console.log("unknown className in ", c)
      }
    })
  }
}

onMounted(() => setupCanvas('onMounted'))


const handleDragstart = (e: any) => {
  //console.log("handleDragstart", e.target.id(), e)
  dragItemId.value = e.target.id();
}

const handleDragend = (e: any) => {
  const left = e.target?.attrs['x']
  const top = e.target?.attrs['y']
  // // @ts-ignore
  TabsetService.setPosition(dragItemId.value, top || 0, left || 0)
  dragItemId.value = null;
}

const handleClick = (e: any) => {
  //console.log("handleClick", e.target.id(), e)
  const tabset = useTabsetService().getCurrentTabset()
  if (tabset) {
    const tab = _.find(tabset.tabs, (t: Tab) => t.id === e.target.id())
    if (tab) {
      NavigationService.openOrCreateTab(tab.chromeTab?.url || '')
    }
  }
}
const handleMouseOver = (e: any, style: string) => {
  if (stage.value) {
    const oldVal = stage.value.getNode().getContent().style['cursor']
    if ("pointer" !== oldVal) {
      stage.value.getNode().getContent().style['cursor'] = style
    }
  }
}

const handleMouseOut = (e: any) => {
  if (stage.value) {
    stage.value.getNode().getContent().style['cursor'] = 'default'
  }
}

const faviconFor = (t: string) => images.value.get(t)

const addElement = (type: string) => {
  switch (type) {
    case 'text':
      var simpleText = new Konva.Text({
        x: 200,
        y: 15,
        text: 'Simple Text',
        fontSize: 30,
        fontFamily: 'Calibri',
        fill: 'green',
        draggable: true
      });
      drawingLayer.value.getNode().add(simpleText)
      console.log("hier3", JSON.stringify(drawingLayer.value.getNode()))
      if (tabsStore.getCurrentTabset) {
        TabsetService.saveCanvasLayer(tabsStore.getCurrentTabset.id, drawingLayer.value.getNode())
      }
      break
    default:
      console.log("unknown identifier", type)
  }
}

</script>

<style lang="sass" scoped>


v-stage
  border: 10px solid #bfbfbf
  border-radius: 5px
</style>
