import _ from "lodash"
import {GrantPermissionCommand} from "src/domain/commands/GrantPermissionCommand";
import {RevokePermissionCommand} from "src/domain/commands/RevokePermissionCommand";
import {GrantOriginCommand} from "src/domain/commands/GrantOriginCommand";
import {RevokeOriginCommand} from "src/domain/commands/RevokeOriginCommand";
import {AppFeature, FeatureIdent, FeatureType} from "src/models/AppFeature"



export class AppFeatures {
  features: AppFeature[] = [
    new AppFeature(FeatureIdent.DETAILS, FeatureType.RECOMMENDED, 'Tab(set) Details View', 'o_info', ['all']),
    new AppFeature(FeatureIdent.BOOKMARKS, FeatureType.RECOMMENDED, 'Bookmarks', 'o_bookmarks', ['bex'])
      .setActivateCommand(new GrantPermissionCommand('bookmarks'))
      .setDeactivateCommand(new RevokePermissionCommand('bookmarks')),
    new AppFeature(FeatureIdent.THUMBNAILS, FeatureType.RECOMMENDED, 'Thumbnails', 'o_image', ['bex'])
      .setActivateCommand(new GrantOriginCommand('thumbnails'))
      .setDeactivateCommand(new RevokeOriginCommand('thumbnails')),
    new AppFeature(FeatureIdent.ANALYSE_TABS, FeatureType.RECOMMENDED, 'Analyse Tabs', 'o_analytics', ['bex'])
      .setActivateCommand(new GrantOriginCommand('analyseTabs'))
      .setDeactivateCommand(new RevokeOriginCommand('analyseTabs')),

    new AppFeature(FeatureIdent.SAVE_TAB, FeatureType.OPTIONAL, 'Save Tabs', 'o_save', ['bex'])
      .setActivateCommand(new GrantPermissionCommand('pageCapture'))
      .setDeactivateCommand(new RevokePermissionCommand('pageCapture')),
    new AppFeature(FeatureIdent.GROUP_BY_DOMAIN, FeatureType.OPTIONAL, 'Group By Domain View', 'o_dns', ['all']),
    new AppFeature(FeatureIdent.SIDEBAR, FeatureType.OPTIONAL, 'Sidebar View', 'o_input', ['electron']),
    new AppFeature(FeatureIdent.OPENTABS_THRESHOLD, FeatureType.OPTIONAL, 'Open Tabs Warnings', 'o_tab', ['bex']),
    new AppFeature(FeatureIdent.SORT_TABS, FeatureType.OPTIONAL, 'Sort Tabs', 'o_tab', ['bex']),

    new AppFeature(FeatureIdent.EXPERIMENTAL_VIEWS, FeatureType.EXPERIMENTAL, 'Experimental Views', 'o_explore', ['all']),
    // does not work properly right now (keeps re-catching the source)
    new AppFeature(FeatureIdent.NEW_TAB, FeatureType.EXPERIMENTAL, 'New Tab', 'o_create_new_folder', ['bex']),
    // does not work properly right now in electron (keeps re-catching the source)
    new AppFeature(FeatureIdent.RSS, FeatureType.EXPERIMENTAL, 'RSS View', 'o_rss_feed', ['bex', 'spa']),
    new AppFeature(FeatureIdent.SESSIONS, FeatureType.EXPERIMENTAL, 'Sessions', 'o_explore', ['all'],[FeatureIdent.OPENTABS_THRESHOLD]),
    new AppFeature(FeatureIdent.SPACES, FeatureType.EXPERIMENTAL, 'Spaces', 'o_space_dashboard', ['all']),
    new AppFeature(FeatureIdent.HISTORY, FeatureType.EXPERIMENTAL, 'Access Browser History', 'o_history', ['bex'])
      .setActivateCommand(new GrantPermissionCommand('history'))
      .setDeactivateCommand(new RevokePermissionCommand('history')),
    new AppFeature(FeatureIdent.BACKUP, FeatureType.EXPERIMENTAL, 'Backup Tabset', 'o_inventory_2', ['bex'], [FeatureIdent.OPENTABS_THRESHOLD]),
    new AppFeature(FeatureIdent.IGNORE, FeatureType.EXPERIMENTAL, 'Ignore Tabset', 'o_pause_circle', ['bex']),

    new AppFeature(FeatureIdent.TABSET_PAGE, FeatureType.EXPERIMENTAL, 'Use Tabset Pages', 'o_article', ['all']),

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

  getFeatures(): AppFeature[] {
    return this.features
  }
}
