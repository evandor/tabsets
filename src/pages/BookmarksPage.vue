<template>


  <!-- toolbar -->
  <q-toolbar class="text-primary lightgrey">
    <div class="row fit">
      <div class="col-xs-12 col-md-7">
        <q-toolbar-title>
          <div class="row justify-start items-baseline">
            <div class="col-12">
                <span class="text-primary">
                  <q-breadcrumbs separator=">">
                    <q-breadcrumbs-el v-for="bm in bookmarksForBreadcrumb"
                                      :label="bm.chromeBookmark.title"
                                      class="cursor-pointer"
                                      @click="router.push('/bookmarks/' + bm.chromeBookmark.id)"
                    />
                  </q-breadcrumbs>
                </span>
            </div>
          </div>
        </q-toolbar-title>
      </div>
      <div class="col-xs-12 col-md-5 text-right">
        <q-btn
          flat dense icon="delete_outline"
          color="negative" :label="$q.screen.gt.sm ? 'Delete Folder...' : ''"
          class="q-mr-md"
          @click="deleteBookmarkFolder">
          <q-tooltip>Delete this Bookmark</q-tooltip>
        </q-btn>

      </div>
    </div>
  </q-toolbar>
  <q-page padding class="greyBorderTop">

    <q-card>
      <q-card-section>
        <BookmarkCards :highlightId="highlightId"/>
      </q-card-section>
    </q-card>

    <!--    <fab></fab>-->


  </q-page>


</template>

<script setup lang="ts">
import {useRoute, useRouter} from "vue-router";
import {uid, useQuasar} from "quasar";
import _ from "lodash"
import {useTabsStore} from "src/stores/tabsStore";
import BookmarkCards from "src/components/layouts/BookmarkCards.vue";
import {useBookmarksStore} from "src/stores/bookmarksStore";
import {Bookmark} from "src/models/Bookmark";
import {ref, watchEffect} from "vue";

const route = useRoute();
const router = useRouter();
const localStorage = useQuasar().localStorage
const tabsStore = useTabsStore()
const bookmarksStore = useBookmarksStore()

const $q = useQuasar()

const bookmarksForFolder = ref<Bookmark[]>([])
const bookmarksForBreadcrumb = ref<Bookmark[]>([])
const bookmarkId = ref('')

const highlightId = ref<string>('')

watchEffect(() => {
  const highlight = route.query['highlight'] as unknown as string
  if (highlight) {
    try {
      highlightId.value = highlight
    } catch (e: any) {
      console.error("highlight error", e)
    }
  }
})

async function getParentChain(bookmarkId: string, chain: Bookmark[] = []): Promise<Bookmark[]> {
  // @ts-ignore
  const results = await chrome.bookmarks.get(bookmarkId)
  // @ts-ignore
  if (results && results[0]) {
    chain.push(new Bookmark(uid(), results[0]))
    // @ts-ignore
    const parentId = results[0].parentId
    if (parentId && parentId !== "0") {
      // @ts-ignore
      chain = getParentChain(parentId, chain)
    }
  }
  return Promise.resolve(chain)
}

watchEffect(() => {
  bookmarkId.value = route.params.id as string
  if (bookmarkId.value) {
    chrome.bookmarks.get(bookmarkId.value, results => {
      // console.log("resul", results)
      if (results && results[0]) {
        bookmarksStore.currentBookmark = new Bookmark(uid(), results[0])
        getParentChain(bookmarkId.value)
          .then(res => {
            bookmarksForBreadcrumb.value = res.reverse()
          })
      }
    })
    chrome.bookmarks.getChildren(bookmarkId.value, (bms: chrome.bookmarks.BookmarkTreeNode[]) => {
      bookmarksForFolder.value = _.map(bms, (l: chrome.bookmarks.BookmarkTreeNode) => new Bookmark(uid(), l))
      useBookmarksStore().bookmarksForFolder = bookmarksForFolder.value
    })
  }
})

const deleteBookmarkFolder = () => {

  $q.dialog({
    title: 'Please Confirm Deleting of Bookmarks Folder',
    message: 'Do you really want to delete this folder (and potentially all its subfolders and bookmarks)? This cannot be undone.',
    cancel: true,
    persistent: true
  }).onOk(() => {
    const folderId = bookmarksStore.currentBookmark.chromeBookmark.id
    const parentId = bookmarksStore.currentBookmark.chromeBookmark.parentId
    console.log("deleting", folderId)
    chrome.bookmarks.removeTree(bookmarksStore.currentBookmark.chromeBookmark.id)
    if (parentId) {
      router.push("/bookmarks/" + parentId)
    }
  }).onCancel(() => {
  }).onDismiss(() => {
  })


}
</script>


<style lang="sass" scoped>

.lightgrey
  background-color: $lightgrey

.greyBorderTop
  border-top: 1px solid $bordergrey

</style>
