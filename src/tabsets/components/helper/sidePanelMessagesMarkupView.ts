import { useMessagesStore } from 'src/messages/stores/messagesStore'

export default function useSidePanelMessagesMarkupView() {
  const clearMessage = async (messageId: string) => {
    useMessagesStore().deleteMessage(messageId)
  }

  return {
    clearMessage,
  }
}
