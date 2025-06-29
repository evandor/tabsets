import { deleteDoc, doc } from 'firebase/firestore'
import FirebaseServices from 'src/services/firebase/FirebaseServices'
import { useAuthStore } from 'stores/authStore'

export default function useSidePanelMessagesMarkupView() {
  const clearMessage = async (messageId: string) => {
    await deleteDoc(doc(FirebaseServices.getFirestore(), `users/${useAuthStore().user.uid}/messages/${messageId}`))
  }

  return {
    clearMessage,
  }
}
