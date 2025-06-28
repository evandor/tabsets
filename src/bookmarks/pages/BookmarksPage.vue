<template>

  <!-- toolbar -->
  <q-toolbar>

    <q-toolbar-title>
      <div class="row justify-start items-baseline">
        <div class="col-12">
                <span>
                  <q-breadcrumbs separator=">">
                    <q-breadcrumbs-el v-for="bm in bookmarksForBreadcrumb"
                                      :label="bm.chromeBookmark.title"
                                      class="cursor-pointer"
                                      @click="props.inSidePanel ?
                                        router.push('/mainpanel/bookmarks/' + bm.chromeBookmark.id) :
                                        router.push('/bookmarks/' + bm.chromeBookmark.id)"
                    />
                  </q-breadcrumbs>
                </span>
        </div>
      </div>
    </q-toolbar-title>

    <slot name="actions"></slot>

  </q-toolbar>

  <!-- bookmark folders -->
  <q-expansion-item v-if="folders().length > 0"
                    expand-separator
                    default-opened>
    <template v-slot:header="{ expanded }">
      <q-item-section>
        <div>
          <span class="text-weight-bold">{{
              folders().length
            }} {{ folders().length === 1 ? 'Folder' : 'Folders' }}</span>
          <div class="text-caption ellipsis">Subfolder of '{{ bookmarksStore.currentBookmark?.chromeBookmark.title }}'
          </div>
        </div>
      </q-item-section>
    </template>
    <q-card>
      <q-card-section>

        <BookmarkList
            :parent="bookmarkId"
            group="bookmarkFolders"
            :bookmarks="folders()"
            :in-side-panel="props.inSidePanel"
        />

      </q-card-section>
    </q-card>
  </q-expansion-item>

  <!-- bookmarks  -->
  <q-expansion-item
      expand-separator
      default-opened>
    <template v-slot:header="{ expanded }">
      <q-item-section>
        <div>
          <span class="text-weight-bold">{{
              nonFolders().length
            }} {{ nonFolders().length === 1 ? 'Bookmark' : 'Bookmarks' }}</span>
          <div class="text-caption ellipsis">bookmarks of current folder</div>
        </div>
      </q-item-section>
    </template>
    <q-card>
      <q-card-section>

        <BookmarkList
            group="bookmarks"
            :parent="bookmarkId"
            :bookmarks="nonFolders()"
            :highlightId="highlightId"
            :in-side-panel="props.inSidePanel"
        />

      </q-card-section>
    </q-card>
  </q-expansion-item>

</template>

<script setup lang="ts">
import {useRoute, useRouter} from "vue-router";
import {uid, useQuasar} from "quasar";
import _ from "lodash"
import {useBookmarksStore} from "src/bookmarks/stores/bookmarksStore";
import {Bookmark} from "src/bookmarks/models/Bookmark";
import {onMounted, ref, watchEffect} from "vue";
import BookmarkList from "src/bookmarks/components/BookmarkList.vue";
import Analytics from "src/core/utils/google-analytics";

const props = defineProps({
  inSidePanel: {type: Boolean, default: false}
})

const route = useRoute();
const router = useRouter();
const bookmarksStore = useBookmarksStore()

const $q = useQuasar()

const bookmarksForFolder = ref<Bookmark[]>([])
const bookmarksForBreadcrumb = ref<Bookmark[]>([])
const bookmarkId = ref('')

const highlightId = ref<string>('')

onMounted(() => {
  Analytics.firePageViewEvent('BookmarksPage', document.location.href);
})


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



const folders = (): Bookmark[] => _.filter(bookmarksStore.bookmarksForFolder, (bm: Bookmark) => !bm.chromeBookmark.url)
const nonFolders = (): Bookmark[] => _.filter(bookmarksStore.bookmarksForFolder, (bm: Bookmark) => !!bm.chromeBookmark.url)


</script>
