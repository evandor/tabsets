import { onValue, ref, remove } from 'firebase/database'
import { uid } from 'quasar'
import { FirestoreMessage } from 'src/core/models/FirestoreMessage'
import { useMessagesStore } from 'src/messages/stores/messagesStore'
import FirebaseServices from 'src/services/firebase/FirebaseServices'
import { Message } from 'src/tabsets/models/Message'
import { TabComment } from 'src/tabsets/models/Tab'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useAuthStore } from 'stores/authStore'

class FirebaseListener {
  startListening() {
    const db = FirebaseServices.getDatabase()
    this.startTabsetListener()
    const listeningPath = `messages/recipient/${useAuthStore().user.uid}`
    console.log('listening to ', listeningPath)
    const listeningRef = ref(db, listeningPath)
    onValue(listeningRef, async (snapshot) => {
      const data = snapshot.val()
      console.log('got realtime db update', data)
      if (!data) {
        return
      }
      const message = data as FirestoreMessage
      const keys = Object.keys(data)
      const tabsetId = message.tabsetId
      const type = message.type
      console.log('checking tabset id', tabsetId, type)

      switch (type) {
        case 'new-comment':
          const tabset = useTabsetsStore().getTabset(tabsetId)
          if (tabset) {
            // user owns tabset
            console.log(`about to add comment ${message.tabId} in ts ${message.tabsetId}`)
            const tabAndTsId = useTabsetsStore().getTabAndTabsetId(message.tabId)
            if (tabAndTsId) {
              tabAndTsId.tab.comments.push(message.data as TabComment)
              await useTabsetsStore().saveTabset(tabset)
              await remove(listeningRef)
              useMessagesStore().addMessage(
                new Message(
                  uid(),
                  new Date().getTime(),
                  new Date().getTime(),
                  'new',
                  'got reply',
                  'tabset://' + tabset.id,
                ),
              )
            }
          }

          break
        default:
          console.log(`unknown message type ${type}`)
      }
    })
  }

  private startTabsetListener() {
    const listeningPath = `messages/recipient/${useAuthStore().user.uid}`
    console.log('listening to ', listeningPath)
    const db = FirebaseServices.getDatabase()
    //const listeningRef = ref(this.db, listeningPath)
    // onValue(listeningRef, (snapshot) => {
    //   const data = snapshot.val()
    //   console.log('got realtime db update', data)
    //   if (!data) {
    //     return
    //   }
    // })
  }
}

export default new FirebaseListener()
