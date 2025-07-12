<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Export your Tabsets</div>
      </q-card-section>
      <q-card-section>
        <div class="text-caption">{{ foundLabel() }}</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">Please choose</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-radio v-model="exportAs" val="json" label="as JSON"></q-radio>
        <br />
        <!--        <q-radio v-model="exportAs" val="csv" label="as CSV (not implemented yet)"></q-radio>-->
        <q-radio v-model="exportAs" val="bookmarks" label="to Bookmarks Folder"></q-radio>
        <br />
        <q-radio v-model="exportAs" val="events" label="to Events File"></q-radio>
      </q-card-section>

      <q-card-section class="q-pt-none text-warning" v-if="warning !== ''">
        {{ warning }}
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" @click="onDialogCancel" />
        <q-btn flat label="Export" v-close-popup @click="exportData()" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import _ from 'lodash'
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { Space } from 'src/spaces/models/Space'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { SpaceEvent, TabEvent, TabsetEvent } from 'src/tabsets/commands/github/GithubWriteEventCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset, TabsetStatus } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { ref, watchEffect } from 'vue'

defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits,
])

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

type Props = { filename?: string; tabset?: Tabset }

const props = withDefaults(defineProps<Props>(), {
  filename: `tabsets-${import.meta.env.PACKAGE_VERSION}.json`,
})

const $q = useQuasar()

const exportAs = ref('json')
const hideWarning = ref(false)
const warning = ref('')

watchEffect(() => {
  if (exportAs.value === 'bookmarks') {
    warning.value = "Warning! This will replace the bookmarks at '/tabsets'!"
  } else {
    warning.value = ''
  }
})

const exportData = () => {
  hideWarning.value = true
  console.log('exporting', props.filename)

  function spacesEventsFor(spaces: Space[]): string[] {
    const lines: string[] = []
    for (const space of spaces) {
      const event = new SpaceEvent('added', space.id, undefined, space.label)
      lines.push(event.format())
    }
    return lines
  }

  function createFile(data: string, filename: string) {
    const file = window.URL.createObjectURL(new Blob([data]))
    const docUrl = document.createElement('a')
    docUrl.href = file
    docUrl.setAttribute('download', filename)
    document.body.appendChild(docUrl)
    docUrl.click()
    return Promise.resolve('done')
  }

  async function eventsFor(tabsets: Tabset[], parentId: string | undefined = undefined): Promise<string[]> {
    const lines: string[] = []
    for (const ts of tabsets) {
      const event = new TabsetEvent('added', ts.id, parentId, ts.name, ts.spaces)
      lines.push(event.format())
      for (const tab of ts.tabs) {
        const event = new TabEvent('added', ts.id, tab.id, tab.title || tab.name || '???', tab.url, tab.favIconUrl)
        lines.push(event.format())
      }
      // const notes = await useNotesStore().getNotesFor(ts.id)
      // for (const note of notes) {
      //   const event = new NoteEvent('added', ts.id, note.title, note)
      //   lines.push(event.format())
      // }
      const folders = await eventsFor(ts.folders, ts.id)
      folders.forEach((l) => lines.push(l))
    }
    return lines
  }

  async function exportData2(
    exportAs: string,
    tabsets: Tabset[] | undefined,
    filename: string | undefined = 'tabsets.json',
  ): Promise<any> {
    console.log('exporting as ', exportAs)

    const spacesStore = useSpacesStore()

    let data = ''
    if (exportAs === 'json') {
      tabsets ??= [...useTabsetsStore().tabsets.values()] as Tabset[]
      data = JSON.stringify({
        tabsets: tabsets.filter((ts: Tabset) => ts.status !== TabsetStatus.DELETED),
        spaces: [...spacesStore.spaces.values()],
      })
      return createFile(data, filename)
    } else if (exportAs === 'events') {
      tabsets ??= [...useTabsetsStore().tabsets.values()] as Tabset[]
      const tabData = await eventsFor(tabsets)
      const spacesData = spacesEventsFor([...useSpacesStore().spaces.values()] as Space[])
      return createFile(tabData.join('') + spacesData.join(''), 'tabsets-events.txt')
    } else if (exportAs === 'bookmarks') {
      console.log('creating bookmarks...')

      chrome.bookmarks.getChildren('1', (results: chrome.bookmarks.BookmarkTreeNode[]) => {
        _.forEach(results, (r: any) => {
          if (r.title === 'tabsetsBackup') {
            console.log('deleting folder', r.id)
            chrome.bookmarks.removeTree(r.id)
          }
        })
      })

      chrome.bookmarks.create(
        { title: 'tabsetsBackup', parentId: '1' },
        (result: chrome.bookmarks.BookmarkTreeNode) => {
          // console.log("res", result)
          _.forEach([...useTabsetsStore().tabsets.values()] as Tabset[], (ts: Tabset) => {
            console.log('ts', ts)
            chrome.bookmarks.create(
              {
                title: ts.name,
                parentId: result.id,
              },
              (folder: chrome.bookmarks.BookmarkTreeNode) => {
                _.forEach(ts.tabs, (tab: Tab) => {
                  chrome.bookmarks.create({
                    title: tab.name || tab.title,
                    parentId: folder.id,
                    url: tab.url,
                  })
                })
              },
            )
          })
        },
      )

      // useBookmarksStore().loadBookmarks()
      //   .then(() => console.log("loaded in service"))
    }
    return Promise.resolve('done')
  }

  exportData2(exportAs.value, props.tabset ? [props.tabset] : undefined, props.filename)
    .then(() => {
      //router.push("/tabsets/" + tabsStore.currentTabsetId)
      $q.notify({
        message: 'export successful',
        type: 'positive',
      })
    })
    .catch((ex: any) => {
      console.error('ex', ex)
      hideWarning.value = false
      $q.notify({
        message: 'Sorry, there was a problem exporting your data',
        type: 'warning',
      })
    })
}

const foundLabel = () => {
  const spacesCount = useSpacesStore().spaces.size
  const allTabsCount = useTabsetsStore().allTabsCount
  const tabsetsCount = useTabsetsStore().tabsets.size
  if (spacesCount > 0) {
    return 'Found ' + allTabsCount + ' tabs in ' + tabsetsCount + ' Tabsets and ' + spacesCount + ' Spaces'
  }
  return 'Found ' + allTabsCount + ' tabs in ' + tabsetsCount + ' Tabsets'
}
</script>
