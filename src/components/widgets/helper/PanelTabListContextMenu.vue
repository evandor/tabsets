<template>
  <q-menu :offset="[0, 0]">
    <q-list dense style="min-width: 200px">
      <template v-if="showTabDetailsMenuEntry(props['tab' as keyof object])">
        <q-separator />
        <q-item clickable v-close-popup @click.stop="showTabDetails(props['tab' as keyof object])">
          <q-item-section avatar style="padding-right:0;min-width:25px;max-width: 25px;">
            <q-icon size="xs" name="o_info" color="accent"/>
          </q-item-section>
          <q-item-section>
            Show Tab Details
          </q-item-section>
        </q-item>
      </template>

      <q-separator/>
      <q-item v-if="useSettingsStore().isEnabled('dev')"
              clickable v-close-popup @click.stop="openInReadingMode(props['tab' as keyof object])">
        <q-item-section avatar style="padding-right:0;min-width:25px;max-width: 25px;">
          <q-icon size="xs" name="o_article" color="accent"/>
        </q-item-section>
        <q-item-section>
          Open in Reading Mode
        </q-item-section>
      </q-item>

      <q-item v-if="usePermissionsStore().hasFeature(FeatureIdent.ANNOTATIONS)"
              clickable v-close-popup @click.stop="openInAnnotationMode(props['tab' as keyof object])">
        <q-item-section avatar style="padding-right:0;min-width:25px;max-width: 25px;">
          <q-icon size="xs" name="o_article" color="accent"/>
        </q-item-section>
        <q-item-section>
          Open in Annotation Mode
        </q-item-section>
      </q-item>

      <template v-if="props.tabsetType.toString() !== TabsetType.DYNAMIC.toString()">
        <q-separator/>
        <q-item clickable
                v-close-popup @click.stop="editNoteDialog(props['tab' as keyof object])">
          <q-item-section avatar style="padding-right:0;min-width:25px;max-width: 25px;">
            <q-icon size="xs" name="o_note" color="accent"/>
          </q-item-section>
          <q-item-section>
            Add / Edit Note
          </q-item-section>
        </q-item>
      </template>

      <q-separator/>
      <q-item clickable v-close-popup @click.stop="copyToClipboard(props['tab' as keyof object])">
        <q-item-section avatar style="padding-right:0;min-width:25px;max-width: 25px;">
          <q-icon size="xs" name="o_link" color="accent"/>
        </q-item-section>
        <q-item-section>
          Copy URL to Clipboard
        </q-item-section>
      </q-item>

      <q-separator/>
      <q-item clickable v-close-popup @click.stop="editURL(props['tab' as keyof object])">
        <q-item-section avatar style="padding-right:0;min-width:25px;max-width: 25px;">
          <q-icon size="xs" name="o_link" color="accent"/>
        </q-item-section>
        <q-item-section>
          Edit URL
        </q-item-section>
      </q-item>

      <q-separator/>
      <q-item clickable v-close-popup @click.stop="deleteTab(props['tab' as keyof object])">
        <q-item-section avatar style="padding-right:0;min-width:25px;max-width: 25px;">
          <q-icon size="xs" name="o_delete" color="negative"/>
        </q-item-section>
        <q-item-section>
          {{ deleteTabLabel(props['tab' as keyof object])}}
        </q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>

<script lang="ts" setup>

import {PropType} from "vue";
import {useCommandExecutor} from "src/services/CommandExecutor";
import RestoreTabsetDialog from "components/dialogues/RestoreTabsetDialog.vue";
import {Notify, useQuasar} from "quasar";
import {DrawerTabs, useUiStore} from "src/stores/uiStore";
import {Tab} from "src/models/Tab";
import {DeleteTabCommand} from "src/domain/tabs/DeleteTabCommand";
import EditNoteDialog from "components/dialogues/EditNoteDialog.vue";
import {useRouter} from "vue-router";
import {useSettingsStore} from "stores/settingsStore";
import {CopyToClipboardCommand} from "src/domain/commands/CopyToClipboard";
import NavigationService from "src/services/NavigationService";
import {TabsetType} from "src/models/Tabset";
import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {useBookmarksStore} from "stores/bookmarksStore";
import EditUrlDialog from "components/dialogues/EditUrlDialog.vue";
import {useTabsStore} from "stores/tabsStore";
import {PlaceholdersType} from "src/models/Placeholders";

const props = defineProps({
  tab: {type: Object as PropType<Tab>, required: true},
  tabsetType: {type: String, default: TabsetType.DEFAULT.toString()}
})

const emit = defineEmits(['toggleExpand']);

const $q = useQuasar()
const router = useRouter()

async function tabToUse(tab: Tab) {
  let useTab: Tab = tab
  if (tab.placeholders?.templateId) {
    const tabInfo = await useTabsStore().getTab(tab.placeholders?.templateId)
    if (tabInfo) {
      useTab = tabInfo['tab' as keyof object]
      console.log("useTab", useTab, tab.placeholders?.templateId)
    }
  }
  return useTab;
}

const showDetails = (tabsetId: string) =>
    useUiStore().rightDrawerSetActiveTab(DrawerTabs.TABSET_DETAILS)

const restoreDialog = (tabsetId: string) => $q.dialog({
  component: RestoreTabsetDialog,
  componentProps: {tabsetId: tabsetId}
})


const deleteTab = async (tabIn: Tab) => {
  const useTab = await tabToUse(tabIn)
  useCommandExecutor().executeFromUi(new DeleteTabCommand(useTab))
  if (useTab && useTab.url && usePermissionsStore().hasFeature(FeatureIdent.BOOKMARKS)) {
    const res = await useBookmarksStore().findBookmarksForUrl(useTab.url)
    console.log("existing bookmarks", res)
    if (res.length > 0) {
      $q.dialog({
        title: res.length === 1 ? 'Found Bookmark with same URL' : 'Found Bookmarks with same URL',
        cancel:true,
        message: res.length === 1 ?
            'Do you want to delete this bookmark as well?':
            'Do you want to delete these ' + res.length + ' bookmarks as well?'
      }).onOk(() => {
        res.forEach(bm => {
          chrome.bookmarks.remove(bm.id)
        })
        Notify.create({
          color: 'positive',
          message: res.length === 1 ? 'Deleted one bookmark' : 'Deleted ' + res.length + ' bookmarks'
        })
      }).onCancel(() => {
      }).onDismiss(() => {
      })
    }
  }
}


const editNoteDialog = (tab: Tab) => $q.dialog({
  component: EditNoteDialog,
  componentProps: {tabId: tab.id, note: tab.note}
})

const showTabDetails = async (tab: Tab) => {
  const useTab:Tab = await tabToUse(tab)
  console.log("showing tab details for", useTab)
  router.push("/sidepanel/tab/" + useTab.id)
}

const openInReadingMode = (tab: Tab) => {
  console.log("showing tab in reading mode", tab)
  const url = chrome.runtime.getURL("/www/index.html#/mainpanel/readingmode/" + tab.id)
  NavigationService.openOrCreateTab(url)
}

const openInAnnotationMode = (tab: Tab) => {
  console.log("showing tab in annotation mode", tab)
  //const url = chrome.runtime.getURL("/www/index.html#/mainpanel/readingmode/" + tab.id)
  NavigationService.openOrCreateTab(tab.url || '')// + "?tabId=" + tab.id)
}

const copyToClipboard = (tab: Tab) =>
  useCommandExecutor().executeFromUi(new CopyToClipboardCommand(tab.url || 'unknown'))

const showTabDetailsMenuEntry = (tab:Tab) =>
    useSettingsStore().isEnabled('dev')
    //&& !(tab.placeholders?.type === PlaceholdersType.URL_SUBSTITUTION)

const deleteTabLabel = (tab:Tab) => {
  if (tab.placeholders && tab.placeholders.type === PlaceholdersType.URL_SUBSTITUTION) {
    return 'Delete substituted Tabs'
  }
  return 'Delete Tab'
}

const editURL = async (tab: Tab) => {
  let useTab = await tabToUse(tab);
  $q.dialog({
    component: EditUrlDialog,
    componentProps: {
      tab: useTab
    }
  })
}

</script>
