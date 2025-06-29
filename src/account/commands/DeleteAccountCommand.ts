import { deleteUser, getAuth } from 'firebase/auth/web-extension'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useUtils } from 'src/core/services/Utils'
import { Space } from 'src/spaces/models/Space'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

export default class DeleteAccountCommand implements Command<any> {
  async execute(): Promise<ExecutionResult<any>> {
    const { sendMsg } = useUtils()
    const auth = getAuth()
    const user2 = auth.currentUser
    if (user2) {
      try {
        localStorage.clear()
        await chrome.storage.local.clear()
        await chrome.storage.sync.clear()

        for (const ts of useTabsetsStore().tabsets.values()) {
          await useTabsetsStore().deleteTabset(ts.id)
        }

        for (const space of useSpacesStore().spaces.values()) {
          useSpacesStore().deleteById(space.id)
        }

        useTabsetsStore().tabsets = new Map<string, Tabset>()
        useSpacesStore().spaces = new Map<string, Space>()

        //sendMsg('reload-application', { initiatedBy: 'DeleteAccountCommand' })

        // alert('user account has been deleted')
        // await chrome.sidePanel.setOptions({ enabled: false })
        await deleteUser(user2)
        //window.close()
        chrome.runtime.reload()
      } catch (error) {
        console.warn(error)
        alert(error)
        //window.close()
        chrome.runtime.reload()
        // return Promise.reject(error)
      }
      return Promise.resolve(new ExecutionResult('', 'done'))
    } else {
      return Promise.reject('could not find current user')
    }
  }
}

DeleteAccountCommand.prototype.toString = function cmdToString() {
  return `DeleteAccountCommand: {}`
}
