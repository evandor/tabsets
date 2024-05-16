import _ from "lodash"
import {GrantPermissionCommand} from "src/domain/commands/GrantPermissionCommand";
import {RevokePermissionCommand} from "src/domain/commands/RevokePermissionCommand";
import {Feature} from "src/features/models/Feature";

export enum FeatureIdent {
  //BOOKMARKS = "BOOKMARKS", -- active by default now
  //PAGE_MARKER = "PAGE_MARKER",
  // SAVE_TAB = "SAVE_TAB", // As MHTML
  SAVE_TAB_AS_PDF = "SAVE_TAB_AS_PDF", // not active yet
  SAVE_TAB_AS_PNG = "SAVE_TAB_AS_PNG",
  GROUP_BY_DOMAIN = "GROUP_BY_DOMAIN",
  OPENTABS_THRESHOLD = "OPENTABS_THRESHOLD",
  EXPERIMENTAL_VIEWS = "EXPERIMENTAL_VIEWS",
  RSS = "RSS",
  SESSIONS = "SESSIONS",
  SPACES = "SPACES",
  HELP = "HELP",
  TOP10 = "TOP10",
  OPEN_TABS = "OPEN_TABS",
  //NEWEST_TABS = "NEWEST_TABS",
  // THUMBNAILS = "THUMBNAILS", // active by default
  DYNAMIC = "DYNAMIC",
  WINDOWS = "WINDOWS",
  SCHEDULED = "SCHEDULED",
  OLD_TABS = "OLD_TABS",
  BACKUP = "BACKUP",
  IGNORE = "IGNORE",
  //TABSET_PAGE = "TABSET_PAGE", -- default now
  NOTES = "NOTES",
  TAGS = "TAGS",
  SIDE_PANEL = "SIDE_PANEL",
  WEBSITE_CLIP = "WEBSITE_CLIP",
  STANDALONE_APP = "STANDALONE_APP",
  //AI_MODULE = "AI_MODULE",
  //CATEGORIZATION = "CATEGORIZATION",
  NOTIFICATIONS = "NOTIFICATIONS",
  ANNOTATIONS = "ANNOTATIONS",
  //CONTEXT_MENUS = "CONTEXT_MENUS",
  ARCHIVE_TABSET = "ARCHIVE_TABSET",
  //WINDOW_MANAGEMENT = "WINDOW_MANAGEMENT",
  COLOR_TAGS = "COLOR_TAGS",
  ADVANCED_TAB_MANAGEMENT = "ADVANCED_TAB_MANAGEMENT",
  ANALYSE_TABS = "ANALYSE_TABS",
  TAB_GROUPS = "TAB_GROUPS",
  MONITORING = "MONITORING",
  TAB_HELPER = "TAB_HELPER",
  AUTO_TAB_SWITCHER = "AUTO_TAB_SWITCHER",
  TABS_AS_TREE = "TABS_AS_TREE",
  TABSET_SUBFOLDER = "TABSET_SUBFOLDER",
  TABSETS_SHARING = "TABSETS_SHARING",
  WINDOWS_MANAGEMENT = "WINDOWS_MANAGEMENT"
}

export enum FeatureType {
  RECOMMENDED = "RECOMMENDED",
  OPTIONAL = "OPTIONAL",
  EXPERIMENTAL = "EXPERIMENTAL",
  PLANNED = "PLANNED",
  DISABLED = "DISABLED"
}


export class AppFeatures {
  features: Feature[] = [
    //new AppFeature(FeatureIdent.HELP, FeatureType.EXPERIMENTAL, 'Help Pages', 'o_help', ['bex']),

    // new AppFeature(FeatureIdent.BOOKMARKS, FeatureType.OPTIONAL, 'Bookmarks', 'o_bookmarks', ['bex'])
    //   .setActivateCommands([new GrantPermissionCommand('bookmarks', true)])
    //   .setDeactivateCommands([new RevokePermissionCommand('bookmarks')]),

    // new AppFeature(FeatureIdent.PAGE_MARKER, FeatureType.EXPERIMENTAL, 'Page Marker', 'o_note', ['bex'])
    //   .setActivateCommands([new GrantPermissionCommand('contextMenus')])
    //   .setDeactivateCommands([new RevokePermissionCommand('contextMenus')]),

    //new AppFeature(FeatureIdent.THUMBNAILS, FeatureType.EXPERIMENTAL, 'Thumbnails', 'o_image', ['bex']),

   // new AppFeature(FeatureIdent.NEWEST_TABS, FeatureType.RECOMMENDED, 'Newest Tabs', 'o_schedule', ['all']),
    new Feature(FeatureIdent.TOP10, FeatureType.RECOMMENDED, 'Top 10 Tabs', 'o_workspace_premium', ['all']),
    new Feature(FeatureIdent.OPEN_TABS, FeatureType.RECOMMENDED, 'Open Tabs', 'o_playlist_add', ['bex']),

    // new Feature(FeatureIdent.SAVE_TAB, FeatureType.EXPERIMENTAL, 'Save Tabs as MHTML', 'o_save', ['bex'])
    //   .setActivateCommands([new GrantPermissionCommand('pageCapture')]),
    //   //.setDeactivateCommand(new RevokePermissionCommand('pageCapture')),
    new Feature(FeatureIdent.SAVE_TAB_AS_PNG, FeatureType.EXPERIMENTAL, 'Save Tab as Image', 'o_image', ['bex'])
      .setActivateCommands([new GrantPermissionCommand('pageCapture')]),

    //new Feature(FeatureIdent.SAVE_TAB_AS_PDF, FeatureType.EXPERIMENTAL, 'Save Tab as PDF', 'o_picture_as_pdf', ['bex']),
    new Feature(FeatureIdent.GROUP_BY_DOMAIN, FeatureType.OPTIONAL, 'Group By Domain View', 'o_dns', ['all']),
    new Feature(FeatureIdent.OPENTABS_THRESHOLD, FeatureType.OPTIONAL, 'Open Tabs Warnings', 'o_tab', ['bex']),

    new Feature(FeatureIdent.EXPERIMENTAL_VIEWS, FeatureType.EXPERIMENTAL, 'Experimental Views', 'o_explore', ['all']),
    new Feature(FeatureIdent.RSS, FeatureType.EXPERIMENTAL, 'RSS View', 'o_rss_feed', ['bex', 'spa']),
    new Feature(FeatureIdent.SESSIONS, FeatureType.DISABLED, 'Sessions', 'o_explore', ['all']),//,[FeatureIdent.OPENTABS_THRESHOLD]),
    new Feature(FeatureIdent.SPACES, FeatureType.OPTIONAL, 'Spaces', 'o_space_dashboard', ['all']),
    new Feature(FeatureIdent.BACKUP, FeatureType.EXPERIMENTAL, 'Backup Tabset', 'o_inventory_2', ['bex']),//, [FeatureIdent.OPENTABS_THRESHOLD]),
    new Feature(FeatureIdent.IGNORE, FeatureType.EXPERIMENTAL, 'Ignore Tabset', 'o_pause_circle', ['bex']),

    //new Feature(FeatureIdent.TABSET_PAGE, FeatureType.EXPERIMENTAL, 'Use Tabset Pages', 'o_article', ['all']),

    new Feature(FeatureIdent.TAGS, FeatureType.RECOMMENDED, 'Use Tags for Tabs', 'o_label', ['all']),
    new Feature(FeatureIdent.NOTES, FeatureType.EXPERIMENTAL, 'Activate Notes', 'o_note', ['all']),

    new Feature(FeatureIdent.WEBSITE_CLIP, FeatureType.EXPERIMENTAL, 'Create an image clip from a website and store it', 'filter_center_focus', ['bex'])
      .setActivateCommands([new GrantPermissionCommand('notifications')]),

    new Feature(FeatureIdent.STANDALONE_APP, FeatureType.RECOMMENDED, 'Standalone App', 'o_open_in_new', ['bex']),

    //new Feature(FeatureIdent.CATEGORIZATION, FeatureType.DISABLED, 'URL Categorization', 'o_auto_awesome', ['bex']),

    new Feature(FeatureIdent.NOTIFICATIONS, FeatureType.RECOMMENDED, 'Browser Notifications', 'o_notifications', ['all'])
      .setActivateCommands([new GrantPermissionCommand('notifications')])
      .setDeactivateCommands([new RevokePermissionCommand('notifications')]),

    new Feature(FeatureIdent.ANNOTATIONS, FeatureType.EXPERIMENTAL, 'Annotate Websites', 'o_auto_awesome', ['bex']),
     // .setActivateCommands([new GrantPermissionCommand('contextMenus')]),

//    new Feature(FeatureIdent.CONTEXT_MENUS, FeatureType.OPTIONAL, 'Use Tabsets Context Menu', 'o_list', ['all'])
//      .setActivateCommands([new GrantPermissionCommand('contextMenus')]),


    new Feature(FeatureIdent.ARCHIVE_TABSET, FeatureType.OPTIONAL, 'Archive Tabsets', 'o_inventory_2', ['all']),
    //new Feature(FeatureIdent.WINDOW_MANAGEMENT, FeatureType.OPTIONAL, 'Window Management', 'o_grid_view', ['all']),

    new Feature(FeatureIdent.COLOR_TAGS, FeatureType.OPTIONAL, 'Color Tags', 'o_colorize', ['all']),
    new Feature(FeatureIdent.ADVANCED_TAB_MANAGEMENT, FeatureType.EXPERIMENTAL, 'Advanced Tab Management', 'o_tab', ['all']),
    new Feature(FeatureIdent.ANALYSE_TABS, FeatureType.EXPERIMENTAL, 'Analyse Tabs', 'o_tab', ['bex'])
        .setActivateCommands([new GrantPermissionCommand('webRequest')]),
    new Feature(FeatureIdent.TAB_GROUPS, FeatureType.EXPERIMENTAL, 'Chrome Tab Groups', 'o_view_list', ['chrome_bex'])
        .setActivateCommands([new GrantPermissionCommand('tabGroups')]),

    new Feature(FeatureIdent.MONITORING, FeatureType.EXPERIMENTAL, 'Monitor Changes', 'o_change_circle', ['bex']),
    new Feature(FeatureIdent.TAB_HELPER, FeatureType.EXPERIMENTAL, 'Tab Helper', 'o_article', ['bex']),

    new Feature(FeatureIdent.AUTO_TAB_SWITCHER, FeatureType.EXPERIMENTAL, 'Auto Tab Switcher', 'o_switch_left', ['bex']),
    //new Feature(FeatureIdent.TABS_AS_TREE, FeatureType.EXPERIMENTAL, 'Tabs in Tree View', 'o_account_tree', ['all']),
    new Feature(FeatureIdent.TABSET_SUBFOLDER, FeatureType.OPTIONAL, 'Subfolder for Tabsets', 'o_folder', ['all']),
    new Feature(FeatureIdent.TABSETS_SHARING, FeatureType.OPTIONAL, 'Sharing Tabsets', 'o_ios_share', ['all']),
  ]

  getFeature(f: FeatureIdent): Feature | undefined {
    const found = _.filter(this.features, (feature: Feature) => feature.ident === f)
    if (found && found.length > 0) {
      return found[0]
    }
    return undefined
  }

  getFeatures(): Feature[] {
    return this.features
  }
}
