<template>

  <div class="row items-start q-mb-xl">
    <div v-for="bm in _.filter(bookmarksStore.bookmarksForFolder, (bm:Bookmark) => !bm.chromeBookmark.url)"
         :key="bm.id"
         draggable="true"
         @dragstart="startDrag($event, bm)"
         class="col-xs-12 col-sm-4 col-md-3 col-lg-2 q-pa-xs">

      <q-card class="my-card" flat bordered :style="cardStyle(bm)" @mouseover="setInfo(bm)" @click="selectBookmark(bm)">

        <q-card-section class="q-pt-xs cursor-pointer bg-amber-2 text-black">
          <div class="row items-baseline">

            <!-- icon -->
            <div class="col-2">
              <q-icon name="folder_open" size="24px"></q-icon>
            </div>

            <!-- title or name if given -->
            <div class="col-10 text-subtitle1 ellipsis">
              {{ nameOrTitle(bm) }}
              <q-popup-edit :model-value="dynamicNameOrTitleModel(bm)" v-slot="scope"
                            @update:model-value="val => setCustomTitle( bm, val)">
                <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set"/>
              </q-popup-edit>
              <q-tooltip>{{ bm.chromeBookmark.title }}</q-tooltip>
            </div>

          </div>


          <div class="text-subtitle2 ellipsis text-secondary">
            {{ bm.chromeBookmark?.dateAdded }}
          </div>

        </q-card-section>


        <q-card-actions align="right">
<!--          <q-btn flat round color="red" size="11px" icon="delete_outline" @click.stop="deleteBookmark(bm)">-->
<!--            <q-tooltip>Delete this bookmark</q-tooltip>-->
<!--          </q-btn>-->
        </q-card-actions>

      </q-card>
    </div>
  </div>

  <q-toolbar class="text-primary">
    <div class="row fit">
      <div class="col-xs-12 col-md-7">
        <q-toolbar-title>

        </q-toolbar-title>
      </div>
      <div class="col-xs-12 col-md-5 text-right">
        <q-btn
          flat dense icon="upload_file"
          color="positive" :label="$q.screen.gt.sm ? 'Import as Tabset...' : ''"
          class="q-mr-md"
          @click="importBookmarks">
          <q-tooltip>Import these bookmarks as Tabset</q-tooltip>
        </q-btn>

      </div>
    </div>
  </q-toolbar>

  <div class="row items-start">
    <div v-for="bm in _.filter(bookmarksStore.bookmarksForFolder, (bm:Bookmark) => bm.chromeBookmark.url)"
         :key="bm.id"
         draggable="true"
         @dragstart="startDrag($event, bm)"
         class="col-xs-12 col-sm-4 col-md-3 col-lg-2 q-pa-xs">

      <q-card class="my-card" flat bordered :style="cardStyle(bm)" @mouseover="setInfo(bm)" @click="selectTab(bm)">

        <q-card-section class="q-pt-xs cursor-pointer bg-amber-1 text-black">
          <div class="row items-baseline">

            <!-- icon -->
            <div class="col-2">
              <q-icon name="bookmark_border" size="24px"></q-icon>
            </div>

            <!-- title or name if given -->
            <div class="col-10 text-subtitle1 ellipsis">
              {{ nameOrTitle(bm) }}
              <q-popup-edit :model-value="dynamicNameOrTitleModel(bm)" v-slot="scope"
                            @update:model-value="val => setCustomTitle( bm, val)">
                <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set"/>
              </q-popup-edit>
              <q-tooltip>{{ bm.chromeBookmark.title }}</q-tooltip>
            </div>

          </div>


          <div class="text-subtitle2 ellipsis text-secondary">
            {{ getHost(bm.chromeBookmark?.url, true) }}
            <q-icon name="launch" color="secondary"
                    @click.stop="Navigation.openOrCreateTab(bm.chromeBookmark?.url )"></q-icon>
            <q-tooltip>
              {{ bm.chromeBookmark?.url }}
            </q-tooltip>
          </div>

        </q-card-section>


        <q-card-actions align="right">
          <q-btn flat round color="red" size="11px" icon="delete_outline" @click.stop="deleteBookmark(bm)">
            <q-tooltip>Delete this bookmark</q-tooltip>
          </q-btn>
        </q-card-actions>

      </q-card>
    </div>
  </div>


</template>

<script setup lang="ts">
import Navigation from "src/services/Navigation";
import {Tab} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {useNotificationsStore} from "stores/notificationsStore";
import {Bookmark} from "src/models/Bookmark";
import _ from "lodash"
import {useRouter} from "vue-router";
import {useQuasar} from "quasar";
import ImportFromBookmarks from "components/dialogues/ImportFromBookmarks.vue";
import BookmarksService from "src/services/BookmarksService";
import {useBookmarksStore} from "stores/bookmarksStore";

// const props = defineProps({
//   bookmarks: {
//     type: Array,
//     required: true
//   }
// })

const emits = defineEmits(['sendCaption'])

const bookmarksStore = useBookmarksStore()
const router = useRouter()
const $q = useQuasar()

function getShortHostname(host: string) {
  const nrOfDots = (host.match(/\./g) || []).length
  if (nrOfDots >= 2) {
    return host.substring(host.indexOf(".", nrOfDots - 2) + 1)
  }
  return host
}

function getHost(urlAsString: string, shorten: Boolean = true): string {
  try {
    const url = new URL(urlAsString)
    if (!shorten) {
      return url.protocol + "://" + url.host.toString()
    }
    return getShortHostname(url.host)
  } catch (e) {
    return "---";
  }
}

function withoutHostname(url: string) {
  const splits = url?.split(getHost(url))
  if (splits?.length > 1) {
    return "..." + splits[1]
  }
  return "---"
}

function maxChar(max: number, t: string): string {
  if (t?.length > max - 3) {
    return t.substring(0, max - 3) + "..."
  }
  return t;
}


function deleteBookmark(bm: Bookmark) {
  BookmarksService.deleteBookmark(bm)
}

function saveTab(tab: Tab) {
  //console.log("saving tab", tab)
  TabsetService.saveToTabset(tab)
}

function cardStyle(bm: Bookmark) {
  let borderColor = ""

  if (bm?.selected) {
    borderColor = "border-color:#000066"
  }

  let background = ''
  // style=""
  return `${borderColor};${background}`
}

const setInfo = (tab: Tab) => {
  const notificationsStore = useNotificationsStore()
  const parts = (tab.chromeTab?.url || '').split('?')
  if (parts.length > 1) {
    emits('sendCaption', parts[0] + "[... params omitted....]")
  } else if (parts.length === 1) {
    emits('sendCaption', parts[0].toString());
  }
//  notificationsStore.setInfo(`created: ${date.formatDate(tab.created, 'DD.MM.YYYY HH:mm')}`)
}

const selectBookmark = (bm: Bookmark) => {
  router.push("/bookmarks/" + bm.chromeBookmark.id)
}

const setCustomTitle = (tab: Tab, newValue: string) => {
  console.log(" -> ", newValue)
  TabsetService.setCustomTitle(tab, newValue)
}

const nameOrTitle = (bm: Bookmark) => bm?.chromeBookmark?.title
const dynamicNameOrTitleModel = (bm: Bookmark) => bm?.chromeBookmark?.title

const startDrag = (evt: DragEvent, bm: Bookmark) => {
  //console.log("drag started", evt, tab.id)
  if (evt.dataTransfer) {
    evt.dataTransfer.dropEffect = 'move'
    evt.dataTransfer.effectAllowed = 'move'
    evt.dataTransfer.setData('text/plain', bm.id)
  }
}

const importBookmarks = () => {
  $q.dialog({component: ImportFromBookmarks})
}


</script>

<style lang="sass" scoped>
.my-card
  width: 100%
</style>
