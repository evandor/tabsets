import { useBookmarksStore } from 'src/bookmarks/stores/bookmarksStore'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import StatsUtils from 'src/core/utils/StatsUtils'
import { useSearchStore } from 'src/search/stores/searchStore'
import { useMetrics } from 'src/services/Metrics'
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
  | 'run-metrics'

/**
 * meant for inter-submodule communication.
 *
 * We cannot use runtime messages for this, neither bex events, neither quasars event bus.
 * Submodule A can create an Event and let this class dispatch it. Depending on the event name,
 * different functions of other submodules can be called.
 *
 * This class has to be implemented once-per-application if this kind of dispatch is needed.
 */
class AppEventDispatcher {
  async dispatchEvent(name: DispatcherEvents, params: object = {}): Promise<object> {
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
          // TODO await usePagesStore().deletePage(params['tabId' as keyof object])
          const bookmarks = await useBookmarksStore().findBookmarksForUrl(params['url' as keyof object])
          return Promise.resolve({ name: 'bookmarks-found', bookmarks: bookmarks.length })
        case 'ignore_url':
          useCommandExecutor()
            .execute(new IgnoreUrlCommand(params['url' as keyof object]))
            .catch((err: any) => console.warn('error in IgnoreUrlCommand', err))
          return Promise.resolve({})
        case 'run-metrics':
          const stats = StatsUtils.calcStatsRows()
          useMetrics().count('tabsets', stats.find((s) => s.name === 'Tabsets')?.count || 0)
          useMetrics().count('tabs', stats.find((s) => s.name === 'Tabs')?.count || 0)
          useMetrics().count('spaces', stats.find((s) => s.name === 'Spaces')?.count || 0)
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
