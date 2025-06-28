<template>
  <template v-if="props.element === 'contextmenu'">
    <ContextMenuItem
      v-close-popup
      @was-clicked="clicked()"
      icon="o_tab"
      color="primary"
      :disable="disableMenuEntry()"
      label="Import Bookmarks">
    </ContextMenuItem>
  </template>
  <template v-else>
    <fab-like-btn @button-clicked="clicked()" color="warning" icon="sym_o_download" />
  </template>
</template>
<script setup lang="ts">
import { useQuasar } from 'quasar'
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import FabLikeBtn from 'src/tabsets/actions/widgets/FabLikeBtn.vue'
import { CreateTabsetFromBookmarksRecursive } from 'src/tabsets/commands/CreateTabsetFromBookmarksRecursive'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { ref } from 'vue'

const $q = useQuasar()
const props = defineProps<ActionProps>()

const filename = ref('')

function getBmFolderId(chromeTab: chrome.tabs.Tab) {
  return chromeTab.url?.split('?')[1]?.split('=')[1] || undefined
}

const disableMenuEntry = () => {
  // console.log('hier', props.context)
  // if (props.context && props.context.chromeTab) {
  //   const folderId = getBmFolderId(props.context.chromeTab)
  //   console.log('got fodlerId', folderId)
  //   return !folderId ? true : (useTabsetsStore().getCurrentTabset?.bookmarkId || '') === folderId
  // }
  return false
}

const clicked = () => {
  $q.dialog({
    title: 'Import Bookmarks',
    message: 'Click "OK" to import the  selected bookmarks folder to the current tabset',
    options: {
      type: 'checkbox',
      model: [],
      items: [{ label: 'Recursive', value: 'recursive', color: 'secondary' }],
    },
    cancel: true,
    persistent: true,
  }).onOk((data: any) => {
    const ts = useTabsetsStore().getCurrentTabset
    const chromeTab = useTabsStore2().currentChromeTab
    if (ts && chromeTab) {
      const folder = useTabsetsStore().getActiveFolder(ts)
      console.log('importing', data, folder?.name) //filename, ts, chromeTab, folder)
      // new ImportFromChromeBookmarksManagerAddUrlToTabsetHandler($q).clicked(chromeTab, ts, folder, {
      //   data: { filename },
      // })

      const bmFolderId = getBmFolderId(chromeTab)
      if (!bmFolderId) {
        return
        //return Promise.reject('could not parse bookmarks id from URL')
      }
      try {
        const currentTabsetName = useTabsetsStore().getCurrentTabset?.name || 'unknown'
        useCommandExecutor()
          .executeFromUi(
            new CreateTabsetFromBookmarksRecursive(currentTabsetName, bmFolderId, data['recursive'] !== undefined),
          )
          .then((res: ExecutionResult<Tabset>) => {
            const tabset = res.result
            useTabsetService().saveTabset(tabset)
            console.log('imported to tabset', tabset.id)
            useTabsetsStore().reloadTabset(tabset.id)
            //return Promise.resolve(new ExecutionResult('', ''))
          })
      } catch (e: any) {
        console.log('got error', e)
        //return Promise.reject('error importing bookmarks')
      }
    }
  })
}
</script>
