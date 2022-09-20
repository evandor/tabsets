import {defineStore} from 'pinia';
import _ from 'lodash'
import {LocalStorage, uid} from "quasar";
import {Tabset} from "src/models/Tabset";
import {Tab, TabStatus} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import ChromeListeners from "src/services/ChromeListeners";
import ChromeApi from "src/services/ChromeApi";
import {NewOrReplacedTabset} from "src/models/NewOrReplacedTabset";
import {useTabGroupsStore} from "stores/tabGroupsStore";
import {Group} from "src/models/Group";


export const useFeatureTogglesStore = defineStore('featureToggles', {
  state: () => ({

    activeToggles: [] as unknown as string[],

  }),

  getters: {
    //isLiveMode: (state) => (state.currentTabsetId === 'current'),
    debugEnabled: (state) => _.find(state.activeToggles, e => e === "debug"),
    settingsEnabled: (state) => _.find(state.activeToggles, e => e === "settings"),
    listviewEnabled: (state) => _.find(state.activeToggles, e => e === "listview"),
    firebaseEnabled: (state) => _.find(state.activeToggles, e => e === "firebase"),
    bookmarksEnabled: (state) => _.find(state.activeToggles, e => e === "bookmarks")
  },

  actions: {
    async initialize(localStorage: any) {
      const fts: string | undefined = localStorage.getItem("featureToggles")
      if (fts) {
        this.activeToggles = _.map(fts.split(","), e => e.trim().toLowerCase())
      }
    },

  }
});
