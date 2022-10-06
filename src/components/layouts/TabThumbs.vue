<!--<template>-->

<!--  <div class="row items-start">-->
<!--    <div class="col-xs-12 col-sm-4 col-md-3 col-lg-2 q-pa-xs" v-for="tab in props.tabs">-->

<!--      <q-card class="my-card" flat bordered :style="cardStyle(tab)" @mouseover="setInfo(tab)" @click="selectTab(tab)">-->
<!--        <q-card-section horizontal>-->
<!--          <q-card-section class="q-pt-xs cursor-pointer" style="width:100%;">-->
<!--            <div class="row items-baseline">-->
<!--              <div class="col-9">-->

<!--                <tab-thumb :tab="tab" />-->

<!--              </div>-->
<!--              <div class="col-2 text-body2 ellipsis">-->
<!--                {{nameOrTitle(tab)}}-->
<!--                <q-popup-edit :model-value="dynamicNameOrTitleModel(tab)" v-slot="scope"-->
<!--                              @update:model-value="val => setCustomTitle( tab, val)">-->
<!--                  <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set" />-->
<!--                </q-popup-edit>-->
<!--              </div>-->
<!--              <div class="col-1">-->
<!--                <q-icon name="close" @click.stop="closeTab(tab)"/>-->
<!--              </div>-->
<!--              <q-tooltip>-->
<!--                {{ tab.chromeTab?.title }}-->
<!--              </q-tooltip>-->
<!--            </div>-->

<!--            <div class="text-overline ellipsis">-->
<!--              {{ getHost(tab.chromeTab?.url, true) }}-->
<!--              <q-icon name="launch" color="primary" @click.stop="Navigation.openOrCreateTab(tab.chromeTab?.url )"></q-icon>-->
<!--              <q-tooltip>-->
<!--                {{ getHost(tab.chromeTab?.url, false) }}-->
<!--              </q-tooltip>-->
<!--            </div>-->


<!--            <div class="row q-mt-md" v-if="props.showActions">-->

<!--              <div class="col">-->


<!--                <q-icon name="save" class="cursor-pointer q-mr-md"-->
<!--                        v-if="tab.status !== TabStatus.DEFAULT"-->
<!--                        @click="saveTab(tab)">-->
<!--                  <q-tooltip>Save this tab to your current context</q-tooltip>-->
<!--                </q-icon>-->

<!--                <q-icon name="keyboard_arrow_left" class="cursor-pointer" v-if="tab.history?.length > 0">-->
<!--                  <q-tooltip>{{tab.history}}</q-tooltip>-->

<!--                </q-icon>-->
<!--                <q-icon name="keyboard_arrow_right" class="cursor-pointer" v-if="tab.history?.length > 0">-->


<!--                </q-icon>-->
<!--              </div>-->
<!--            </div>-->


<!--            &lt;!&ndash;            <div class="text-body1 q-mt-sm q-mb-xs">{{ maxChar(20, tab.chromeTab?.title || tab.title) }}</div>&ndash;&gt;-->

<!--          </q-card-section>-->

<!--        </q-card-section>-->


<!--      </q-card>-->
<!--    </div>-->
<!--  </div>-->
<!--</template>-->

<!--<script setup lang="ts">-->
<!--import Navigation from "src/services/Navigation";-->
<!--import {Tab, TabStatus} from "src/models/Tab";-->
<!--import TabsetService from "src/services/TabsetService";-->
<!--import {useNotificationsStore} from "src/stores/notificationsStore";-->
<!--import TabThumb from "src/components/layouts/TabThumb.vue"-->

<!--const props = defineProps({-->
<!--  tabs: {-->
<!--    type: Array,-->
<!--    required: true-->
<!--  },-->
<!--  showActions: {-->
<!--    type: Boolean,-->
<!--    default: false-->
<!--  }-->
<!--})-->

<!--const emits = defineEmits(['sendCaption'])-->

<!--function getShortHostname(host: string) {-->
<!--  const nrOfDots = (host.match(/\./g) || []).length-->
<!--  if (nrOfDots >= 2) {-->
<!--    return host.substring(host.indexOf(".", nrOfDots - 2) + 1)-->
<!--  }-->
<!--  return host-->
<!--}-->

<!--function getHost(urlAsString: string, shorten: Boolean = true): string {-->
<!--  try {-->
<!--    const url = new URL(urlAsString)-->
<!--    if (!shorten) {-->
<!--      return url.protocol + "://" + url.host.toString()-->
<!--    }-->
<!--    return getShortHostname(url.host)-->
<!--  } catch (e) {-->
<!--    return "-&#45;&#45;";-->
<!--  }-->
<!--}-->

<!--function withoutHostname(url: string) {-->
<!--  const splits = url?.split(getHost(url))-->
<!--  if (splits?.length > 1) {-->
<!--    return "..." + splits[1]-->
<!--  }-->
<!--  return "-&#45;&#45;"-->
<!--}-->

<!--function maxChar(max: number, t: string): string {-->
<!--  if (t?.length > max - 3) {-->
<!--    return t.substring(0, max - 3) + "..."-->
<!--  }-->
<!--  return t;-->
<!--}-->


<!--function closeTab(tab: Tab) {-->
<!--  Navigation.closeTab(tab)-->
<!--}-->

<!--function saveTab(tab: Tab) {-->
<!--  //console.log("saving tab", tab)-->
<!--  TabsetService.saveToTabset(tab)-->
<!--}-->

<!--function togglePin(tabId: number) {-->
<!--  console.log("toggling pin", tabId)-->
<!--  TabsetService.togglePin(tabId)-->
<!--}-->


<!--function cardStyle(tab: Tab) {-->
<!--  const height = props.showActions ? "100px" : "66px"-->
<!--  let borderColor = ""-->
<!--  // if (TabStatus.CREATED === tab.status) {-->
<!--  //   borderColor = "";-->
<!--  // } else if (TabStatus.DELETED === tab.status) {-->
<!--  //   borderColor = "border-color:#EF9A9A"-->
<!--  // }-->
<!--  if (isOpen(tab)) {-->
<!--    borderColor = "border-color:#8f8f8f"-->
<!--  }-->
<!--  if (tab.selected) {-->
<!--    borderColor = "border-color:#000066"-->
<!--  }-->

<!--  let background = ''-->
<!--  if (tab.isDuplicate) {-->
<!--    background = "background: radial-gradient(circle, #FFFFFF 0%, #FFECB3 100%)"-->
<!--  }-->
<!--  // style=""-->
<!--  return `height: ${height};max-height:${height}; min-height: ${height};${borderColor};${background}`-->
<!--}-->

<!--function isOpen(tab: Tab): boolean {-->
<!--  //console.log("tabUrl", tab.chromeTab?.url);-->
<!--  return TabsetService.isOpen(tab?.chromeTab?.url || '')-->
<!--}-->

<!--const setInfo = (tab: Tab) => {-->
<!--  const notificationsStore = useNotificationsStore()-->
<!--  const parts = (tab.chromeTab?.url || '').split('?')-->
<!--  if (parts.length > 1) {-->
<!--    emits('sendCaption', parts[0] + "[... params omitted....]")-->
<!--  } else if (parts.length === 1) {-->
<!--    emits('sendCaption', parts[0].toString());-->
<!--  }-->
<!--//  notificationsStore.setInfo(`created: ${date.formatDate(tab.created, 'DD.MM.YYYY HH:mm')}`)-->
<!--}-->

<!--const selectTab = (tab: Tab) => {-->
<!--  //console.log("tab selected", tab)-->
<!--  TabsetService.setOnlySelectedTab(tab)-->
<!--  const notificationStore = useNotificationsStore()-->
<!--  notificationStore.setSelectedTab(tab)-->
<!--}-->

<!--const setCustomTitle = (tab: Tab, newValue: string) => {-->
<!--  console.log(" -> ", newValue)-->
<!--  TabsetService.setCustomTitle(tab, newValue)-->
<!--}-->

<!--const nameOrTitle = (tab: Tab) => tab.name ? tab.name : tab.chromeTab?.title-->
<!--const dynamicNameOrTitleModel = (tab:Tab) => tab.name ? tab.name : tab.chromeTab?.title-->

<!--const thumbnail = (tab: Tab) => {-->
<!--  TabsetService.getThumbnailFor(tab)-->
<!--}-->

<!--</script>-->
