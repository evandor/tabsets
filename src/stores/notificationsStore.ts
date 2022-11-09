import {defineStore} from "pinia";
import {Tab} from "src/models/Tab";

export const useNotificationsStore = defineStore('notifications', {
    state: () => ({
      info: '',
      selectedTab: null as unknown as Tab,
      showBookmarks: false,
      showOpenTabs: false,
      showDrawer: false,
      bookmarksActive: false,
      bookmarksExpanded: [] as unknown as string[],
      fabHasElementAnimation: false,
      updateToVersion: ''
    }),
    getters: {},
    actions: {
      setInfo(msg: string) {
        this.info = msg
      },
      setSelectedTab(tab: Tab) {
        this.selectedTab = tab
      },
      unsetSelectedTab() {
        this.selectedTab = null as unknown as Tab
      },
      animateFab() {
        this.fabHasElementAnimation = true;
        setTimeout(() => this.fabHasElementAnimation = false, 1000);
      },
      updateAvailable(available: boolean, version: string = '') {
        this.updateToVersion = available ? version : '';
      }
    }
  }
)
