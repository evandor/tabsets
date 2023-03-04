import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import TabsetService from "src/services/TabsetService";
import {Group} from "src/models/Group";
import {uid} from "quasar";
import {Tabset} from "src/models/Tabset";
import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {useTabsetService} from "src/services/TabsetService2";

// class UndoCommand implements Command<any> {
//
//   constructor(public tabId: string, public oldTabsetId: string, public copy: boolean) {
//   }
//
//   execute(): Promise<ExecutionResult<any>> {
//     return TabsetService.moveToTabset(this.tabId, this.oldTabsetId)
//       .then(() => {
//         return Promise.resolve(new ExecutionResult("done", "Tab was moved back"))
//       })
//   }
//
// }

export class CreateGroupCommand implements Command<any> {

  constructor(
    public tabset: Tabset,
    public title: string
  ) {
  }

  async execute(): Promise<ExecutionResult<any>> {
    const trustedTitle = this.title.replace(STRIP_CHARS_IN_USER_INPUT, '')
    const group = new Group(uid(), trustedTitle)
    const existingGroups = this.tabset.groups
    if (existingGroups.find(existingGroup => existingGroup.title === this.title)) {
      return Promise.reject(`Group ${trustedTitle} already exists`)
    }
    this.tabset.groups.push(group)
    return useTabsetService().saveTabset(this.tabset)
      .then((res) =>
        Promise.resolve(new ExecutionResult("done", `Group ${trustedTitle} was created`)))
      .catch(err => Promise.reject("could not create group"))
  }

}

CreateGroupCommand.prototype.toString = function cmdToString() {
  return `CreateGroupCommand: {title=${this.title}, {tabsetId=${this.tabset.id}}`;
};
