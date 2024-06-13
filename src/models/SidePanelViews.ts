import {useFeaturesStore} from "src/features/stores/featuresStore";
import {FeatureIdent} from "src/models/FeatureIdent";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";

export class SidePanelViews {

  static readonly MAIN = new SidePanelViews('main', '/sidepanel');

  static readonly TABS_LIST = new SidePanelViews('tabsList', '/sidepanel/tabslist',
    () => useFeaturesStore().hasFeature(FeatureIdent.OPEN_TABS));

  static readonly TAGS_LIST = new SidePanelViews('tagsList', '/sidepanel/tagslist',
    () => useFeaturesStore().hasFeature(FeatureIdent.TAGS) && useTabsetsStore().allTabsCount > 0);

  static readonly TAG = new SidePanelViews('tag', '/sidepanel/tags');

  static readonly BY_DOMAIN_LIST = new SidePanelViews('byDomainList', '/sidepanel/byDomainList',
    () => useFeaturesStore().hasFeature(FeatureIdent.GROUP_BY_DOMAIN));

  static readonly RSS_LIST = new SidePanelViews('rssList', '/sidepanel/rsslist',
    () => useFeaturesStore().hasFeature(FeatureIdent.RSS));

  static readonly NEWEST_TABS_LIST = new SidePanelViews('newestList', '/sidepanel/newestList',
    () => useFeaturesStore().hasFeature(FeatureIdent.NEWEST_TABS));

  static readonly TOP_10_TABS_LIST = new SidePanelViews('top10List', '/sidepanel/top10List',
    () => useFeaturesStore().hasFeature(FeatureIdent.TOP10));

  static readonly BOOKMARKS = new SidePanelViews('bookmarks', '/sidepanel/bookmarks',
    () => useFeaturesStore().hasFeature(FeatureIdent.BOOKMARKS)) //&& useRoute()?.path !== "/sidepanel/welcome");

  static readonly PUBLIC_TABSETS = new SidePanelViews('categorized_tabsets', '/sidepanel/byCategory',
    () => true);

  static readonly TAGS_VIEWER = new SidePanelViews('categorized_tabsets', '/sidepanel/byCategory',
    () => useFeaturesStore().hasFeature(FeatureIdent.TAGS));

  static readonly MESSAGES = new SidePanelViews('messages', '/sidepanel/messages')

  static readonly TABS_AS_TREE = new SidePanelViews('tabsAsTree', '/sidepanel/tabsAsTree',
    () => useFeaturesStore().hasFeature(FeatureIdent.TABS_AS_TREE))

  private constructor(
    public readonly ident: string,
    public readonly path: any,
    public readonly showButtonFunction: Function = () => true) {
  }

  toString() {
    return this.ident;
  }

  showButton() {
    return this.showButtonFunction()
  }

}
