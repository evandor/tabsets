import {defineStore} from "pinia";
import {Tab} from "src/models/Tab";
import {Notification} from "src/models/Notification"
import _ from "lodash"

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
      updateToVersion: '',
      notifications: [] as unknown as Notification[]
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
        console.log("updateToVersion set to ", this.updateToVersion)
      },
      getNotification(notificationId: string): Notification | undefined {
        const r: any[] = _.filter(this.notifications, (n: Notification) => n.id === notificationId)
        if (r && r.length > 0) {
          return r[0]
        }
        return undefined
      }
    }
  }
)
