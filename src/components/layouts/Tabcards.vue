<template>


  <vue-draggable-next
    class="row items-start"
    :list="props.tabs"
    group="people"
    @change="log"
    :move="checkMove">
    <div
      class="col-xs-12 col-sm-4 col-md-3 col-lg-2 q-pa-xs"
      v-for="tab in props.tabs"
      :key="tab.id">
      <TabCardWidget :tab="tabAsTab(tab)"/>

    </div>
  </vue-draggable-next>


  <!--  <hr>-->

  <!--  <div class="row items-start">-->


  <!--    <div v-for="tab in props.tabs"-->
  <!--         :key="tab.id"-->
  <!--         draggable="true"-->
  <!--         @dragstart="startDrag($event, tab)"-->
  <!--         class="col-xs-12 col-sm-4 col-md-3 col-lg-2 q-pa-xs">-->

  <!--      <q-card class="my-card" flat bordered :style="cardStyle(tab)" @mouseover="setInfo(tab)" @click="selectTab(tab)">-->
  <!--        {{ loadThumbnail(tab) }}-->
  <!--        <q-card-section class="q-pt-xs cursor-pointer bg-primary text-white" style="width:100%;">-->
  <!--          <div class="row items-baseline">-->

  <!--            &lt;!&ndash; favicon &ndash;&gt;-->
  <!--            <div class="col-2">-->
  <!--              <q-img-->
  <!--                class="rounded-borders"-->
  <!--                width="24px"-->
  <!--                height="24px"-->
  <!--                :src="getFaviconUrl(tab.chromeTab)">-->
  <!--                <q-tooltip>{{ tab.chromeTab?.id }} / {{ tab.id }}</q-tooltip>-->
  <!--              </q-img>-->
  <!--            </div>-->

  <!--            &lt;!&ndash; title or name if given &ndash;&gt;-->
  <!--            <div class="col-10 text-subtitle1 ellipsis">-->
  <!--              {{ nameOrTitle(tab) }}-->
  <!--              <q-popup-edit :model-value="dynamicNameOrTitleModel(tab)" v-slot="scope"-->
  <!--                            @update:model-value="val => setCustomTitle( tab, val)">-->
  <!--                <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set"/>-->
  <!--              </q-popup-edit>-->
  <!--              <q-tooltip>{{ tab.chromeTab.title }}</q-tooltip>-->
  <!--            </div>-->

  <!--          </div>-->


  <!--          <div class="text-subtitle2 ellipsis text-secondary"-->
  <!--               @click.stop="Navigation.openOrCreateTab(tab.chromeTab?.url )">-->
  <!--            {{ getHost(tab.chromeTab?.url, true) }}-->
  <!--            <q-icon name="launch" color="secondary"></q-icon>-->
  <!--            <q-tooltip>-->
  <!--              {{ tab.chromeTab?.url }}-->
  <!--            </q-tooltip>-->
  <!--          </div>-->

  <!--        </q-card-section>-->

  <!--        <q-card-section class="q-ma-none q-pa-xs">-->

  <!--          <div class="row fit">-->
  <!--            <div class="col-6">-->
  <!--              <q-img :src="thumbnailFor(tab)" width="48px" height="32px" no-spinner-->
  <!--                     style="border:1px solid #efefef; border-right: 3px;"></q-img>-->
  <!--            </div>-->
  <!--            <div class="col-6 text-right">-->
  <!--              <q-btn flat round color="red" size="11px" icon="delete_outline" @click.stop="closeTab(tab)">-->
  <!--                <q-tooltip>Delete this tab from this list</q-tooltip>-->
  <!--              </q-btn>-->
  <!--            </div>-->
  <!--          </div>-->

  <!--        </q-card-section>-->

  <!--      </q-card>-->
  <!--    </div>-->
  <!--  </div>-->


</template>

<script setup lang="ts">
import {Tab} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {useNotificationsStore} from "src/stores/notificationsStore";
import {PropType, ref} from "vue";
import {VueDraggableNext} from 'vue-draggable-next'
import TabCardWidget from "src/components/widgets/TabCardWidget.vue"

const props = defineProps({
  tabs: {
    type: Array as PropType<Array<Tab>>,
    required: true
  },
  showActions: {
    type: Boolean,
    default: false
  }
})

const emits = defineEmits(['sendCaption'])

const thumbnails = ref<Map<string, string>>(new Map())
const tabAsTab = (tab: Tab): Tab => tab as unknown as Tab

const thumbnailFor = (tab: Tab): string => {
  const key = btoa(tab.chromeTab.url || '')
  return thumbnails.value.get(key) || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII="
  //return "https://placeimg.com/500/300/nature"
}

const loadThumbnail = (tab: Tab) => {
  TabsetService.getThumbnailFor(tab)
    .then(data => {
      //console.log("loading tn for ", tab.chromeTab.url)
      const key = btoa(tab.chromeTab.url || '')
      if (data && data.thumbnail) {
        //console.log("found key", key, data)
        thumbnails.value.set(key, data.thumbnail)
      }
    })
    .catch(err => console.log("err", err))
}


const selectTab = (tab: Tab) => {
  //console.log("tab selected", tab)
  TabsetService.setOnlySelectedTab(tab)
  const notificationStore = useNotificationsStore()
  notificationStore.setSelectedTab(tab)
}

const setCustomTitle = (tab: Tab, newValue: string) => {
  console.log(" -> ", newValue)
  TabsetService.setCustomTitle(tab, newValue)
}

const getFaviconUrl = (chromeTab: chrome.tabs.Tab | undefined) => {
  if (chromeTab && chromeTab.favIconUrl && !chromeTab.favIconUrl.startsWith("chrome")) {
    //console.log("chromeTab.favIconUrl", chromeTab.favIconUrl)
    return chromeTab.favIconUrl
  }
  return ''
}

const nameOrTitle = (tab: Tab) => tab.name ? tab.name : tab.chromeTab?.title
const dynamicNameOrTitleModel = (tab: Tab) => tab.name ? tab.name : tab.chromeTab?.title

const startDrag = (evt: DragEvent, tab: Tab) => {
  //console.log("drag started", evt, tab.id)
  if (evt.dataTransfer) {
    evt.dataTransfer.dropEffect = 'move'
    evt.dataTransfer.effectAllowed = 'move'
    evt.dataTransfer.setData('text/plain', tab.id)
  }
}

const log = (event: any) => {
  console.log("egent", event)
  const {moved, added} = event
  if (moved) {
    console.log('moved', moved.newIndex, moved)
    TabsetService.moveTo(moved.element.id, moved.newIndex)
  }
  if (added) {
    console.log('added', added, added.element)
    TabsetService.saveToCurrentTabset(added.element, added.newIndex)
  }
}

const add = () => {
  console.log('add')
}
const replace = () => {
  console.log('replace')
}
const checkMove = (event: any) => {
  //console.log('checkMove', event.draggedContext)
  //console.log('Future index: ' + event.draggedContext.futureIndex)
}


</script>

<style lang="sass" scoped>
.my-card
  width: 100%
</style>
