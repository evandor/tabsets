import Command from "src/domain/Command";
import TabsetService from "src/services/TabsetService";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {Tab, TabComment} from "src/models/Tab";
import _ from "lodash";
import {useTabsStore} from "src/stores/tabsStore";
import {useTabsetService} from "src/services/TabsetService2";
import {Tabset, TabsetSharing} from "src/models/Tabset";
import {useUtils} from "src/services/Utils";
import {useSearchStore} from "stores/searchStore";
import {uid, useQuasar} from "quasar";
import {useGroupsStore} from "stores/groupsStore";
import PlaceholderUtils from "src/utils/PlaceholderUtils";
import {useUiStore} from "stores/uiStore";
import MqttService from "src/services/mqtt/MqttService";

export class AddCommentCommand implements Command<any> {

  constructor(public tabId: string, public comment: string) {
  }

  async execute(): Promise<ExecutionResult<any>> {

    const tabData = useTabsStore().getTabAndTabsetId(this.tabId)
    if (tabData && tabData.tab) {
      console.log("retrieved tabData", tabData)
      const tab = tabData.tab
      const comment = new TabComment(useUiStore().sharingAuthor || '<me>', useUiStore().sharingAvatar, this.comment)
      if (!tab.comments) {
        tab.comments = []
      }
      tab.comments.push(comment)
      const tabset = useTabsetService().getTabset(tabData.tabsetId)
      if (tabset && tabset.sharedId) {
        tabset.sharing = TabsetSharing.PUBLIC_LINK_OUTDATED
        MqttService.publishTabComment(tabset.sharedId, tabData.tab, comment)
      }
      if (tabset) {
        return useTabsetService().saveTabset(tabset)
          .then(() => new ExecutionResult("done", "Comment Published"))
      } else {
        return Promise.reject("could not find tabset")
      }
    } else {
      return Promise.reject("There was a problem adding your comment")
    }
    return Promise.reject("Could not find Tab")
  }

}

AddCommentCommand.prototype.toString = function cmdToString() {
  return `AddCommentCommand: {tabId=${this.tabId}}`;
};
