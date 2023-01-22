<template>

  <!-- folder -->
  <template v-if="!props.bookmark.chromeBookmark.url">
    <q-item-section
      avatar class="text-primary">
      <q-icon name="o_folder_open" size="24px"></q-icon>
    </q-item-section>
    <q-item-section
      :data-testid="useUtils().createDataTestIdentifier('tabListElementWidget', props.bookmark.chromeBookmark.title)"
      class="cursor-pointer"
      @click="selectBookmark(props.bookmark)">
      <q-item-label>{{ props.bookmark.chromeBookmark?.title }}
        <span class="text-caption text-grey-8">
           - {{ formatDate(props.bookmark.chromeBookmark?.dateAdded) }}
        <q-tooltip>this folder was created at
          {{ date.formatDate(props.bookmark.chromeBookmark?.dateAdded, 'DD.MM.YYYY HH:mm') }}
        </q-tooltip>
        </span>
      </q-item-label>
    </q-item-section>

  </template>

  <!-- bookmark -->
  <template v-else>
    <q-item-section avatar class="text-warning">
      <q-icon name="o_bookmark_border" size="24px"></q-icon>
    </q-item-section>
    <q-item-section
      @mouseover="showButtons(props.bookmark.chromeBookmark?.id, true)"
      @mouseleave="showButtons(props.bookmark.chromeBookmark?.id, false)"
      @click.stop="NavigationService.openOrCreateTab(props.bookmark.chromeBookmark?.url )">

      <q-item-label>
        <div>{{ props.bookmark.chromeBookmark?.title }}
          <span class="text-caption text-grey-8">
           - {{ formatDate(props.bookmark.chromeBookmark?.dateAdded) }}
        <q-tooltip>this folder was created at
          {{ date.formatDate(props.bookmark.chromeBookmark?.dateAdded, 'DD.MM.YYYY HH:mm') }}
        </q-tooltip>
        </span>
        </div>
        <q-badge color="warning" v-if="existsInTabset(props.bookmark.chromeBookmark.url)" floating>
          <q-icon name="tab" size="16px" color="white">
            <q-tooltip>This bookmark is saved in a tabset</q-tooltip>
          </q-icon>
        </q-badge>
      </q-item-label>

      <q-item-label caption>{{ props.bookmark.chromeBookmark?.url }}</q-item-label>

    </q-item-section>
    <q-item-section avatar
                    @mouseover="showButtons(props.bookmark.chromeBookmark?.id, true)"
                    @mouseleave="showButtons(props.bookmark.chromeBookmark?.id, false)">
      <q-btn v-if="showDeleteButton.get(props.bookmark.chromeBookmark?.id)"
             flat round color="red" size="11px" icon="delete_outline" @click.stop="deleteBookmark(props.bookmark)">
        <q-tooltip>Delete this bookmark</q-tooltip>
      </q-btn>
    </q-item-section>
  </template>


</template>

<script setup lang="ts">
import {Tab} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {useNotificationsStore} from "src/stores/notificationsStore";
import {ref} from "vue";
import {useUtils} from "src/services/Utils"
import {useCommandExecutor} from "src/services/CommandExecutor";
import {DeleteTabCommand} from "src/domain/commands/DeleteTabCommand";
import {Bookmark} from "src/models/Bookmark";
import {useRouter} from "vue-router";
import {date} from "quasar";
import NavigationService from "src/services/NavigationService";
import BookmarksService from "src/services/BookmarksService";
import {useTabsetService} from "src/services/TabsetService2";

const {formatDate} = useUtils()

const props = defineProps({
  bookmark: {
    type: Object,
    required: true
  },
  highlightUrl: {
    type: String,
    required: false
  }
})

const router = useRouter()

const showDeleteButton = ref<Map<string, boolean>>(new Map())

const line = ref(null);

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

function cardStyle(tab: Tab) {
  const height = "66px"
  let borderColor = ""
  if (isOpen(tab)) {
    borderColor = "border-color:#8f8f8f"
  }
  if (tab.selected) {
    borderColor = "border-color:#000066"
  }

  let background = ''
  if (tab.isDuplicate) {
    background = "background: radial-gradient(circle, #FFFFFF 0%, #FFECB3 100%)"
  }
  // style=""
  return `height: ${height};max-height:${height}; min-height: ${height};${borderColor};${background}`
}

function isOpen(tab: Tab): boolean {
  return false//TabsetService.isOpen(tab?.chromeBookmark?.url || '')
}

const selectTab = (tab: Tab) => {
  TabsetService.setOnlySelectedTab(tab)
  const notificationStore = useNotificationsStore()
  notificationStore.setSelectedTab(tab)
}

const setCustomTitle = (tab: Tab, newValue: string) => {
  console.log(" -> ", newValue)
  TabsetService.setCustomTitle(tab, newValue)
}

const getFaviconUrl = (chromeBookmark: chrome.tabs.Tab | undefined) => {
  if (chromeBookmark && chromeBookmark.favIconUrl && !chromeBookmark.favIconUrl.startsWith("chrome")) {
    return chromeBookmark.favIconUrl
  }
  return 'favicon-unknown-32x32.png'
}

const deleteTab = (tab: Tab) => useCommandExecutor().executeFromUi(new DeleteTabCommand(tab))

const selectBookmark = (bm: Bookmark) => router.push("/bookmarks/" + bm.chromeBookmark.id)

const deleteBookmark = (bm: Bookmark) => BookmarksService.deleteBookmark(bm)

const existsInTabset = (url: string) => useTabsetService().tabsetsFor(url)?.length > 0

const showButtons = (bookmarkId: string, show: boolean) => showDeleteButton.value.set(bookmarkId, show)


</script>
