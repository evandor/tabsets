import {defineStore} from "pinia";
import _ from "lodash"

export const useWindowsStore = defineStore('windows', {
  state: () => ({

    currentWindow: null as unknown as chrome.windows.Window,
    lastFocusedWindow: null as unknown as chrome.windows.Window,

    // screenshot Window
    screenshotWindow: null as unknown as number,

    windows: [] as unknown as chrome.windows.Window[],

  }),

  getters: {},

  actions: {
    async init(trigger: string = "") {
      if (process.env.MODE === 'bex') {
        console.debug("initializing chrome windows listeners", trigger)
        chrome.windows.getAll((windows) => {
          this.windows = windows
        })
        chrome.windows.getCurrent({windowTypes: ['normal']}, (window: chrome.windows.Window) => {
          this.currentWindow = window
        })
        chrome.windows.getLastFocused({windowTypes: ['normal']}, (window: chrome.windows.Window) => {
          this.lastFocusedWindow = window
        })
      }
    },
    initListeners() {
      if (process.env.MODE === 'bex') {
        chrome.windows.onCreated.addListener((window: chrome.windows.Window) => this.init("onCreated"))
        chrome.windows.onRemoved.addListener((window: number) => this.init("onRemoved"))
        chrome.windows.onFocusChanged.addListener(() => this.init("onFocusChanged"))
      }
    }
  }
});
