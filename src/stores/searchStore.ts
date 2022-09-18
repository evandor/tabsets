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


export const useSearchStore = defineStore('search', {
  state: () => ({

    term: null as unknown as string,

    history: [] as unknown as string[],

  }),

  getters: {
    //isLiveMode: (state) => (state.currentTabsetId === 'current'),


  },

  actions: {
    async initialize(localStorage: any) {

    },

  }
});
