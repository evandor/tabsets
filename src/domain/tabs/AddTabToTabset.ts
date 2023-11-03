import Command from "src/domain/Command";
import TabsetService from "src/services/TabsetService";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {Tab} from "src/models/Tab";
import _ from "lodash";
import {useTabsStore} from "src/stores/tabsStore";
import {useTabsetService} from "src/services/TabsetService2";
import {Tabset, TabsetSharing} from "src/models/Tabset";
import {useUtils} from "src/services/Utils";
import {useSearchStore} from "stores/searchStore";
import {uid, useQuasar} from "quasar";
import {useGroupsStore} from "stores/groupsStore";

const {saveTabset} = useTabsetService()
const {sendMsg} = useUtils()

// No undo command, tab can be deleted manually easily

/**
 * Add provided Tab to provided Tabset.
 */
export class AddTabToTabsetCommand implements Command<any> {


    constructor(public tab: Tab, public tabset: Tabset) {
    }

    async execute(): Promise<ExecutionResult<any>> {
        const tabsStore = useTabsStore()
        console.info(`adding tab '${this.tab.id}' to tabset '${this.tabset.id}'`)
        const exists = _.findIndex(this.tabset.tabs, t => t.url === this.tab.url) >= 0
        console.log("checking 'tab exists' yields", exists)
        if (!exists) {
            try {
                // manage (chrome) Group
                console.log("updating tab group for group id", this.tab.groupId)
                const currentGroup = useGroupsStore().currentGroupForId(this.tab.groupId)
                this.tab.groupName = currentGroup?.title || undefined
                if (currentGroup) {
                    await useGroupsStore().persistGroup(currentGroup)
                }

                const tabset: Tabset = await useTabsetService().addToTabsetId(this.tabset.id, this.tab, 0)
                //    .then((tabset) => {
                console.log("sharing...")
                // Sharing
                if (tabset.sharedId && tabset.sharing === TabsetSharing.PUBLIC) {
                    tabset.sharing = TabsetSharing.PUBLIC_OUTDATED
                }

                // the tab has been added to the tabset, but not saved yet
                const content = await TabsetService.getContentFor(this.tab)
                //    .then((content) => {
                //console.log("got content", content)
                let res: any = null
                if (content) {
                    const res2 = await useTabsetService().saveText(this.tab, content['content' as keyof object], content['metas' as keyof object])
                    //    .then((res) => {
                    // add to search index
                    useSearchStore().addToIndex(
                        uid(), this.tab.name || '',
                        this.tab.title || '',
                        this.tab.url || '',
                        this.tab.description, content['content' as keyof object],
                        [this.tabset.id],
                        this.tab.favIconUrl || '')
                    //      return res
                    //   })
                    //   .then((res) => {
                    res = new ExecutionResult("result", "Tab was added",)
                    //   })
                } else {
                    //console.log("this tabset tabs",this.tabset.tabs)
                    const res2 = saveTabset(this.tabset)
                    //   .then((res) => {
                    // add to search index
                    useSearchStore().addToIndex(
                        uid(), this.tab.name || '',
                        this.tab.title || '',
                        this.tab.url || '',
                        this.tab.description, '',
                        [this.tabset.id],
                        this.tab.favIconUrl || '')
                    //      return res
                    //    })
                    //   .then(result => {
                    res = new ExecutionResult(res2, "Tab was added")
                    //   })
                    // .catch((err: any) => {
                    //     console.error("we are here", err)
                    //     return Promise.reject("problem")
                    // })
                }
                // })
                // .then((res) => {
                sendMsg('tab-added', {tabsetId: tabset.id})
                return res
                // })
                // .catch((err) => Promise.reject("got err " + err))
                //    })
            } catch (err) {
                return Promise.reject("error: " + err)
            }
        } else {
            return Promise.reject("tab already exists in this tabset")
        }


    }


}

AddTabToTabsetCommand.prototype.toString = function cmdToString() {
    return `AddTabToTabsetCommand: {tab=${this.tab.toString()}}`;
};
