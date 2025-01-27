import { LocalStorage } from 'quasar'
import { Tab } from 'src/tabsets/models/Tab'

export function useEventsServices() {
  const getLocalStorageEvents = (): { added: string[]; removed: string[] } => {
    return (
      (LocalStorage.getItem('ui.events.tabsets') as {
        added: string[]
        removed: string[]
      }) || { added: [], removed: [] }
    )
  }

  const updateTabsetEvents = (tabsetEvents: { [p: string]: object }) => {
    LocalStorage.setItem('ui.events.tabsets', tabsetEvents)
  }

  const addTabsetsEvent = (eventTabsetId: string, events: string[]) => {
    const localStorageEvents: { added: string[]; removed: string[] } = getLocalStorageEvents()
    const tabsetEvents: { [k: string]: object } = {}

    tabsetEvents[eventTabsetId] = {
      added: localStorageEvents.added ? localStorageEvents.added.concat(events) : events,
      removed: localStorageEvents.removed,
    }
    updateTabsetEvents(tabsetEvents)
  }

  const removeTabsetEvent = (eventTabsetId: string, identifier: string, commentId: string) => {
    console.log('removing tabset event', eventTabsetId, identifier, commentId)
    const localStorageEvents = getLocalStorageEvents()
    const tabsetEvents: { [k: string]: object } = {}
    tabsetEvents[eventTabsetId] = {
      added: localStorageEvents.added
        ? localStorageEvents.added.filter((a: string) => a !== identifier + ':' + commentId)
        : [],
      removed: localStorageEvents.removed,
    }
    updateTabsetEvents(tabsetEvents)
  }

  const listNewComments = (tabsetId: string, tab: Tab): string[] => {
    let found: string[] = []
    if (tabsetId && tab) {
      const tabsetEvents = ((LocalStorage.getItem('ui.events.tabsets') as object) || {})[tabsetId as keyof object] as
        | {
            added: string[]
            removed: string[]
          }
        | undefined
      if (tabsetEvents?.added) {
        for (const c of tab.comments) {
          if (
            tabsetEvents.added.findIndex((a: string) => {
              //console.log('checking tabsetEvents', a, c.id, a.endsWith(c.id))
              return a.endsWith(c.id)
            }) >= 0
          ) {
            found.push(c.id)
          }
        }
        return found
      }
    }
    return []
  }

  return {
    // getLocalStorageEvents,
    // updateTabsetEvents,
    addTabsetsEvent,
    removeTabsetEvent,
    listNewComments,
  }
}
