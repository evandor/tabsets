import { useUtils } from 'src/core/services/Utils'

const { inBexMode } = useUtils()

class WindowsListenerConfig {
  onWindowsCreatedListener: undefined | ((cw: chrome.windows.Window) => void) = undefined

  addOnWindowsCreatedListener(listener: (cw: chrome.windows.Window) => void) {
    if (inBexMode()) {
      // console.debug(' ...initializing windowsStore Listeners!')
      this.onWindowsCreatedListener = listener
      chrome.windows.onCreated.addListener(listener)
    }
  }

  async resetListeners() {
    if (this.onWindowsCreatedListener) {
      chrome.windows.onCreated.removeListener(this.onWindowsCreatedListener)
      this.onWindowsCreatedListener = undefined
    }
  }
}

export default new WindowsListenerConfig()
