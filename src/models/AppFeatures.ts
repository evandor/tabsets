import _ from "lodash"
import {GrantPermissionCommand} from "src/domain/commands/GrantPermissionCommand";
import {RevokePermissionCommand} from "src/domain/commands/RevokePermissionCommand";
import {GrantOriginCommand} from "src/domain/commands/GrantOriginCommand";
import {RevokeOriginCommand} from "src/domain/commands/RevokeOriginCommand";
import {AppFeature, FeatureIdent, FeatureType} from "src/models/AppFeature"


export class AppFeatures {
  features: AppFeature[] = [
    new AppFeature(FeatureIdent.BOOKMARKS, FeatureType.OPTIONAL, 'Bookmarks', 'o_bookmarks', ['bex'])
      .setActivateCommand(new GrantPermissionCommand('bookmarks'))
      .setDeactivateCommand(new RevokePermissionCommand('bookmarks')),

    new AppFeature(FeatureIdent.PAGE_MARKER, FeatureType.EXPERIMENTAL, 'Page Marker', 'o_note', ['bex'])
      .setActivateCommand(new GrantPermissionCommand('contextMenus'))
      .setDeactivateCommand(new RevokePermissionCommand('contextMenus')),

    new AppFeature(FeatureIdent.THUMBNAILS, FeatureType.OPTIONAL, 'Thumbnails', 'o_image', ['bex'])
      .setActivateCommand(new GrantOriginCommand('thumbnails'))
      .setDeactivateCommand(new RevokeOriginCommand('thumbnails')),

    new AppFeature(FeatureIdent.NEWEST_TABS, FeatureType.RECOMMENDED, 'Newest Tabs', 'o_schedule', ['all']),
    new AppFeature(FeatureIdent.TOP10, FeatureType.RECOMMENDED, 'Top 10 Tabs', 'o_workspace_premium', ['all']),
    new AppFeature(FeatureIdent.OPEN_TABS, FeatureType.RECOMMENDED, 'Open Tabs', 'o_playlist_add', ['bex']),

    new AppFeature(FeatureIdent.SAVE_TAB, FeatureType.EXPERIMENTAL, 'Save Tabs', 'o_save', ['bex'])
      .setActivateCommand(new GrantPermissionCommand('pageCapture')),
      //.setDeactivateCommand(new RevokePermissionCommand('pageCapture')),
    new AppFeature(FeatureIdent.GROUP_BY_DOMAIN, FeatureType.OPTIONAL, 'Group By Domain View', 'o_dns', ['all']),
    new AppFeature(FeatureIdent.OPENTABS_THRESHOLD, FeatureType.OPTIONAL, 'Open Tabs Warnings', 'o_tab', ['bex']),

    new AppFeature(FeatureIdent.EXPERIMENTAL_VIEWS, FeatureType.EXPERIMENTAL, 'Experimental Views', 'o_explore', ['all']),
    new AppFeature(FeatureIdent.RSS, FeatureType.EXPERIMENTAL, 'RSS View', 'o_rss_feed', ['bex', 'spa']),
    new AppFeature(FeatureIdent.SESSIONS, FeatureType.EXPERIMENTAL, 'Sessions', 'o_explore', ['all']),//,[FeatureIdent.OPENTABS_THRESHOLD]),
    new AppFeature(FeatureIdent.SPACES, FeatureType.EXPERIMENTAL, 'Spaces', 'o_space_dashboard', ['all']),
    new AppFeature(FeatureIdent.BACKUP, FeatureType.EXPERIMENTAL, 'Backup Tabset', 'o_inventory_2', ['bex']),//, [FeatureIdent.OPENTABS_THRESHOLD]),
    new AppFeature(FeatureIdent.IGNORE, FeatureType.EXPERIMENTAL, 'Ignore Tabset', 'o_pause_circle', ['bex']),

    new AppFeature(FeatureIdent.TABSET_PAGE, FeatureType.EXPERIMENTAL, 'Use Tabset Pages', 'o_article', ['all']),

    //new AppFeature(FeatureIdent.TAGS, FeatureType.OPTIONAL, 'Use Tags for Tabs', 'o_label', ['all']),
    new AppFeature(FeatureIdent.NOTES, FeatureType.EXPERIMENTAL, 'Mange Notes', 'o_note', ['bex']),
    new AppFeature(FeatureIdent.WEBSITE_CLIP, FeatureType.EXPERIMENTAL, 'Create an image clip from a website and store it', 'filter_center_focus', ['bex'])
      .setActivateCommand(new GrantPermissionCommand('notifications')),
    new AppFeature(FeatureIdent.STANDALONE_APP, FeatureType.EXPERIMENTAL, 'Standalone App', 'o_open_in_new', ['bex']),
    new AppFeature(FeatureIdent.AI_MODULE, FeatureType.EXPERIMENTAL, 'AI Module', 'o_auto_awesome', ['bex']),

    new AppFeature(FeatureIdent.CATEGORIZATION, FeatureType.EXPERIMENTAL, 'URL Categorization', 'o_auto_awesome', ['bex']),

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
