import {defineStore} from "pinia";
import {Tabset} from "src/models/Tabset";
import _ from "lodash";
import {Tab} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";

export const useNotificationsStore = defineStore('notifications', {
    state: () => ({
      info: 'Welcome to Tabset Extension'
    }),
    getters: {},
    actions: {
      setInfo(msg: string) {
        this.info = msg
      }
    }
  }
)
