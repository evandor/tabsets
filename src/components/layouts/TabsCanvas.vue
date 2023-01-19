<template>

  <div class="flex justify-center">


    <v-stage
      ref="stage"
      :config="configKonva"
      @dragstart="handleDragstart"
      @dragend="handleDragend"
    >
      <v-layer ref="layer">
        <!--        <v-circle :config="configCircle"></v-circle>-->
        <!--        <v-circle :config="configCircle2"></v-circle>-->
        <v-circle v-for="item in urlElements"
                  :key="item.id"
                  :config="{
                        x: 100,
                        y: item.y,
                        radius: item.radius,
                        fill: 'green',
                      stroke: 'black',
                      strokeWidth: 4,
                      draggable: true
        }">
        </v-circle>
      </v-layer>
    </v-stage>

    <canvas id="canvas" ref="canvas" width="500" height="500" :key="'canvas_' + tabsStore.currentTabsetId"/>
  </div>

</template>

<script setup lang="ts">
import {fabric} from "fabric"
import _ from "lodash"
import {onMounted, ref, watch, watchEffect} from "vue";
import {useTabsStore} from "stores/tabsStore";
import TabsetService from "src/services/TabsetService";

const canvas = ref(null);
const tabsStore = useTabsStore()
const currentTabsetId = ref('')
let c = null as unknown as fabric.Canvas
const urlElements = ref<object[]>([] as unknown as object[])

const configKonva = {
  width: 400,
  height: 400
}
const configCircle = {
  x: 100,
  y: 100,
  radius: 70,
  fill: "red",
  stroke: "black",
  strokeWidth: 4
}
const configCircle2 = {
  x: 100,
  y: 40,
  radius: 30,
  fill: "red",
  stroke: "black",
  strokeWidth: 4
}

const setupCanvas = (caller: string) => {
  // console.log("setting up canvas", tabsStore.currentTabsetId, caller)
  // console.log("setting up canvas2", tabsStore.currentTabsetId, window.document?.getElementById('canvas'))
  window.document?.getElementById('canvas')?.setAttribute("width", (window.innerWidth - 650).toString())
  window.document?.getElementById('canvas')?.setAttribute("height", (window.innerHeight - 150).toString())

  if (c) {
    console.log("clearing c")
    c.clear()
  }

  c = new fabric.Canvas(canvas.value, {
    isDrawingMode: false
  })
  // console.log("c is", c)

  c.on('mouse:up', function (options) {
    // @ts-ignore
    if (options.transform && options.transform.target.data) {
      const left = options.target?.left
      const top = options.target?.top
      // @ts-ignore
      TabsetService.setPosition(options.transform.target.data, top || 0, left || 0)
    }
  });


  let top = 0
  _.forEach(tabsStore.getCurrentTabs, t => {
    top += 60

    urlElements.value.push({
      id: t.id,
      x: 100,
      y: top,
      radius: 30,
      fill: "red",
      stroke: "black",
      strokeWidth: 2,
      draggable: true
    })
    //console.log("got", t)
    var grp = new fabric.Group(
      [
        new fabric.Rect({
          top: t.canvasTop ? t.canvasTop : top,
          left: t.canvasLeft ? t.canvasLeft : 100,
          width: 200,
          height: 50,
          fill: '#efefef',
          strokeWidth: 2,
          stroke: 'rgba(200,200,200,0.5)'
        })
      ], {data: t.id}
    )
    fabric.Image.fromURL(t.chromeTab.favIconUrl || '', (img) => {
      img.set({left: -95, top: -30, angle: 0, width: 24, height: 24, data: t.id})
      img.on('mouse:click', function () {
        console.log('selected a rectangle', img);
      });
      grp.add(img)
      grp.add(new fabric.Text(t.chromeTab.url?.replace("https://", "").replace("http://", "") || '?',
        {left: -95, top: 0, fontSize: 12, fontFamily: 'Roboto'}))
      c.add(
        grp
      );
    })

  })
}

onMounted(() => setupCanvas('onMounted'))

const handleDragstart = (e: any) => {
  // save drag element:
  console.log("handleDragstart", e)
  // this.dragItemId = e.target.id();
  // // move current element to the top:
  // const item = this.list.find(i => i.id === this.dragItemId);
  // const index = this.list.indexOf(item);
  // this.list.splice(index, 1);
  // this.list.push(item);
}

const handleDragend = (e: any) => {
  console.log("handleDragend", e)
//  this.dragItemId = null;
}

</script>

<style lang="sass" scoped>
.fabric
  height: 500px

canvas
  border: 1px solid #bfbfbf
  border-radius: 5px
</style>
