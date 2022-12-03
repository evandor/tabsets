import {useTabsStore} from "src/stores/tabsStore";
import {useTabGroupsStore} from "src/stores/tabGroupsStore";


class ChromeTabGroupsListeners {

  inProgress = false;

  clearWorking() {
    if (this.inProgress) {
      //console.log("resetting 'inProgress' to false")
      const tabsStore = useTabsStore()
      tabsStore.loadTabs('onProgressStopped')
    }
    this.inProgress = false
  }

  intervalID = setInterval(() => this.clearWorking(), 5000);

  eventTriggered() {
    this.inProgress = true
  }

  // @ts-ignore
  onCreated(tg: chrome.tabGroups.TabGroup) {
    let msg = `tabGroup ${tg.title} created`
    console.log('onCreated', msg)
    //this.initialize('onCreated');
    const tabGroupsStore = useTabGroupsStore()
    tabGroupsStore.loadTabGroups()
  }

  // @ts-ignore
  onUpdated(tg: chrome.tabGroups.TabGroup) {
    let msg = `tabGroup ${tg.title} updated`
    console.log('onUpdated', msg)
    const tabGroupsStore = useTabGroupsStore()
    tabGroupsStore.loadTabGroups()
  }

  // @ts-ignore
  onRemoved(tg: chrome.tabGroups.TabGroup) {
    const tabGroupsStore = useTabGroupsStore()
    tabGroupsStore.loadTabGroups()
  }

  // @ts-ignore
  onMoved(tg: chrome.tabGroups.TabGroup) {
    let msg = `tabGroup ${tg.title} moved`
    console.log('onMoved', msg)
    const tabGroupsStore = useTabGroupsStore()
    tabGroupsStore.loadTabGroups()
  }
}

export default new ChromeTabGroupsListeners();

