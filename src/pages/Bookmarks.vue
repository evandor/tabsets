<template>
  <q-page padding>

    <!-- toolbar -->
    <q-toolbar class="text-primary">
      <div class="row fit">
        <div class="col-xs-12 col-md-5">
          <q-toolbar-title>
            <div class="row justify-start items-baseline">
              <div class="col-1"><span class="text-dark">Bookmarks</span> <span
                class="text-primary">
              {{ tabsStore.currentTabsetName }}

            </span></div>
            </div>
          </q-toolbar-title>
        </div>
        <div class="col-xs-12 col-md-7 text-right">



        </div>
      </div>
    </q-toolbar>

    <q-card>
      <q-card-section>
        <BookmarkCards :bookmarks="bookmarksForParent()"  />
      </q-card-section>
    </q-card>

    <fab></fab>



  </q-page>



</template>

<script setup lang="ts">
import {useRoute, useRouter} from "vue-router";
import {uid, useQuasar} from "quasar";
import _ from "lodash"
import {useTabsStore} from "src/stores/tabsStore";
import BookmarkCards from "src/components/layouts/BookmarkCards.vue";
import {Tab, TabStatus} from "src/models/Tab";
import Fab from "components/Fab.vue";
import {useAuthStore} from "src/stores/auth";
import {useBookmarksStore} from "stores/bookmarksStore";

const route = useRoute();
const router = useRouter();
const localStorage = useQuasar().localStorage
const tabsStore = useTabsStore()
const bookmarksStore = useBookmarksStore()
const auth = useAuthStore()


const $q = useQuasar()

const bookmarkId = route.params.id as string
console.log("bookmarkId", bookmarkId)
bookmarksStore.bookmarksLeavesFor(bookmarkId)

const bookmarksForParent = () => {
  console.log("bookmarksStore.bookmarksLeafes", bookmarksStore.bookmarksLeaves[0])
  return _.map(bookmarksStore.bookmarksLeaves[0], l => {
    //console.log("l", l)
    return new Tab(uid(), l)
  })
}
</script>
