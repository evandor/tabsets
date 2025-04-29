import { useBookmarksStore } from 'src/bookmarks/stores/bookmarksStore'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useSearchStore } from 'src/search/stores/searchStore'
import { IgnoreUrlCommand } from 'src/tabsets/commands/IgnoreUrlCommand'
import { RestoreTabsetCommand } from 'src/tabsets/commands/RestoreTabset'
import { useThumbnailsService } from 'src/thumbnails/services/ThumbnailsService'

export type DispatcherEvents =
  | 'add-to-search'
  | 'upsert-in-search'
  | 'capture-screenshot'
  | 'add-to-index'
  | 'restore-tabset'
  | 'remove-captured-screenshot'
  | 'tab-deleted'
  | 'delete-bookmark-by-url'
  | 'ignore_url'

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
  async dispatchEvent(name: DispatcherEvents, params: object): Promise<object> {
    //console.debug(' >>> dispatching event', name, params)
    try {
      switch (name) {
        case 'add-to-search':
          useSearchStore().addObjectToIndex(params)
          return Promise.resolve({})
        case 'upsert-in-search':
          useSearchStore().upsertObject(params)
          return Promise.resolve({})
        case 'delete-bookmark-by-url':
          useBookmarksStore()
            .deleteByUrl(params['url' as keyof object])
            .then((count: number) => {
              // TODO cannot call handle success here (problem in tests)
              // handleSuccess(new ExecutionResult('', count + ' bookmark(s) deleted'))
            })
          //.catch(() => handleError('problem encountered'))

          return Promise.resolve({})
        case 'capture-screenshot':
          useThumbnailsService().handleCaptureCallback(
            params['tabId' as keyof object],
            params['tabsetId' as keyof object],
            params['data' as keyof object],
          )
          return Promise.resolve({})
        case 'restore-tabset':
          useCommandExecutor()
            .execute(
              new RestoreTabsetCommand(params['tabsetId' as keyof object], params['label' as keyof object], true),
            )
            .catch((err: any) => console.warn('error in RestoreTabsetCommand', err))
          return Promise.resolve({})
        case 'remove-captured-screenshot':
          useThumbnailsService()
            .removeThumbnailsFor(params['tabId' as keyof object])
            .catch((err: any) => console.warn('error deleting thumbnail', params, err))
          return Promise.resolve({})
        case 'tab-deleted':
          const bookmarks = await useBookmarksStore().findBookmarksForUrl(params['url' as keyof object])
          return Promise.resolve({ name: 'bookmarks-found', bookmarks: bookmarks.length })
        case 'ignore_url':
          useCommandExecutor()
            .execute(new IgnoreUrlCommand(params['url' as keyof object]))
            .catch((err: any) => console.warn('error in IgnoreUrlCommand', err))
          return Promise.resolve({})
        default:
          return Promise.reject(`unknown event ${name}`)
      }
    } catch (err: any) {
      console.warn('problem dispatching event: ', err)
      return Promise.reject('problem dispatching event: ' + err.toString())
    }
  }
}

export default new AppEventDispatcher()
