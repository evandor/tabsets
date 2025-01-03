import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useSearchStore } from 'src/search/stores/searchStore'
import { RestoreTabsetCommand } from 'src/tabsets/commands/RestoreTabset'
import { useThumbnailsService } from 'src/thumbnails/services/ThumbnailsService'

/**
 * meant for inter-submodule communication.
 *
 * We cannot use runtime messages for this, neither bex events. Submodule A can create an Event and let
 * this class dispatch it. Depending on the event name, different functions of other submodules can be
 * called.
 *
 * This class has to be implemented once-per-application if this kind of dispatch is needed.
 */
class AppEventDispatcher {
  dispatchEvent(name: string, params: object) {
    //console.debug(" >>> dispatching event", name, params)
    try {
      switch (name) {
        case 'add-to-search':
          useSearchStore().addObjectToIndex(params)
          break
        case 'upsert-in-search':
          useSearchStore().upsertObject(params)
          break
        case 'capture-screenshot':
          useThumbnailsService().handleCaptureCallback(params['tabId' as keyof object], params['data' as keyof object])
          break
        case 'restore-tabset':
          useCommandExecutor().execute(
            new RestoreTabsetCommand(params['tabsetId' as keyof object], params['label' as keyof object], true),
          )
          break
        default:
          console.log(`unknown event ${name}`)
      }
    } catch (err) {
      console.warn('problem dispatching event: ', err)
    }
  }
}

export default new AppEventDispatcher()
