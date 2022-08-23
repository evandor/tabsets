import axios, {AxiosResponse} from 'axios';
import {UnwrapRef} from "vue";
import {LocalStorage, uid, useQuasar} from "quasar";
import _ from "lodash";
import {Tabset} from "src/models/Tabset";
import {Tab} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";


export class TabsetApi {

  private localStorage: LocalStorage;

  constructor(localStorage: LocalStorage) {
    this.localStorage = localStorage;
  }



  getTabsetInfo() {
    return _.map(
      _.filter(this.localStorage.getAllKeys(), (t: string) => t.startsWith("tabsets.tabset.")), key => {
        const tabset: Tabset | null = this.localStorage.getItem(key)
        return {
          title: tabset ? tabset.name : 'unknown',
          id: tabset ? tabset.id : 'unknown',
        }
      })
  }


  createFromGroup(tabsetId: string, title: string, groupId: number) {
    // const tabset = this.getTabset(tabsetId)
    // if (tabset) {
    //   console.log("got tabset", tabset.id)
    //   const tabs = _.filter(tabset.tabs, (t: chrome.tabs.Tab) => t.groupId === groupId)
    //   //TabsetService.saveOrReplace(title, tabs)
    // }
  }



}




