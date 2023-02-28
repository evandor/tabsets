import Command from "src/domain/Command";
import {ActivateFeatureCommand} from "src/domain/features/ActivateFeature";
import {DeactivateFeatureCommand} from "src/domain/features/DeactivateFeature";

export enum FeatureIdent {
  BOOKMARKS = "BOOKMARKS",
  SAVE_TAB = "SAVE_TAB",
  CREATE_PDF = "CREATE_PDF",
  GROUP_BY_DOMAIN = "GROUP_BY_DOMAIN",
  SIDEBAR = "SIDEBAR",
  OPENTABS_THRESHOLD = "OPENTABS_THRESHOLD",
  EXPERIMENTAL_VIEWS = "EXPERIMENTAL_VIEWS",
  NEW_TAB = "NEW_TAB",
  RSS = "RSS",
  SESSIONS = "SESSIONS",
  SPACES = "SPACES",
  DETAILS = "DETAILS",
  THUMBNAILS = "THUMBNAILS",
  ANALYSE_TABS = "ANALYSE_TABS",
  HISTORY = "HISTORY",
  DYNAMIC ="DYNAMIC",
  WINDOWS = "WINDOWS",
  SCHEDULED = "SCHEDULED",
  OLD_TABS = "OLD_TABS",
  BACKUP = "BACKUP",

}

export enum FeatureType {
  RECOMMENDED = "RECOMMENDED",
  OPTIONAL = "OPTIONAL",

  EXPERIMENTAL = "EXPERIMENTAL",

  PLANNED = "PLANNED"

}


export class AppFeature {
  public activateCommand: Command<any> | undefined = undefined
  public deactivateCommand: Command<any> | undefined = undefined

  constructor(
    public ident: FeatureIdent,
    public type: FeatureType,
    public name: string,
    public icon: string,
    public useIn: string[],
  ) {
    this.activateCommand = new ActivateFeatureCommand(this)
    this.deactivateCommand = new DeactivateFeatureCommand(this)
  }

  setActivateCommand(cmd: Command<any>): AppFeature {
    this.activateCommand = cmd
    return this
  }

  setDeactivateCommand(cmd: Command<any>): AppFeature {
    this.deactivateCommand = cmd
    return this
  }
}
