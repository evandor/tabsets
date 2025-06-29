import { collection, deleteDoc, onSnapshot, QueryDocumentSnapshot, Unsubscribe } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { useEventsServices } from 'src/events/services/EventsServices'
import FirebaseServices from 'src/services/firebase/FirebaseServices'
import { ChangeInfo } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useAuthStore } from 'stores/authStore'
import { ref } from 'vue'

/**
 * events are triggered 'in the background', and should be used to update the applications state.
 */
export const useEventsStore = defineStore('events', () => {
  let unsubscribe: Unsubscribe | undefined = undefined

  const lastUpdate = ref<number>(new Date().getTime())

  //const events = ref<Event[]>([])

  function initialize() {
    // console.debug(` ...initializing eventsStore`)
    setUpSnapshotListener()
  }

  function setUpSnapshotListener() {
    // events.value = []
    let reloadTabset = false
    const userId = useAuthStore().user?.uid
    if (userId && unsubscribe === undefined) {
      unsubscribe = onSnapshot(collection(FirebaseServices.getFirestore(), 'users', userId, 'events'), (docs) => {
        // events.value = []
        //const source = doc.metadata.hasPendingWrites ? 'Local' : 'Server'
        const docsToDelete: QueryDocumentSnapshot[] = []
        docs.forEach((doc: QueryDocumentSnapshot) => {
          const changeInfo = doc.data() as ChangeInfo
          console.log(`[${changeInfo.event}]: `, changeInfo)
          // events.value.push(event)
          lastUpdate.value = new Date().getTime()

          const currentTs = useTabsetsStore().getCurrentTabset
          const eventTabsetId = changeInfo.tabsetId!

          switch (changeInfo.event) {
            case 'tab-added': {
              useEventsServices().addTabsetsEvent(eventTabsetId, ['tab-added:' + changeInfo.elementId])
              if (currentTs && currentTs.id === eventTabsetId) {
                console.log('reloading tabset!')
                reloadTabset = true
              }
              break
            }
            case 'tab-deleted':
              reloadTabset = true
              break
            case 'tabcomment-added': {
              useEventsServices().addTabsetsEvent(eventTabsetId, ['tabcomment-added:' + changeInfo.elementId])
              // const localStorageEvents: { added: string[]; removed: string[] } =
              //   useEventsServices().getLocalStorageEvents()
              // // const tabsetEvents: { [k: string]: object } = {}
              // tabsetEvents[eventTabsetId] = {
              //   added: localStorageEvents.added
              //     ? localStorageEvents.added.concat(['tabcomment-added:' + changeInfo.elementId])
              //     : ['tabcomment-added:' + changeInfo.elementId],
              //   removed: localStorageEvents.removed,
              // }
              // useEventsServices().updateTabsetEvents(tabsetEvents)
              reloadTabset = true
              break
            }
            default:
              console.warn(`unknown changeInfo event ${JSON.stringify(changeInfo)}`)
          }

          // mark for deletion
          docsToDelete.push(doc)
        })

        // clean up
        docsToDelete.forEach((doc) => {
          // console.log('doc', typeof doc, doc)
          deleteDoc(doc.ref).catch((err: any) => {
            console.warn('error deleting event', err)
          })
        })

        if (reloadTabset) {
          console.log('initiating reload')
          // TODO check: useTabsetsStore().reloadTabset(useTabsetsStore().getCurrentTabsetId()!)
          reloadTabset = false
        }
      })
    }
  }

  return {
    initialize,
    lastUpdate,
    //getUnreadMessages,
  }
})
