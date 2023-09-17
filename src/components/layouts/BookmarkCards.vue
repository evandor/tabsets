<template>
<!-- deprecated, to be deleted -->
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

      <q-card class="my-card" flat bordered :style="cardStyle(bm)" @mouseover="setInfo(bm)">

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


            <q-badge color="warning" v-if="existsInTabset(bm.chromeBookmark.url)" floating>
              <q-icon name="tab" size="16px" color="white">
                <q-tooltip>This bookmark is saved in a tabset</q-tooltip>
              </q-icon>
            </q-badge>

          </div>


          <div class="text-subtitle2 ellipsis text-secondary"
               @click.stop="NavigationService.openOrCreateTab(bm.chromeBookmark?.url )">
            {{ bm.chromeBookmark?.url.replace("https://www.", '').replace("https://", '') }}
            <q-icon name="launch" color="secondary"
                    @click.stop="NavigationService.openOrCreateTab(bm.chromeBookmark?.url )"></q-icon>
            <q-tooltip>
              {{ bm.chromeBookmark?.url }}
            </q-tooltip>
          </div>

          <div class="text-grey-5">
            {{ formatDate(bm.chromeBookmark?.dateAdded) }}
            <q-tooltip>this bookmark was created at
              {{ date.formatDate(bm.chromeBookmark?.dateAdded, 'DD.MM.YYYY HH:mm') }}
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
import {date} from "quasar";
import {Tab} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {Bookmark} from "src/models/Bookmark";
import {useRouter} from "vue-router";
import {useQuasar} from "quasar";
import BookmarksService from "src/services/BookmarksService";
import NavigationService from "src/services/NavigationService";
import {useBookmarksStore} from "src/stores/bookmarksStore";
import _ from "lodash"
import {formatDistance, subDays} from 'date-fns'
import {useTabsetService} from "src/services/TabsetService2";
import ImportFromBookmarksDialog from "components/dialogues/ImportFromBookmarksDialog.vue";

const emits = defineEmits(['sendCaption'])

const props = defineProps({
  highlightId: {
    type: String,
    required: false
  }
})


const bookmarksStore = useBookmarksStore()
const router = useRouter()
const $q = useQuasar()


function deleteBookmark(bm: Bookmark) {
  BookmarksService.deleteBookmark(bm)
}

function cardStyle(bm: Bookmark) {
  let borderColor = ""

  if (bm?.selected) {
    borderColor = "border-color:#000066"
  }

  let background = ''
  if (props.highlightId && bm.chromeBookmark.id === props.highlightId) {
    background = "background-color: red"
  }
  return `${borderColor};${background}`
}

const setInfo = (tab: Tab) => {
  const parts = (tab.url || '').split('?')
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
  if (evt.dataTransfer) {
    evt.dataTransfer.dropEffect = 'move'
    evt.dataTransfer.effectAllowed = 'move'
    evt.dataTransfer.setData('text/plain', bm.id)
  }
}

const importBookmarks = () => {
  $q.dialog({component: ImportFromBookmarksDialog})
}

const formatDate = (timestamp: number | undefined) =>
  timestamp ? formatDistance(timestamp, new Date(), {addSuffix: true}) : ""


// const filterdBookmarks = () => {
//   _.filter(bookmarksStore.bookmarksForFolder, (bm:Bookmark) => !bm.chromeBookmark.url)
// }

const existsInTabset = (url: string) => useTabsetService().tabsetsFor(url)?.length > 0

</script>

<style lang="sass" scoped>
.my-card
  width: 100%
</style>
