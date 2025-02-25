import _ from 'lodash'
import { FeatureIdent, FeatureType } from 'src/app/models/FeatureIdent'
import { GrantPermissionCommand } from 'src/core/domain/commands/GrantPermissionCommand'
import { RevokePermissionCommand } from 'src/core/domain/commands/RevokePermissionCommand'
import { Feature } from 'src/features/models/Feature'

export class AppFeatures {
  features: Feature[] = [
    new Feature(
      FeatureIdent.DEV_MODE,
      'INTERNAL',
      'Developer Mode',
      'A feature toggle to switch between dev mode on/off',
      '',
      '',
      ['all'],
    ),

    new Feature(
      FeatureIdent.BOOKMARKS,
      'RECOMMENDED',
      'Bookmarks Manager',
      'Activate a Bookmark Manager in the Side Panel',
      'o_bookmark',
      '/bookmarks.png',
      ['all'],
      [],
      false,
      'warning',
    ),

    new Feature(
      FeatureIdent.GALLERY,
      'OPTIONAL',
      'Gallery View',
      'View and organize your tabs in a Tabset Gallery',
      'calendar_view_month',
      '/gallery.png',
      ['all'],
      [],
      false,
      'primary',
    ),

    new Feature(
      FeatureIdent.STATS,
      'RECOMMENDED',
      'Stats Widget',
      'Activate a little Widget to display some statistics (tabs count etc)',
      'show_chart',
      '/stats.png',
      ['bex'],
    ),

    new Feature(
      FeatureIdent.TOP10,
      'OPTIONAL',
      'Top 10 Tabs',
      'Activate a view to list all tabs by how often they have been accessed',
      'o_workspace_premium',
      '/top10.png',
      ['all'],
    ),

    new Feature(
      FeatureIdent.WINDOWS_MANAGEMENT,
      'EXPERIMENTAL',
      'Windows Management',
      'Access to your browsers windows and their tabs',
      'o_grid_view',
      '',
      ['all'],
    ),

    // new Feature(
    //   FeatureIdent.OPEN_TABS,
    //   'RECOMMENDED',
    //   'Open Tabs',
    //   'Quick access to all your open tabs of the current browsers window<br><br>' +
    //     'Adds quick navigation to jump back and forth to recently opened tabs.',
    //   'o_playlist_add',
    //   '/opentabs.png',
    //   ['bex'],
    // ),

    new Feature(
      FeatureIdent.GROUP_BY_DOMAIN,
      'OPTIONAL',
      'Group By Domain View',
      'The "Grouped By Domain" Feature provides a view where you can see all your tabs grouped by Domains. All Domains with at least two matching tabs will be considered.',
      'o_dns',
      '/groupedByDomain.png',
      ['all'],
    ),

    new Feature(
      FeatureIdent.OPENTABS_THRESHOLD,
      'OPTIONAL',
      'Open Tabs Warnings',
      'The Idea behind the tabset extension is to keep your tabs count small - and still deal with all the URLs you need to handle. Tabsets' +
        ' can help you by tracking your open tabs count and alert you when it gets too big. Furthermore, it offers you ways to reduce your tab count on the fly. This ' +
        'feature is customizable in the settings.',
      'o_tab',
      '/open_tabs_warning.png',
      ['bex'],
    ),

    // new Feature(FeatureIdent.EXPERIMENTAL_VIEWS, 'EXPERIMENTAL',
    //   'Experimental Views',
    //   'The default view of your tabset is a list - but there can be other views as well like grids or even a canvas.',
    //   'o_explore', '', ['all']),

    new Feature(
      FeatureIdent.RSS,
      'EXPERIMENTAL',
      'RSS View',
      'The "RSS View" list all your RSS Pages. It is recommended to enable the "analyse Tabs" feature as well to automatically find linked rss feeds from your tabsets.',
      'o_rss_feed',
      '/rss.png',
      ['bex', 'spa'],
    ),

    new Feature(
      FeatureIdent.SESSIONS,
      'EXPERIMENTAL',
      'Sessions',
      'You want to start something in-between without losing your already opened tabs? Start a new session and come back to your old tabs whenever needed.',
      'sym_o_new_window',
      '',
      ['all'],
    )
      .setActivateCommands([new GrantPermissionCommand('sessions')])
      .setDeactivateCommands([new RevokePermissionCommand('sessions')]),

    new Feature(
      FeatureIdent.SPACES,
      'OPTIONAL',
      'Spaces',
      'The "Spaces" Feature lets you organize your tabsets in a larger structure, which might become handy ' +
        'if you start having many tabsets. The main difference to bookmark folders is that there is only two ' +
        'levels, but you can assign a tabset to multiple spaces.',
      'o_space_dashboard',
      '',
      ['all'],
    ),

    new Feature(
      FeatureIdent.BACKUP,
      'EXPERIMENTAL',
      'Backup Tabset',
      'Simply get rid of all open tabs by assigning them to this special tabset - a backup tabset which you can revisit later for proper assignment',
      'o_inventory_2',
      '',
      ['bex'],
    ),

    new Feature(
      FeatureIdent.TAGS,
      'OPTIONAL',
      'Use Tags for Tabs',
      'Tabs can be tagged with labels making it easier to be found again',
      'o_label',
      '',
      ['all'],
    ),

    new Feature(
      FeatureIdent.TABS_AS_TREE,
      'OPTIONAL',
      'Tabs as Tree',
      'A view organizing your tabs URLs as a tree',
      'account_tree',
      '',
      ['all'],
    ),

    new Feature(
      FeatureIdent.NEWEST_TABS,
      'OPTIONAL',
      'Latest Tabs',
      'A quick access view for your latest tabs',
      'schedule',
      '',
      ['all'],
    ),

    new Feature(
      FeatureIdent.RESEARCH_SESSIONS,
      'EXPERIMENTAL',
      'Research Sessions',
      'Add Research Capabilities to tabsets - save snapshots of pages and annotate them',
      'o_science',
      '',
      ['all'],
    )
      .setActivateCommands([new GrantPermissionCommand('pageCapture')])
      .setDeactivateCommands([new RevokePermissionCommand('pageCapture')]),

    new Feature(
      FeatureIdent.NOTES,
      'OPTIONAL',
      'Notes Feature',
      'CreateCreate notes and treat them like tabs',
      'o_note',
      '',
      ['all'],
    ),

    new Feature(
      FeatureIdent.STANDALONE_APP,
      'EXPERIMENTAL',
      'Standalone App',
      'Tabsets as full-page application',
      'o_open_in_new',
      '',
      ['bex'],
    ),

    new Feature(
      FeatureIdent.NOTIFICATIONS,
      'EXPERIMENTAL',
      'Browser Notifications',
      'Allow Tabsets to send Notifications via your Browser. Recommended.',
      'o_notifications',
      '',
      ['all'],
    )
      .setActivateCommands([new GrantPermissionCommand('notifications')])
      .setDeactivateCommands([new RevokePermissionCommand('notifications')]),

    new Feature(
      FeatureIdent.ANNOTATIONS,
      'DISABLED',
      'Annotate Websites',
      'Hightlight text on a website and create and comment on annotations.',
      'o_auto_awesome',
      '',
      ['bex'],
    ),

    new Feature(
      FeatureIdent.ARCHIVE_TABSET,
      'OPTIONAL',
      'Archive Tabsets',
      "Push Tabsets you don't need into an archive and restore them later if you want",
      'o_inventory_2',
      '',
      ['all'],
    ),

    new Feature(
      FeatureIdent.COLOR_TAGS,
      'OPTIONAL',
      'Color Tags',
      'Assign colors to Tabsets and Tabs as an additional organization level',
      'o_colorize',
      '',
      ['all'],
    ),

    new Feature(
      FeatureIdent.ADVANCED_TAB_MANAGEMENT,
      'EXPERIMENTAL',
      'Advanced Tab Management',
      'Sometimes you want pages to open in the same tab, even if the URLs are (slightly) different',
      'o_tab',
      '',
      ['all'],
    ),

    // permission allOrigins?
    new Feature(
      FeatureIdent.ANALYSE_TABS,
      'EXPERIMENTAL',
      'Analyse Tabs',
      "This extension can analyse the tabs you visit, so that the search can be improved significantly. The tab's content, " +
        'its links and the received http headers are taken into account. ' +
        'Please note that only tabs that you visit (or revisit) after the activation of this feature are going to be analysed.',
      'o_tab',
      '/analyse.png',
      ['bex'],
    )
      .setActivateCommands([new GrantPermissionCommand('webRequest')])
      .setImageWidth('700px'),

    new Feature(
      FeatureIdent.TAB_GROUPS,
      'EXPERIMENTAL',
      'Chrome Tab Groups',
      'Utilize Chrome Tab Groups',
      'o_view_list',
      '',
      ['chrome_bex'],
    ),
    // .setActivateCommands([new GrantPermissionCommand('tabGroups')]),

    new Feature(
      FeatureIdent.AUTO_TAB_SWITCHER,
      'EXPERIMENTAL',
      'Auto Tab Switcher',
      "Switch the Tab's URL every x Seconds",
      'o_switch_left',
      '',
      ['bex'],
    ),

    new Feature(
      FeatureIdent.WEBSITE_CLIP,
      'EXPERIMENTAL',
      'Website Clip',
      'Create an image clip from a website and store it',
      'filter_center_focus',
      '',
      ['bex'],
    ).setActivateCommands([new GrantPermissionCommand('notifications')]),

    new Feature(
      FeatureIdent.TAB_HELPER,
      'EXPERIMENTAL',
      'Tab Helper',
      'Add a small tag on any website to access tabsets features quickly.<br>' +
        'You need to restart tabsets if you activate or deactivate this feature.<br>' +
        'The Tabsets Helper Icon will appear on all pages you open once activated.',
      'o_article',
      '/tabhelper.png',
      ['bex'],
    ),

    new Feature(
      FeatureIdent.DYNAMIC_TABSET,
      'EXPERIMENTAL',
      'Dynamic Tabset',
      'Create a "dynamic" tabset which retrieves its tabs by interpreting its "source" URL',
      'dynamic_feed',
      '',
      ['bex'],
    ),
    // .setActivateCommands([new GrantPermissionCommand('notifications')]),

    new Feature(
      FeatureIdent.READING_MODE,
      'EXPERIMENTAL',
      'Reading Mode',
      'Analyse tab contents and use the distraction-free Reading Mode if applicable',
      'library_books',
      '',
      ['bex'],
    ),

    new Feature(
      FeatureIdent.HTML_SNIPPETS,
      'EXPERIMENTAL',
      'HTML Snippets',
      'Drag and drop Text and Images to the sidebar to create Website Snippets',
      'text_snippet',
      '',
      ['bex'],
    ),

    new Feature(
      FeatureIdent.TABSET_LIST,
      'EXPERIMENTAL',
      'List of recent Tabsets',
      'Switch beetween recent and favorite tabsets quickly',
      'list',
      '',
      ['bex'],
    ),

    new Feature(FeatureIdent.REMINDER, 'EXPERIMENTAL', 'Tab Reminder', 'Get a reminder to revisit a tab', 'alarm', '', [
      'all',
    ]),
  ]

  getFeature(f: FeatureIdent): Feature | undefined {
    const found = _.filter(this.features, (feature: Feature) => feature.ident === f.toString())
    if (found && found.length > 0) {
      return found[0]
    }
    return undefined
  }

  getFeatures(): Feature[] {
    return this.features
  }
}
