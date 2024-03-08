import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {useTabsetService} from "src/services/TabsetService2";
import {SaveOrReplaceResult} from "src/models/SaveOrReplaceResult";
import {useUtils} from "src/services/Utils";
import {useTabsStore} from "stores/tabsStore";
import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {useSuggestionsStore} from "stores/suggestionsStore";
import {StaticSuggestionIdent, Suggestion} from "src/models/Suggestion";
import Analytics from "src/utils/google-analytics";
import {useWindowsStore} from "src/stores/windowsStore";
import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {Tabset, TabsetType} from "src/models/Tabset";
import {uid} from "quasar";

const {sendMsg} = useUtils()

export class CreateFolderCommand implements Command<string> {

  public merge: boolean = true

  constructor(
    public folderName: string,
    public tabsToUse: chrome.tabs.Tab[],
    public tabsetId: string,
    public parentFolder: string | undefined = undefined) {
  }

  async execute(): Promise<ExecutionResult<string>> {
    try {
      const tabset = useTabsetService().getTabset(this.tabsetId)!
      if (!this.parentFolder) {
        const newFolder = new Tabset(uid(), this.folderName, this.tabsToUse)
        newFolder.folderParent = tabset.id
        tabset.folders.push(newFolder)
        await useTabsetService().saveTabset(tabset)
        return Promise.resolve(new ExecutionResult<string>("result", 'Folder created'))
      }
      const parentFolder = this.getFolder(tabset, this.parentFolder)
      //TODO use useTabsetService().findFolder(tabset.folders, tabset.folderActive)
      if (parentFolder) {
        const newFolder = new Tabset(uid(), this.folderName, [])
        newFolder.folderParent = tabset.id
        parentFolder.folders.push(newFolder)
        await useTabsetService().saveTabset(tabset)
        return Promise.resolve(new ExecutionResult<string>("result", 'Subfolder created'))
      }
      return Promise.reject("could not find subfolder")
    } catch (err) {
      return Promise.reject(err)
    }
  }

  private getFolder(root: Tabset, parentFolder: string):Tabset | undefined {
    for(const f of root.folders) {
      if (f.id === parentFolder) {
        return f
      } else {
        return this.getFolder(f, parentFolder)
      }
    }

  }
}

CreateFolderCommand.prototype.toString = function cmdToString() {
  return `CreateFolderCommand: {tabsetId=${this.tabsetId}, folderName=${this.folderName}, parentFolder=${this.parentFolder}}`;
};
