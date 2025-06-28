<template>
  <template
    v-if="
      props.level === 'root' &&
      props.tabset.tabs.length > 0 &&
      inBexMode() &&
      (!props.tabset.window || props.tabset.window === 'current')
    ">
    <q-separator inset />
    <ContextMenuItem icon="open_in_new" label="Open all in...">
      <q-item-section side>
        <q-icon name="keyboard_arrow_right" />
      </q-item-section>
      <q-menu :offset="[-182, -32]">
        <q-list>
          <q-item
            v-if="useFeaturesStore().hasFeature(FeatureIdent.AUTO_TAB_SWITCHER)"
            dense
            clickable
            v-close-popup
            @click="startAutoSwitchingTab(props.tabset.id)">
            <q-item-section>switching tab...</q-item-section>
          </q-item>
          <q-item dense clickable v-close-popup @click="restoreInNewWindow(props.tabset.id)">
            <q-item-section>new window</q-item-section>
          </q-item>
          <q-item dense clickable v-close-popup @click="restoreInGroup(props.tabset.id)">
            <q-item-section>this window...</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </ContextMenuItem>
  </template>

  <template
    v-if="props.tabset.tabs.length > 0 && inBexMode() && props.tabset.window && props.tabset.window !== 'current'">
    <ContextMenuItem
      v-close-popup
      @was-clicked="restoreInGroup(props.tabset.id, props.tabset.window)"
      icon="open_in_new"
      label="Open in window..." />
  </template>
</template>
<script setup lang="ts">
import { LocalStorage, useQuasar } from 'quasar'
import BrowserApi from 'src/app/BrowserApi'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useUtils } from 'src/core/services/Utils'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import NavigationService from 'src/services/NavigationService'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import { RestoreTabsetCommand } from 'src/tabsets/commands/RestoreTabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

const props = defineProps<ActionProps>()

const { inBexMode } = useUtils()

const $q = useQuasar()

const startAutoSwitchingTab = (tabsetId: string) => {
  const tabset = useTabsetsStore().getTabset(tabsetId)
  if (tabset && tabset.tabs?.length > 1 && tabset.tabs[0]!.url) {
    const tabs = tabset.tabs
    let tabIndex = 0
    NavigationService.openSingleTab(tabset.tabs[tabIndex]!.url || '').then((tab) => {
      console.log('tabId', tab)
      let interval = setInterval(
        () => {
          try {
            const nextTab = tabs[++tabIndex % tabs.length]
            console.log('updating ', nextTab!.url)
            chrome.tabs.update(tab.id || 0, { url: nextTab!.url }, (cb) => {
              if (chrome.runtime.lastError) {
                console.warn('got runtime error', chrome.runtime.lastError)
                clearInterval(interval)
              }
            })
          } catch (err) {
            console.log('got error', err, interval)
            clearInterval(interval)
          }
        },
        (LocalStorage.getItem('ui.tabSwitcher') as number) || 5000,
      )
    })
  }
}
const restoreInNewWindow = (tabsetId: string, windowName: string | undefined = undefined) =>
  useCommandExecutor().execute(new RestoreTabsetCommand(tabsetId, windowName))

const restoreInGroup = (tabsetId: string, windowName: string | undefined = undefined) => {
  $q.dialog({
    title: 'Open tabset in this window',
    message: 'Should the current tabs be closed? (Pinned tabs will be kept)',
    options: {
      type: 'checkbox',
      model: [],
      items: [{ label: 'close current tabs', value: 'true', color: 'secondary' }],
    },
    cancel: true,
  }).onOk((data: any) => {
    if (data![0] === 'true') {
      console.log('data', data)
      BrowserApi.closeAllTabs(false).then(() => {
        useCommandExecutor().execute(new RestoreTabsetCommand(tabsetId, windowName, false))
      })
    } else {
      useCommandExecutor().execute(new RestoreTabsetCommand(tabsetId, windowName, false))
    }
  })
}
</script>
