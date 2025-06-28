<template>
  <template v-if="props.element === 'contextmenu'">
    <ContextMenuItem v-close-popup @was-clicked="clicked()" icon="sym_o_rss_feed" color="primary" :label="label" />
  </template>
  <template v-else>
    <fab-like-btn @button-clicked="clicked()" color="warning" icon="sym_o_rss_feed" />
  </template>
</template>

<script lang="ts" setup>
import { uid, useQuasar } from 'quasar'
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import FabLikeBtn from 'src/tabsets/actions/widgets/FabLikeBtn.vue'
import { CreateFolderCommand } from 'src/tabsets/commands/CreateFolderCommand'
import AddRssFeedDialog from 'src/tabsets/dialogues/actions/AddRssFeedDialog.vue'
import { TabsetType } from 'src/tabsets/models/Tabset'
import { ref } from 'vue'

const props = defineProps<ActionProps>()

const $q = useQuasar()

const label = ref('Add RSS Feed')

const clicked = () => {
  return $q
    .dialog({
      component: AddRssFeedDialog,
      componentProps: { parentFolderId: 'bookmarkId.value' },
    })
    .onOk((data: any) => {
      console.log('saving...', data, props)
      try {
        // const newTab = new Tab(uid(), chromeTab)
        //   // let title = chromeTab.url?.replace("https://","").replace("http://", "").replace(STRIP_CHARS_IN_USER_INPUT, '') || 'no title'
        let title: string = data['feedName' as keyof object] || 'no title'
        //   if (title.length > 32) {
        //     title = title.substring(0, 28) + '...'
        //   }
        if (props.currentChromeTab?.url) {
          useCommandExecutor().executeFromUi(
            new CreateFolderCommand(
              uid(),
              title,
              [],
              props.tabset.id,
              undefined,
              props.currentChromeTab.url,
              TabsetType.RSS_FOLDER,
            ),
          )
        }
        //return Promise.resolve(new ExecutionResult('', 'done'))
      } catch (error: any) {
        console.warn('error', error)
        //return Promise.reject('error creating RSS Feed')
      }
    })
}
</script>
