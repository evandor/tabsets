import {defineStore} from "pinia";
import {Tabset} from "src/models/Tabset";
import _ from "lodash";
import {Tab} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";

export const useNotificationsStore = defineStore('notifications', {
    state: () => ({
      info: '',
      selectedTab: null as unknown as Tab,
      fabHasElementAnimation: false
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
      }
    }
  }
)
