import _ from "lodash"
import {GrantPermissionCommand} from "src/domain/commands/GrantPermissionCommand";
import {RevokePermissionCommand} from "src/domain/commands/RevokePermissionCommand";
import {AppFeature, FeatureIdent, FeatureType} from "src/models/AppFeature"

export class AppFeatures {
  features: AppFeature[] = [
    //new AppFeature(FeatureIdent.HELP, FeatureType.EXPERIMENTAL, 'Help Pages', 'o_help', ['bex']),

    // new AppFeature(FeatureIdent.BOOKMARKS, FeatureType.OPTIONAL, 'Bookmarks', 'o_bookmarks', ['bex'])
    //   .setActivateCommands([new GrantPermissionCommand('bookmarks', true)])
    //   .setDeactivateCommands([new RevokePermissionCommand('bookmarks')]),

    // new AppFeature(FeatureIdent.PAGE_MARKER, FeatureType.EXPERIMENTAL, 'Page Marker', 'o_note', ['bex'])
    //   .setActivateCommands([new GrantPermissionCommand('contextMenus')])
    //   .setDeactivateCommands([new RevokePermissionCommand('contextMenus')]),

    //new AppFeature(FeatureIdent.THUMBNAILS, FeatureType.EXPERIMENTAL, 'Thumbnails', 'o_image', ['bex']),

   // new AppFeature(FeatureIdent.NEWEST_TABS, FeatureType.RECOMMENDED, 'Newest Tabs', 'o_schedule', ['all']),
    new AppFeature(FeatureIdent.TOP10, FeatureType.RECOMMENDED, 'Top 10 Tabs', 'o_workspace_premium', ['all']),
    new AppFeature(FeatureIdent.OPEN_TABS, FeatureType.OPTIONAL, 'Open Tabs', 'o_playlist_add', ['bex']),

    new AppFeature(FeatureIdent.SAVE_TAB, FeatureType.EXPERIMENTAL, 'Save Tabs as MHTML', 'o_save', ['bex'])
      .setActivateCommands([new GrantPermissionCommand('pageCapture')]),
      //.setDeactivateCommand(new RevokePermissionCommand('pageCapture')),
    new AppFeature(FeatureIdent.SAVE_TAB_AS_PNG, FeatureType.EXPERIMENTAL, 'Save Tab as Image', 'o_image', ['bex'])
      .setActivateCommands([new GrantPermissionCommand('pageCapture')]),

    //new AppFeature(FeatureIdent.SAVE_TAB_AS_PDF, FeatureType.EXPERIMENTAL, 'Save Tab as PDF', 'o_picture_as_pdf', ['bex']),
    new AppFeature(FeatureIdent.GROUP_BY_DOMAIN, FeatureType.OPTIONAL, 'Group By Domain View', 'o_dns', ['all']),
    new AppFeature(FeatureIdent.OPENTABS_THRESHOLD, FeatureType.OPTIONAL, 'Open Tabs Warnings', 'o_tab', ['bex']),

    new AppFeature(FeatureIdent.EXPERIMENTAL_VIEWS, FeatureType.EXPERIMENTAL, 'Experimental Views', 'o_explore', ['all']),
    new AppFeature(FeatureIdent.RSS, FeatureType.EXPERIMENTAL, 'RSS View', 'o_rss_feed', ['bex', 'spa']),
    new AppFeature(FeatureIdent.SESSIONS, FeatureType.DISABLED, 'Sessions', 'o_explore', ['all']),//,[FeatureIdent.OPENTABS_THRESHOLD]),
    new AppFeature(FeatureIdent.SPACES, FeatureType.OPTIONAL, 'Spaces', 'o_space_dashboard', ['all']),
    new AppFeature(FeatureIdent.BACKUP, FeatureType.EXPERIMENTAL, 'Backup Tabset', 'o_inventory_2', ['bex']),//, [FeatureIdent.OPENTABS_THRESHOLD]),
    new AppFeature(FeatureIdent.IGNORE, FeatureType.EXPERIMENTAL, 'Ignore Tabset', 'o_pause_circle', ['bex']),

    //new AppFeature(FeatureIdent.TABSET_PAGE, FeatureType.EXPERIMENTAL, 'Use Tabset Pages', 'o_article', ['all']),

    new AppFeature(FeatureIdent.TAGS, FeatureType.RECOMMENDED, 'Use Tags for Tabs', 'o_label', ['all']),
    new AppFeature(FeatureIdent.NOTES, FeatureType.EXPERIMENTAL, 'Activate Notes', 'o_note', ['all']),

    new AppFeature(FeatureIdent.WEBSITE_CLIP, FeatureType.EXPERIMENTAL, 'Create an image clip from a website and store it', 'filter_center_focus', ['bex'])
      .setActivateCommands([new GrantPermissionCommand('notifications'),new GrantPermissionCommand('contextMenus')]),

    new AppFeature(FeatureIdent.STANDALONE_APP, FeatureType.RECOMMENDED, 'Standalone App', 'o_open_in_new', ['bex']),

    //new AppFeature(FeatureIdent.CATEGORIZATION, FeatureType.DISABLED, 'URL Categorization', 'o_auto_awesome', ['bex']),

    new AppFeature(FeatureIdent.NOTIFICATIONS, FeatureType.RECOMMENDED, 'Browser Notifications', 'o_notifications', ['all'])
      .setActivateCommands([new GrantPermissionCommand('notifications')])
      .setDeactivateCommands([new RevokePermissionCommand('notifications')]),

    new AppFeature(FeatureIdent.ANNOTATIONS, FeatureType.EXPERIMENTAL, 'Annotate Websites', 'o_auto_awesome', ['bex'])
      .setActivateCommands([new GrantPermissionCommand('contextMenus')]),

    new AppFeature(FeatureIdent.CONTEXT_MENUS, FeatureType.OPTIONAL, 'Use Tabsets Context Menu', 'o_list', ['all'])
      .setActivateCommands([new GrantPermissionCommand('contextMenus')]),


    new AppFeature(FeatureIdent.ARCHIVE_TABSET, FeatureType.OPTIONAL, 'Archive Tabsets', 'o_inventory_2', ['all']),
    //new AppFeature(FeatureIdent.WINDOW_MANAGEMENT, FeatureType.OPTIONAL, 'Window Management', 'o_grid_view', ['all']),

    new AppFeature(FeatureIdent.COLOR_TAGS, FeatureType.OPTIONAL, 'Color Tags', 'o_colorize', ['all']),
    new AppFeature(FeatureIdent.ADVANCED_TAB_MANAGEMENT, FeatureType.EXPERIMENTAL, 'Advanced Tab Management', 'o_tab', ['all']),
    new AppFeature(FeatureIdent.ANALYSE_TABS, FeatureType.EXPERIMENTAL, 'Analyse Tabs', 'o_tab', ['bex'])
        .setActivateCommands([new GrantPermissionCommand('webRequest')]),
    new AppFeature(FeatureIdent.TAB_GROUPS, FeatureType.EXPERIMENTAL, 'Chrome Tab Groups', 'o_view_list', ['chrome_bex'])
        .setActivateCommands([new GrantPermissionCommand('tabGroups')]),

    new AppFeature(FeatureIdent.MONITORING, FeatureType.EXPERIMENTAL, 'Monitor Changes', 'o_change_circle', ['bex']),
    new AppFeature(FeatureIdent.TAB_HELPER, FeatureType.EXPERIMENTAL, 'Tab Helper', 'o_article', ['bex']),

    new AppFeature(FeatureIdent.AUTO_TAB_SWITCHER, FeatureType.EXPERIMENTAL, 'Auto Tab Switcher', 'o_switch_left', ['bex']),
    //new AppFeature(FeatureIdent.TABS_AS_TREE, FeatureType.EXPERIMENTAL, 'Tabs in Tree View', 'o_account_tree', ['all']),
    new AppFeature(FeatureIdent.TABSET_SUBFOLDER, FeatureType.EXPERIMENTAL, 'Subfolder for Tabsets', 'o_folder', ['all']),
    new AppFeature(FeatureIdent.TABSETS_SHARING, FeatureType.EXPERIMENTAL, 'Sharing Tabsets', 'o_ios_share', ['all'])
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
