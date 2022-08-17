import {defineStore} from 'pinia';
// @ts-ignore
import _ from 'lodash'
import {LogEntry} from "src/models/LogEntry";

export const useLogStore = defineStore('logs', {
  state: () => ({
    logs: [] as unknown as LogEntry[]
  }),

  getters: {

  },

  actions: {
    /*add: (message: string, urls: []) => {
     logs.push(new LogEntry(message, urls))
    }*/
    add(message: string, urls?: string[]) {
      this.logs.push((new LogEntry(message, urls)))
    }
  }
});
