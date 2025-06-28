import { LocalStorage } from 'quasar'
import { useContentStore } from 'src/content/stores/contentStore'
import { useSettingsStore } from 'src/core/stores/settingsStore'
import { ComponentWithContext } from 'src/tabsets/actionHandling/TabActionMatcher'
import ConvertToCollectionAction from 'src/tabsets/actions/ConvertToCollectionAction.vue'
import DeleteFolderAction from 'src/tabsets/actions/DeleteFolderAction.vue'
import EditFolderAction from 'src/tabsets/actions/EditFolderAction.vue'
import ExportTabsetAction from 'src/tabsets/actions/ExportTabsetAction.vue'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import NewTabAction from 'src/tabsets/actions/NewTabAction.vue'
import OpenTabsetAction from 'src/tabsets/actions/OpenTabsetAction.vue'
import LoadRssFeedAction from 'src/tabsets/actions/rss/LoadRssFeedAction.vue'
import { Tabset, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'

export class DefaultActions {
  static getDefaultActions(currentTabset: Tabset | undefined, actionProps: ActionProps): ComponentWithContext[] {
    const actions: ComponentWithContext[] = []
    if (actionProps.level === 'folder') {
      actions.push({ component: EditFolderAction, context: {} })
    }

    if (currentTabset && currentTabset.type === TabsetType.SESSION) {
      actions.push({ component: ConvertToCollectionAction, context: {} })
    }

    if (useSettingsStore().has('DEV_MODE')) {
      actions.push({ component: ExportTabsetAction, context: {} })
    }

    if (LocalStorage.getItem('ui.newtab.installed') && actionProps.level === 'root') {
      actions.push({ component: NewTabAction, context: {} })
    }

    // open existing tabset for url
    if (!DefaultActions.alreadyInTabset() && DefaultActions.tabsetsForUrl().length > 0) {
      actions.push({ component: OpenTabsetAction, context: {} })
    }

    // actions.push(DeleteTabsetAction)
    if (actionProps.level === 'folder') {
      if (actionProps.folder && actionProps.folder.type === TabsetType.RSS_FOLDER) {
        actions.unshift({ component: LoadRssFeedAction, context: {} })
      }
      actions.push({ component: DeleteFolderAction, context: {} })
    }
    // console.log('action', actions)
    return actions
  }

  static alreadyInTabset = () => {
    return useTabsetService().urlExistsInCurrentTabset(useContentStore().getCurrentTabUrl)
  }

  static tabsetsForUrl = () => {
    const url = useContentStore().getCurrentTabUrl
    if (url) {
      return useTabsetService()
        .tabsetsFor(url)
        .map((tsId: string) => {
          return {
            label: '', //useTabsetService().nameForTabsetId(tsId),
            tabsetId: tsId,
          }
        })
    }
    return []
  }
}
