import axios, {AxiosResponse} from 'axios';
import {UnwrapRef} from "vue";
import {LocalStorage, uid, useQuasar} from "quasar";
import _ from "lodash";
import {Tabset} from "src/models/Tabset";


export class TabsetApi {

  private localStorage: LocalStorage;

  constructor(localStorage: LocalStorage) {
    this.localStorage = localStorage;
  }

  saveOrReplace(tabsetName: UnwrapRef<string>, tabs: chrome.tabs.Tab[]) {
    console.log("saving or replacing tabset " + tabsetName)
    var existingId =
      _.first(
        _.map(
          _.filter(
            _.map(
              _.filter(this.localStorage.getAllKeys(), (t: string) => t.startsWith("bookmrkx.tabsContexts.")),
              (key: string) => {
                console.log("key", key)
                return this.localStorage.getItem(key)
              }), (ts: Tabset) => {
              console.log("ts", ts.name, tabsetName)
              return ts.name === tabsetName
            }), (ts: any) => {
            console.log("mapping to", ts.id)
            return ts.id as string
          }))
    console.log("found existing", existingId)
    const useId = (existingId) ? existingId : uid()

    const ts = new Tabset(useId, tabsetName, tabs);
    this.localStorage.set("bookmrkx.tabsContexts." + useId, ts)
  }

  getTabsetInfo() {
    return _.map(
      _.filter(this.localStorage.getAllKeys(), (t: string) => t.startsWith("bookmrkx.tabsContexts.")), key => {
        const tabset: Tabset | null = this.localStorage.getItem(key)
        return {
          title: tabset ? tabset.name : 'unknown',
          id: tabset ? tabset.id : 'unknown',
        }
      })
  }

  getTabset(tabsetId: string): Tabset | null {
    return this.localStorage.getItem<Tabset>("bookmrkx.tabsContexts." + tabsetId);
  }

  restore(id: string) {
    const tabset = this.getTabset(id)
    if (tabset) {
      chrome.tabs.query({currentWindow: true}, (t: chrome.tabs.Tab[]) => {
        // @ts-ignore
        const ids: number[] = t.filter((r: chrome.tabs.Tab) => !r.url.startsWith('chrome'))
          .filter(r => r.id !== undefined)
          .map(r => r.id || 0);
        console.log("ids to close", ids)
        chrome.tabs.remove(ids)
        tabset.tabs.forEach(t => {
          //console.log("creating tab", t)
          chrome.tabs.create({
            active: false,
            index: t.index,
            pinned: t.pinned,
            url: t.url
          })
            .catch(e => {
              console.log("got error", e)
            })
        });
      });
    }
  }

  createFromGroup(tabsetId: string, title: string, groupId: number) {
    const tabset = this.getTabset(tabsetId)
    if (tabset) {
      console.log("got tabset", tabset.id)
      const tabs = _.filter(tabset.tabs, (t: chrome.tabs.Tab) => t.groupId === groupId)
      this.saveOrReplace(title, tabs)
    }
  }
}




