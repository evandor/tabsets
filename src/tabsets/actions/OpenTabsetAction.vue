<template>
  <q-separator inset />
  <ContextMenuItem v-close-popup @was-clicked="clicked()" icon="o_exit_to_app" color="primary" label="Show tab for url">
  </ContextMenuItem>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar'
import { useContentStore } from 'src/content/stores/contentStore'
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'

const $q = useQuasar()

defineProps<ActionProps>()

const clicked = () => {
  const tabsets: { label: string; tabsetId: string }[] = tabsetsForUrl()
  console.log('found tabsets', tabsets)
  if (tabsets.length == 1) {
    useTabsetService().selectTabset(tabsets[0]!.tabsetId)
  } else {
    $q.dialog({
      title: 'Select Tabset',
      message: 'the current url is used in multiple tabsets; please select one:',
      options: {
        type: 'radio',
        model: 'selected',
        items: tabsets.map((ts: { label: string; tabsetId: string }) => {
          return {
            label: ts.label,
            value: ts.tabsetId,
          }
        }),
      },
      cancel: true,
      persistent: true,
    }).onOk((tabsetId: any) => {
      useTabsetService().selectTabset(tabsetId)
    })
  }
}

const tabsetsForUrl = (): { label: string; tabsetId: string }[] => {
  const url = useContentStore().getCurrentTabUrl
  if (url) {
    return useTabsetService()
      .tabsetsFor(url)
      .map((tsId: string) => {
        return {
          label: useTabsetService().nameForTabsetId(tsId),
          tabsetId: tsId,
        }
      })
  }
  return []
}
</script>
