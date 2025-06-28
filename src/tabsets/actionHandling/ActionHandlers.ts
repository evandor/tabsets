import { QVueGlobals } from 'quasar'
import { useContentStore } from 'src/content/stores/contentStore'
import { ActionHandlerButtonClickedHolder } from 'src/tabsets/actionHandling/model/ActionHandlerButtonClickedHolder'
import { ClickedHandler, TabActionMatcher } from 'src/tabsets/actionHandling/TabActionMatcher'
import { TabActionMatchers } from 'src/tabsets/actionHandling/TabActionMatchers'
import { Tabset } from 'src/tabsets/models/Tabset'

export function useActionHandlers($q: QVueGlobals | undefined) {
  const actionHandlerRepo = new TabActionMatchers($q)

  function getHandler(url?: string, folder?: Tabset): TabActionMatcher {
    //console.log(`getHandler for '${url}', folderId=${folder?.id}, type=${folder?.type}`)
    // if (folder && folder.type === TabsetType.RSS_FOLDER) {
    //   return new RssFolderHandler($q)
    // }
    const metas = useContentStore().getCurrentTabMetas
    const content = useContentStore().getCurrentTabContent
    const handler = url
      ? actionHandlerRepo.handlerFor(url, content || '', metas || {}, folder)
      : actionHandlerRepo.defaultAddUrlToTabsetHandler
    return handler
  }

  async function handleClick(
    tabset: Tabset,
    chromeTab: chrome.tabs.Tab,
    args: ActionHandlerButtonClickedHolder,
    folder: Tabset | undefined,
  ) {
    const handler = args.actionHandler

    //console.log('handleClick', args)

    if (args.actionContext?.clicked) {
      console.log('executing...')
      await args.actionContext.clicked.apply(null, [chromeTab, tabset, folder, { action: args.actionContext }])
      return
    }

    if (args.actionContext?.dialog) {
      console.log('executing dialog...', args.actionContext)

      const r = await args.actionContext.dialog.apply(null, [args.actionContext.$q!])

      r.onOk((payload: any) => {
        console.log('-payload-', payload)
        const onOkHandler: (payload: any) => ClickedHandler = args.actionContext!.ok!
        const h = onOkHandler.apply(null, [payload])
        h.apply(null, [
          chromeTab,
          tabset,
          folder,
          { action: args.actionContext!, data: { filename: payload }, dialog: payload },
        ])
      })
      return
    }
  }

  return {
    getHandler,
    handleClick,
  }
}
