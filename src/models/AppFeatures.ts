import _ from "lodash"
import {GrantPermissionCommand} from "src/domain/commands/GrantPermissionCommand";
import Command from "src/domain/Command";
import {RevokePermissionCommand} from "src/domain/commands/RevokePermissionCommand";
import {ActivateFeatureCommand} from "src/domain/features/ActivateFeature";
import {DeactivateFeatureCommand} from "src/domain/features/DeactivateFeature";
import {GrantOriginCommand} from "src/domain/commands/GrantOriginCommand";
import {RevokeOriginCommand} from "src/domain/commands/RevokeOriginCommand";

export enum FeatureIdent {
  BOOKMARKS = "BOOKMARKS",
  SAVE_TAB = "SAVE_TAB",
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
    this.activateCommand = new DeactivateFeatureCommand(this)
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

export class AppFeatures {
  features: AppFeature[] = [
    new AppFeature(FeatureIdent.BOOKMARKS, FeatureType.RECOMMENDED, 'Bookmarks', 'o_bookmarks', ['bex'])
      .setActivateCommand(new GrantPermissionCommand('bookmarks'))
      .setDeactivateCommand(new RevokePermissionCommand('bookmarks')),
    new AppFeature(FeatureIdent.SAVE_TAB, FeatureType.OPTIONAL, 'Save Tabs', 'o_save', ['all'])
      .setActivateCommand(new GrantPermissionCommand('pageCapture'))
      .setDeactivateCommand(new RevokePermissionCommand('pageCapture')),
    new AppFeature(FeatureIdent.GROUP_BY_DOMAIN, FeatureType.OPTIONAL, 'Group By Domain View', 'o_dns', ['all']),
    new AppFeature(FeatureIdent.SIDEBAR, FeatureType.OPTIONAL, 'Sidebar View', 'o_input', ['electron']),
    new AppFeature(FeatureIdent.OPENTABS_THRESHOLD, FeatureType.OPTIONAL, 'Open Tabs Warnings', 'o_tab', ['bex']),
    new AppFeature(FeatureIdent.EXPERIMENTAL_VIEWS, FeatureType.EXPERIMENTAL, 'Experimental Views', 'o_explore', ['all']),

    // does not work properly right now (keeps re-catching the source)
    new AppFeature(FeatureIdent.NEW_TAB, FeatureType.EXPERIMENTAL, 'New Tab', 'o_create_new_folder', ['bex']),

    // does not work properly right now in electron (keeps re-catching the source)
    new AppFeature(FeatureIdent.RSS, FeatureType.EXPERIMENTAL, 'RSS View', 'o_rss_feed', ['bex', 'spa']),

    new AppFeature(FeatureIdent.SESSIONS, FeatureType.EXPERIMENTAL, 'Sessions', 'o_explore', ['all']),
    new AppFeature(FeatureIdent.SPACES, FeatureType.EXPERIMENTAL, 'Spaces', 'o_history', ['all']),
    new AppFeature(FeatureIdent.DETAILS, FeatureType.EXPERIMENTAL, 'Tab(set) Details View', 'o_tab', ['all']),
    new AppFeature(FeatureIdent.THUMBNAILS, FeatureType.EXPERIMENTAL, 'Thumbnails', 'o_tab', ['all'])
      .setActivateCommand(new GrantOriginCommand('thumbnails'))
      .setDeactivateCommand(new RevokeOriginCommand('thumbnails')),
    new AppFeature(FeatureIdent.ANALYSE_TABS, FeatureType.EXPERIMENTAL, 'Analyse Tabs', 'o_analytics', ['bex'])
      .setActivateCommand(new GrantOriginCommand('analyseTabs'))
      .setDeactivateCommand(new RevokeOriginCommand('analyseTabs')),

    // new AppFeature(FeatureIdent.ANALYSE_TABS, FeatureType.PLANNED, 'Multiple Windows', 'o_history', ['bex']),
    // new AppFeature(FeatureIdent.ANALYSE_TABS, FeatureType.PLANNED, 'Scheduled Tabs', 'o_history', ['bex']),
    // new AppFeature(FeatureIdent.ANALYSE_TABS, FeatureType.PLANNED, 'Old Tabs View', 'o_history', ['bex']),

    // {ident: 'stats', name: 'Gather and show stats', icon: 'o_history'},
    // {ident: 'tagcloud', name: 'Tag clouds from titles', icon: 'o_history'},
    // {ident: 'tagcloud', name: 'Tag clouds from content', icon: 'o_history'}

  ]

  getFeature(f: FeatureIdent): AppFeature | undefined {
    const found = _.filter(this.features, (feature: AppFeature) => feature.ident === f)
    if (found && found.length > 0) {
      return found[0]
    }
    return undefined
  }
}
