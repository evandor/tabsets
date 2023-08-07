import Command from "src/domain/Command";
import {ActivateFeatureCommand} from "src/domain/features/ActivateFeature";
import {DeactivateFeatureCommand} from "src/domain/features/DeactivateFeature";

export enum FeatureIdent {
  BOOKMARKS = "BOOKMARKS",
  PAGE_MARKER = "PAGE_MARKER",
  SAVE_TAB = "SAVE_TAB",
  CREATE_PDF = "CREATE_PDF",
  GROUP_BY_DOMAIN = "GROUP_BY_DOMAIN",
  OPENTABS_THRESHOLD = "OPENTABS_THRESHOLD",
  EXPERIMENTAL_VIEWS = "EXPERIMENTAL_VIEWS",
  RSS = "RSS",
  SESSIONS = "SESSIONS",
  SPACES = "SPACES",
  TOP10 = "TOP10",
  OPEN_TABS = "OPEN_TABS",
  NEWEST_TABS = "NEWEST_TABS",
  THUMBNAILS = "THUMBNAILS",
  DYNAMIC = "DYNAMIC",
  WINDOWS = "WINDOWS",
  SCHEDULED = "SCHEDULED",
  OLD_TABS = "OLD_TABS",
  BACKUP = "BACKUP",
  IGNORE = "IGNORE",
  TABSET_PAGE = "TABSET_PAGE",
  NOTES = "NOTES",
  TAGS = "TAGS",
  SIDE_PANEL = "SIDE_PANEL",
  WEBSITE_CLIP = "WEBSITE_CLIP",
  STANDALONE_APP = "STANDALONE_APP",
  AI_MODULE = "AI_MODULE",
  CATEGORIZATION = "CATEGORIZATION",
  NOTIFICATIONS = "NOTIFICATIONS",
  ANNOTATIONS = "ANNOTATIONS"
}

export enum FeatureType {
  RECOMMENDED = "RECOMMENDED",
  OPTIONAL = "OPTIONAL",
  EXPERIMENTAL = "EXPERIMENTAL",
  PLANNED = "PLANNED",
  DISABLED = "DISABLED"
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
    public requires: FeatureIdent[] = []
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
