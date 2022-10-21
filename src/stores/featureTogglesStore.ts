import {defineStore} from 'pinia';
import _ from 'lodash'

export const useFeatureTogglesStore = defineStore('featureToggles', {
  state: () => ({

    activeToggles: [] as unknown as string[],

  }),

  getters: {
    debugEnabled: (state) => _.find(state.activeToggles, e => e === "debug"),
    listviewEnabled: (state) => _.find(state.activeToggles, e => e === "listview")
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
