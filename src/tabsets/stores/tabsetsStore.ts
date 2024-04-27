import {defineStore} from 'pinia';
import _ from 'lodash'
import {computed, ref, watch, watchEffect} from "vue";
import {Space} from "src/spaces/models/Space";
import PersistenceService from "src/services/PersistenceService";
import {LocalStorage, uid} from "quasar";
import throttledQueue from "throttled-queue";
import SpacesPersistence from "src/spaces/persistence/SpacesPersistence";
import {Tabset} from "src/tabsets/models/Tabset";

/**
 * a pinia store for "Tabsets".
 *
 * Elements are persisted to the storage provided in the initialize function; the currently
 * selected space id is written to (and read from) local storage.
 */

export const useTabsetsStore = defineStore('tabsets', () => {

  /**
   * a named list of tabsets managed by this extension.
   */
  const tabsets = ref<Map<string, Tabset>>(new Map<string, Tabset>())

  return {
    tabsets
  }
})
