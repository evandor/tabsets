import {defineStore} from "pinia";
import {Tab} from "src/models/Tab";
import ChromeListeners from "src/services/ChromeListeners";

export const useWindowsStore = defineStore('windows', {
  state: () => ({

    // not used yet
    currentWindow: null as unknown as number,

    // screenshot Window
    screenshotWindow: null as unknown as number,

    windows: [] as unknown as chrome.windows.Window[],


  }),

  getters: {

    pinnedTabs(state): Tab[] {
      return []
    },



  },

  actions: {
    async init() {
      chrome.windows.getAll((windows) => {
        console.log("get windows", windows)
        this.windows = windows
      })
    },
    initListeners() {
      if (process.env.MODE === 'bex') {
        chrome.windows.onCreated.addListener((window: chrome.windows.Window) => this.init())
        chrome.windows.onRemoved.addListener((window: number) => this.init())
        //chrome.windows.onFocusChanged.addListener((window: number) => this.init())
      }

    },

  }
});
