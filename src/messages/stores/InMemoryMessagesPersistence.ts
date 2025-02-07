import MessagesPersistence from 'src/messages/persistence/MessagesPersistence'
import { Message } from 'src/tabsets/models/Message'

class InMemoryMessagesPersistence implements MessagesPersistence {
  messages: Message[] = []

  getServiceName(): string {
    return this.constructor.name
  }

  async init() {
    this.messages = []
    return Promise.resolve()
  }

  compactDb(): Promise<any> {
    return Promise.resolve(undefined)
  }

  getMessages(): Message[] {
    return this.messages
  }

  addMessage(msg: Message): Message {
    this.messages.push(msg)
    console.log('messages set to', this.messages)
    return msg
  }
}

export default new InMemoryMessagesPersistence()
