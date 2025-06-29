import { defineStore } from 'pinia'
import InMemoryMessagesPersistence from 'src/messages/stores/InMemoryMessagesPersistence'
import { Message } from 'src/tabsets/models/Message'
import { computed, ref } from 'vue'

/**
 * messages are displayed to the user to inform her about things happening.
 */
export const useMessagesStore = defineStore('messages', () => {
  const lastUpdate = ref<number>(new Date().getTime())
  const messages = ref<Message[]>([])

  function initialize() {
    messages.value = InMemoryMessagesPersistence.getMessages()
  }

  function addMessage(msg: Message, removeOlder: boolean = false) {
    if (removeOlder) {
      messages.value = messages.value.filter(
        (m: Message) => m.message !== msg.message || m.actionPath !== msg.actionPath,
      )
    }
    messages.value.push(msg)
  }

  function deleteMessage(msgId: string) {
    console.log('deleting msg', msgId)
    messages.value = messages.value.filter((m: Message) => m.id !== msgId)
  }

  const getUnreadMessages = computed(() => messages.value.sort((a: Message, b: Message) => b.created - a.created))

  return {
    initialize,
    addMessage,
    deleteMessage,
    getUnreadMessages,
  }
})
