<template>
  <q-menu :offset="[0, 0]">
    <q-list dense style="min-width: 200px">
      <template v-if="showTabDetailsMenuEntry(props['tab' as keyof object])">
        <q-item clickable v-close-popup @click.stop="showTabDetails(props['tab' as keyof object])">
          <q-item-section style="padding-right:0;min-width:25px;max-width: 25px;">
            <q-icon size="xs" name="o_info" color="accent"/>
          </q-item-section>
          <q-item-section>
            Show Tab Details (dev)
          </q-item-section>
        </q-item>
      </template>

      <q-separator inset/>
      <q-item clickable v-close-popup @click.stop="editURL(props['tab' as keyof object])">
        <q-item-section style="padding-right:0;min-width:25px;max-width: 25px;">
          <q-icon size="xs" name="o_edit" color="info"/>
        </q-item-section>
        <q-item-section>
          Edit Tab
        </q-item-section>
      </q-item>

      <template v-if="props.tabset?.type.toString() !== TabsetType.DYNAMIC.toString()">
        <q-item clickable
                v-close-popup @click.stop="addCommentDialog()">
          <q-item-section style="padding-right:0;min-width:25px;max-width: 25px;">
            <q-icon size="xs" name="o_note" color="info"/>
          </q-item-section>
          <q-item-section>
            Add Comment
          </q-item-section>
        </q-item>
      </template>

      <template v-if="useFeaturesStore().hasFeature(FeatureIdent.ADVANCED_TAB_MANAGEMENT)">
        <q-separator inset/>
        <q-item clickable v-close-popup @click.stop="assignTab(props['tab' as keyof object])">
          <q-item-section style="padding-right:0;min-width:25px;max-width: 25px;">
            <q-icon size="xs" name="o_tab" color="info"/>
          </q-item-section>
          <q-item-section>
            Tab Assignment
          </q-item-section>
        </q-item>
      </template>

      <template v-if="useFeaturesStore().hasFeature(FeatureIdent.COLOR_TAGS)">
        <q-separator inset/>
        <q-item clickable v-close-popup @click.stop="setColor(props['tab' as keyof object])">
          <q-item-section style="padding-right:0;min-width:25px;max-width: 25px;">
            <q-icon size="xs" name="o_colorize" color="blue"/>
          </q-item-section>
          <q-item-section>
            <div class="row q-pa-xs q-mt-none q-pl-sm q-gutter-sm">
              <ColorSelector @colorSet="(color:string) => theColor = color"/>
            </div>
          </q-item-section>
        </q-item>
      </template>

      <template v-if="useAuthStore().isAuthenticated">
        <q-separator inset/>
        <q-item clickable v-close-popup @click.stop="openSimilar()">
          <q-item-section style="padding-right:0;min-width:25px;max-width: 25px;">
            <q-icon size="xs" name="o_equal"/>
          </q-item-section>
          <q-item-section>
            Open similar websites
          </q-item-section>
        </q-item>
      </template>

      <q-separator inset/>
      <q-item clickable v-close-popup @click.stop="deleteTab()">
        <q-item-section style="padding-right:0;min-width:25px;max-width: 25px;">
          <q-icon size="xs" name="o_delete" color="negative"/>
        </q-item-section>
        <q-item-section>
          {{ deleteTabLabel(props['tab' as keyof object]) }}
        </q-item-section>
      </q-item>

    </q-list>
  </q-menu>
</template>

<script lang="ts" setup>

import {PropType, ref} from "vue";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {Notify, useQuasar} from "quasar";
import {Tab} from "src/tabsets/models/Tab";
import {DeleteTabCommand} from "src/domain/tabs/DeleteTabCommand";
import {useRouter} from "vue-router";
import NavigationService from "src/services/NavigationService";
import {Tabset, TabsetType} from "src/tabsets/models/Tabset";
import {FeatureIdent} from "src/models/FeatureIdent";
import {useBookmarksStore} from "src/bookmarks/stores/bookmarksStore";
import EditUrlDialog from "components/dialogues/EditUrlDialog.vue";
import {PlaceholdersType} from "src/tabsets/models/Placeholders";
import ColorSelector from "src/core/dialog/ColorSelector.vue";
import {UpdateTabColorCommand} from "src/domain/tabs/UpdateTabColor";
import CommentDialog from "components/dialogues/CommentDialog.vue";
import {api} from "boot/axios";
import _ from "lodash"
import {useAuthStore} from "stores/authStore";
import {NotificationType, useNotificationHandler} from "src/core/services/ErrorHandler";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {useFeaturesStore} from "src/features/stores/featuresStore";

const {handleSuccess, handleError} = useNotificationHandler()

const props = defineProps({
  tab: {type: Object as PropType<Tab>, required: true},
  tabset: {type: Object as PropType<Tabset>, required: false}
})

const emit = defineEmits(['toggleExpand']);

const $q = useQuasar()
const router = useRouter()

const theColor = ref<string | undefined>(undefined)

async function tabToUse(tab: Tab) {
  let useTab: Tab = tab
  if (tab.placeholders?.templateId) {
    const tabInfo = useTabsetsStore().getTabAndTabsetId(tab.placeholders?.templateId)
    if (tabInfo) {
      useTab = tabInfo.tab
      console.log("useTab", useTab, tab.placeholders?.templateId)
    }
  }
  return useTab;
}

const openSimilar = async () => {
  console.log("finding similar websites for", props.tab.url)
  try {
    const url = new URL(props.tab.url || '')
    const hostname = url.hostname
    const res = await api.post("https://us-central1-tabsets-dev.cloudfunctions.net/app/ra/similar", {"domain": hostname})
    const data = res.data
    console.log("res", res, data['similar_sites'])
    if (data['similar_sites']) {
      const urls = _.map(data['similar_sites'], u => "https://" + u)
      NavigationService.openOrCreateTab(urls)
      handleSuccess(new ExecutionResult("done", "opening " + urls.length + " similar page(s)"))
    }
  } catch (err) {
    console.log("got error", err)
    handleError("not able to find similar pages", NotificationType.TOAST)
  }
}

const deleteTab = async () => {
  const useTab = await tabToUse(props.tab)
  useCommandExecutor().executeFromUi(new DeleteTabCommand(useTab, props.tabset))
  if (useTab && useTab.url) {
    const res = await useBookmarksStore().findBookmarksForUrl(useTab.url)
    console.log("existing bookmarks", res)
    if (res.length > 0) {
      $q.dialog({
        title: res.length === 1 ? 'Found Bookmark with same URL' : 'Found Bookmarks with same URL',
        cancel: true,
        message: res.length === 1 ?
          'Do you want to delete this bookmark as well?' :
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


const addCommentDialog = () => $q.dialog({
  component: CommentDialog,
  componentProps: {tabId: props.tab.id, sharedId: props.tabset?.sharedId}
})

const showTabDetails = async (tab: Tab) => {
  const useTab: Tab = await tabToUse(tab)
  console.log("showing tab details for", useTab)
  router.push("/sidepanel/tab/" + useTab.id)
}

const showTabDetailsMenuEntry = (tab: Tab) =>
  useFeaturesStore().hasFeature(FeatureIdent.DEV_MODE)
//&& !(tab.placeholders?.type === PlaceholdersType.URL_SUBSTITUTION)

const deleteTabLabel = (tab: Tab) =>
  (tab.placeholders && tab.placeholders.type === PlaceholdersType.URL_SUBSTITUTION) ?
    'Delete all'
    :
    'Delete Tab'


const editURL = async (tab: Tab) => {
  let useTab = await tabToUse(tab);
  $q.dialog({
    component: EditUrlDialog,
    componentProps: {
      tab: useTab
    }
  })
}

const assignTab = async (tab: Tab) =>
  await NavigationService.openOrCreateTab([chrome.runtime.getURL("/www/index.html#/mainpanel/tabAssignment/" + tab.id)])


const setColor = (tab: Tab) => useCommandExecutor().execute(new UpdateTabColorCommand(tab, theColor.value))


</script>
