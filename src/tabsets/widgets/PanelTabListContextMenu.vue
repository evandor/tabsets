<template>
  <q-menu :offset="[0, 7]" @click.stop="">
    <q-list dense style="min-width: 200px">
      <PanelTabListContextMenuHook
        :tab="props.tab"
        :tabset="props.tabset!"
        v-if="props.tabset!.type !== TabsetType.SPECIAL" />

      <template v-if="props.viewContext != 'popup'">
        <template v-if="showTabDetailsMenuEntry(props['tab' as keyof object])">
          <q-item clickable v-close-popup @click.stop="showTabDetails(props['tab' as keyof object])">
            <q-item-section style="padding-right: 0; min-width: 25px; max-width: 25px">
              <q-icon size="xs" name="o_info" color="accent" />
            </q-item-section>
            <q-item-section> Tab Details (dev)</q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click.stop="showTabsJson(props['tab' as keyof object])">
            <q-item-section style="padding-right: 0; min-width: 25px; max-width: 25px">
              <q-icon size="xs" name="o_info" color="accent" />
            </q-item-section>
            <q-item-section>Tab's JSON</q-item-section>
          </q-item>
        </template>

        <q-separator inset />
        <q-item clickable v-close-popup @click.stop="editURL(props['tab' as keyof object])">
          <q-item-section style="padding-right: 0; min-width: 25px; max-width: 25px">
            <q-icon size="xs" name="o_edit" color="info" />
          </q-item-section>
          <q-item-section> Edit Tab</q-item-section>
        </q-item>

        <template v-if="props.tabset?.type.toString() !== TabsetType.DYNAMIC.toString()">
          <q-item clickable v-close-popup @click.stop="addCommentDialog()">
            <q-item-section style="padding-right: 0; min-width: 25px; max-width: 25px">
              <q-icon size="xs" name="o_note" color="info" />
            </q-item-section>
            <q-item-section>Add Comment</q-item-section>
          </q-item>
        </template>

        <template
          v-if="
            (useFeaturesStore().hasFeature(FeatureIdent.PIN_TAB) &&
              hasSubfolder() &&
              useUiStore().folderStyle === 'goInto') ||
            props.tab?.pinnedInList
          ">
          <q-separator inset />
          <q-item clickable v-close-popup @click.stop="togglePin()">
            <q-item-section style="padding-right: 0; min-width: 25px; max-width: 25px">
              <q-icon size="xs" :name="props.tab?.pinnedInList ? 'sym_o_keep_off' : 'sym_o_keep'" color="warning" />
            </q-item-section>
            <q-item-section v-if="props.tab?.pinnedInList">Unpin Tab</q-item-section>
            <q-item-section v-else>Pin Tab</q-item-section>
          </q-item>
        </template>

        <template
          v-if="
            useFeaturesStore().hasFeature(FeatureIdent.ADVANCED_TAB_MANAGEMENT) &&
            props.tabset!.type !== TabsetType.SPECIAL &&
            !fullpageView
          ">
          <q-separator inset />
          <q-item clickable v-close-popup @click.stop="assignTab(props['tab' as keyof object])">
            <q-item-section style="padding-right: 0; min-width: 25px; max-width: 25px">
              <q-icon size="xs" name="o_tab" color="info" />
            </q-item-section>
            <q-item-section> Tab Assignment</q-item-section>
          </q-item>
        </template>

        <template
          v-if="useFeaturesStore().hasFeature(FeatureIdent.COLOR_TAGS) && props.tabset!.type !== TabsetType.SPECIAL">
          <q-separator inset />
          <q-item clickable v-close-popup @click.stop="setColor(props['tab' as keyof object])">
            <q-item-section style="padding-right: 0; min-width: 25px; max-width: 25px">
              <q-icon size="xs" name="o_colorize" color="blue" />
            </q-item-section>
            <q-item-section>
              <div class="row q-pa-xs q-mt-none q-pl-sm q-gutter-sm">
                <ColorSelector @colorSet="(color: string) => (theColor = color)" />
              </div>
            </q-item-section>
          </q-item>
        </template>

        <!--      <template v-if="useAuthStore().isAuthenticated">-->
        <!--        <q-separator inset/>-->
        <!--        <q-item clickable v-close-popup @click.stop="openSimilar()">-->
        <!--          <q-item-section style="padding-right:0;min-width:25px;max-width: 25px;">-->
        <!--            <q-icon size="xs" name="o_equal"/>-->
        <!--          </q-item-section>-->
        <!--          <q-item-section>-->
        <!--            Open similar websites-->
        <!--          </q-item-section>-->
        <!--        </q-item>-->
        <!--      </template>-->

        <q-item
          v-if="useFeaturesStore().hasFeature(FeatureIdent.MONITOR) && props.tabset!.type !== TabsetType.SPECIAL"
          clickable
          v-close-popup
          @click.stop="openMonitoringDialog()">
          <q-item-section style="padding-right: 0; min-width: 25px; max-width: 25px">
            <q-icon size="xs" name="o_notifications" color="accent" />
          </q-item-section>
          <q-item-section v-if="isMonitoring()">Stop Monitoring</q-item-section>
          <q-item-section v-else>Monitor Changes</q-item-section>
        </q-item>

        <q-item
          v-if="useFeaturesStore().hasFeature(FeatureIdent.REMINDER) && props.tabset!.type !== TabsetType.SPECIAL"
          clickable
          v-close-popup
          @click.stop="openReminderDialog()">
          <q-item-section style="padding-right: 0; min-width: 25px; max-width: 25px">
            <q-icon size="xs" name="o_alarm" color="accent" />
          </q-item-section>
          <q-item-section> {{ props.tab.reminder ? 'Update' : 'Add' }} Reminder</q-item-section>
        </q-item>

        <q-separator inset />
      </template>
      <q-item clickable v-close-popup @click.stop="deleteTab()">
        <q-item-section style="padding-right: 0; min-width: 25px; max-width: 25px">
          <q-icon size="xs" name="o_delete" color="negative" />
        </q-item-section>
        <q-item-section>
          {{ deleteTabLabel(props['tab' as keyof object]) }}
        </q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar'
import PanelTabListContextMenuHook from 'src/app/hooks/tabsets/PanelTabListContextMenuHook.vue'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import ColorSelector from 'src/core/dialog/ColorSelector.vue'
import { ViewContext } from 'src/core/models/ViewContext'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useNavigationService } from 'src/core/services/NavigationService'
import { useSettingsStore } from 'src/core/stores/settingsStore'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import NavigationService from 'src/services/NavigationService'
import { DeleteTabCommand } from 'src/tabsets/commands/DeleteTabCommand'
import { UpdateTabColorCommand } from 'src/tabsets/commands/UpdateTabColor'
import CommentDialog from 'src/tabsets/dialogues/CommentDialog.vue'
import EditUrlDialog from 'src/tabsets/dialogues/EditUrlDialog.vue'
import MonitorChangesDialog from 'src/tabsets/dialogues/MonitorChangesDialog.vue'
import ReminderDialog from 'src/tabsets/dialogues/ReminderDialog.vue'
import { PlaceholdersType } from 'src/tabsets/models/Placeholders'
import { Tab } from 'src/tabsets/models/Tab'
import { MonitoredTab, Tabset, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useUiStore } from 'src/ui/stores/uiStore'
import { PropType, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({
  tab: { type: Object as PropType<Tab>, required: true },
  tabset: { type: Object as PropType<Tabset>, required: false },
  tabsetId: { type: String, required: false },
  viewContext: { type: String as PropType<ViewContext>, default: 'default' },
})

const emit = defineEmits(['toggleExpand'])

const $q = useQuasar()
const router = useRouter()
const route = useRoute()
const fullpageView = route.fullPath.startsWith('/sidepanel/tabsets/')

const theColor = ref<string | undefined>(undefined)

async function tabToUse(tab: Tab) {
  let useTab: Tab = tab
  if (tab.placeholders?.templateId) {
    const tabInfo = useTabsetsStore().getTabAndTabsetId(tab.placeholders?.templateId)
    if (tabInfo) {
      useTab = tabInfo.tab
      console.log('useTab', useTab, tab.placeholders?.templateId)
    }
  }
  return useTab
}

const deleteTab = async () => {
  const useTab = await tabToUse(props.tab)
  let useTabset = props.tabset
  if (!useTabset && props.tabsetId) {
    useTabset = useTabsetsStore().getTabset(props.tabsetId)
  }
  if (useTabset) {
    useCommandExecutor().executeFromUi(new DeleteTabCommand(useTab, useTabset))
  }
}

const showTabDetails = async (tab: Tab) => {
  const useTab: Tab = await tabToUse(tab)
  router.push('/sidepanel/tab/' + useTab.id)
}

const showTabsJson = async (tab: Tab) => {
  const useTab: Tab = await tabToUse(tab)
  useNavigationService().browserTabFor(chrome.runtime.getURL(`/www/index.html#/mainpanel/tab/${useTab.id}?tab=debug`))
}

const showTabDetailsMenuEntry = (tab: Tab) => useSettingsStore().has('DEV_MODE') && !fullpageView

const deleteTabLabel = (tab: Tab) =>
  tab.placeholders && tab.placeholders.type === PlaceholdersType.URL_SUBSTITUTION ? 'Delete all' : 'Delete Tab'

const editURL = async (tab: Tab) => {
  let useTab = await tabToUse(tab)
  $q.dialog({
    component: EditUrlDialog,
    componentProps: {
      tab: useTab,
    },
  })
}

const assignTab = async (tab: Tab) =>
  await NavigationService.openOrCreateTab([chrome.runtime.getURL('/www/index.html#/mainpanel/tabAssignment/' + tab.id)])

const setColor = (tab: Tab) => useCommandExecutor().execute(new UpdateTabColorCommand(tab, theColor.value))

const addCommentDialog = () =>
  $q.dialog({
    component: CommentDialog,
    componentProps: { tabId: props.tab.id, sharedId: props.tabset?.sharing?.sharedId },
  })

const openReminderDialog = () =>
  $q.dialog({
    component: ReminderDialog,
    componentProps: { tabId: props.tab.id, date: props.tab.reminder, comment: props.tab?.reminderComment },
  })

const isMonitoring = (): boolean => {
  const ts = useTabsetsStore().getCurrentTabset
  return (
    (ts && ts.monitoredTabs && ts.monitoredTabs.findIndex((mt: MonitoredTab) => mt.tabId === props.tab.id) >= 0) ||
    false
  )
}

const openMonitoringDialog = () => {
  const monitored = isMonitoring()
  $q.dialog({
    component: MonitorChangesDialog,
    componentProps: { monitored: monitored, tab: props.tab },
  })
}

const hasSubfolder = () => {
  if (!props.tabset) {
    return false
  }
  const activeFolder = useTabsetsStore().getActiveFolder(props.tabset)
  return activeFolder ? activeFolder.folders.length > 0 : false
}

const togglePin = () => {
  if (!props.tabset) {
    return
  }
  props.tab.pinnedInList = props.tab.pinnedInList ? !props.tab.pinnedInList : true
  useTabsetsStore().saveTabset(props.tabset)
}
</script>
