import { deleteDoc, doc } from 'firebase/firestore'
import FirebaseServices from 'src/services/firebase/FirebaseServices'
import { useAuthStore } from 'stores/authStore'
import { useFirebaseServices } from 'src/services/firebase/useFirebaseServices'

export default function useSidePanelMessagesMarkupView() {
  const clearMessage = async (messageId: string) => {
    await deleteDoc(doc(useFirebaseServices().firebaseServices.getFirestore(), `users/${useAuthStore().user.uid}/messages/${messageId}`))
  }

  return {
    clearMessage,
  }
}
