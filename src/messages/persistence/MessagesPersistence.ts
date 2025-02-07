import Persistence from 'src/core/persistence/Persistence'
import { Message } from 'src/tabsets/models/Message'

interface MessagesPersistence extends Persistence {
  addMessage(msg: Message): Message

  getMessages(): Message[]
}

export default MessagesPersistence
