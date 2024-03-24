import {RouteRecordRaw} from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    // @ts-ignore
    redirect: (process.env.MODE === 'pwa' || process.env.MODE === 'electron') ?
      '/tabsets' : // use case: sharing tabset, opening link, import in PWA for anonymous user
      //'/sidepanel' : // use case: ???
      '/sidepanel'
  },
  {
    path: '/refresh/:redirect',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{path: '', component: () => import('pages/RefreshPage.vue')}],
  },
  {
    path: '/start',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{path: '', component: () => import('pages/StartPage.vue')}],
  },
  {
    path: '/login',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{path: '', component: () => import('pages/mainpanel/FullPageLoginPage.vue')}],
  },
  {
    path: '/fullpage',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{path: '', component: () => import('pages/FullpageStart.vue')}],
  },
  {
    path: '/sidepanel',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{path: '', component: () => import('pages/SidePanelPage.vue')}],
  },
  {
    path: '/sidepanel/welcome',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{path: '', component: () => import('pages/sidepanel/WelcomePage.vue')}],
  },
  {
    path: '/sidepanel/tabsets/:tabsetId',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{path: '', component: () => import('pages/SidePanelTabsetPage.vue')}],
  },
  {
    path: '/sidepanel/spaces',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{path: '', component: () => import('pages/SidePanelSpacesPage.vue')}],
  },
  {
    path: '/sidepanel/search',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{path: '', component: () => import('pages/SidePanelSearchPage.vue')}],
  },
  {
    path: '/sidepanel/tab/:tabId',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{path: '', component: () => import('pages/sidepanel/SidePanelTabDetails.vue')}],
  },
  {
    path: '/sidepanel/bookmarks',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{path: '', component: () => import('pages/sidepanel/SidePanelBookmarksPage.vue')}],
  },
  {
    path: '/sidepanel/tabslist',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{path: '', component: () => import('pages/sidepanel/SidePanelOpenTabsPage.vue')}],
  },
  {
    path: '/sidepanel/tagslist',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{path: '', component: () => import('pages/sidepanel/SidePanelTagsListViewer.vue')}],
  },
  {
    path: '/sidepanel/tags',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{path: '', component: () => import('pages/sidepanel/SidePanelTagsPage.vue')}],
  },
  {
    path: '/sidepanel/rsslist',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{path: '', component: () => import('pages/sidepanel/SidePanelRssListViewer.vue')}],
  },
  {
    path: '/sidepanel/rss/:encodedUrl',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{path: '', component: () => import('pages/sidepanel/SidePanelRssPage.vue')}],
  },
  {
    path: '/sidepanel/byDomainList',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{path: '', component: () => import('pages/sidepanel/SidePanelByDomainList.vue')}],
  },
  {
    path: '/sidepanel/newestList',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{path: '', component: () => import('pages/sidepanel/SidePanelNewestTabsPage.vue')}],
  },
  {
    path: '/sidepanel/tabsAsTree',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{path: '', component: () => import('pages/sidepanel/SidePanelTabsAsTreePage.vue')}],
  },
  {
    path: '/sidepanel/entityManager',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{path: '', component: () => import('pages/sidepanel/SidePanelEntitiesPage.vue')}],
  },
  {
    path: '/sidepanel/messages',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{path: '', component: () => import('pages/sidepanel/SidePanelMessagesPage.vue')}],
  },
  {
    path: '/sidepanel/top10List',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{path: '', component: () => import('pages/sidepanel/SidePanelTop10Page.vue')}],
  },
  {
    path: '/sidepanel/byDomain/:encodedUrl',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{path: '', component: () => import('pages/sidepanel/SidePanelByDomainPage.vue')}],
  },
  {
    path: '/mainpanel/settings',
    component: () => import('layouts/PlainWithRightDrawerLayout.vue'),
    children: [{path: '', component: () => import('pages/SettingsPage.vue')}],
  },
  {
    path: '/mainpanel/features/:feature',
    component: () => import('layouts/PlainWithRightDrawerLayout.vue'),
    children: [{path: '', component: () => import('pages/FeaturesPage.vue')}],
  },
  {
    path: '/mainpanel/notes/:noteId/edit', // editorjs setup cannot toggle between readonly/write mode
    component: () => import('layouts/PlainLayout.vue'),
    children: [{path: '', component: () => import('pages/mainpanel/MainPanelNotePage.vue')}],
  },
  {
    path: '/mainpanel/notes/:noteId',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{path: '', component: () => import('pages/mainpanel/MainPanelNotePage.vue')}],
  },
  {
    path: '/mainpanel/notes/',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{path: '', component: () => import('pages/mainpanel/MainPanelNotePage.vue')}],
  },
  {
    path: '/mainpanel/tabsets/:tabsetId', // TODO combine with Tabset page
    component: () => import('layouts/PlainLayout.vue'),
    children: [{path: '', component: () => import('pages/TabsetPage.vue')}],
  },
  {
    path: '/mainpanel/png/:tabId/:blobId',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{path: '', component: () => import('pages/mainpanel/MainPanelPngPage.vue')}],
  },
  {
    path: '/mainpanel/tab/:id',// TODO combine with Tag page
    component: () => import('layouts/PlainLayout.vue'),
    children: [{path: '', component: () => import('pages/TabPage.vue')}],
  },
  {
    path: '/mainpanel/suggestions/:suggestionId',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{path: '', component: () => import('pages/mainpanel/MainPanelCheckSuggestionPage.vue')}],
  },
  {
    path: '/mainpanel/spaces', // TODO combine with Spaces page
    component: () => import('layouts/PlainLayout.vue'),
    children: [{path: '', component: () => import('pages/mainpanel/MainPanelSpacesPage.vue')}],
  },
  {
    path: '/mainpanel/bookmarks/:id',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{path: '', component: () => import('pages/mainpanel/MainPanelBookmarksPage.vue')}],
  },
  {
    path: '/mainpanel/tabAssignment/:id',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{path: '', component: () => import('pages/mainpanel/MainPanelTabAssignmentPage.vue')}],
  },
  {
    path: '/mainpanel/readingmode/:tabId',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{path: '', component: () => import('pages/mainpanel/MainPanelReadingModePage.vue')}],
  },
  {
    path: '/settings',
    component: () => import('layouts/DefaultLayout.vue'),
    children: [{path: '', component: () => import('pages/SettingsPage.vue')}],
  },
  {
    path: '/tabsets/:tabsetId',
    component: () => import('layouts/FullPageLayout.vue'),
    children: [{path: '', component: () => import('pages/TabsetPage.vue')}],
  },
  {
    path: '/tabsets',
    component: () => import('layouts/FullPageLayout.vue'),
    children: [{path: '', component: () => import('pages/TabsetPage.vue')}],
  },
  {
    path: '/dynamicTs/:tabsetId',
    component: () => import('layouts/FullPageLayout.vue'),
    children: [{path: '', component: () => import('pages/TabsetPage.vue')}],
  },
  {
    path: '/tab/:id',
    component: () => import('layouts/DefaultLayout.vue'),
    children: [{path: '', component: () => import('pages/TabPage.vue')}],
  },
  {
    path: '/bookmarks/:id',
    component: () => import('layouts/FullPageLayout.vue'),
    children: [{path: '', component: () => import('pages/BookmarksPage.vue')}],
  },
  {
    path: '/spaces',
    component: () => import('layouts/DefaultLayout.vue'),
    children: [{path: '', component: () => import('pages/Spaces.vue')}],
  },
  {
    path: '/rss/:encodedUrl',
    component: () => import('layouts/DefaultLayout.vue'),
    children: [{path: '', component: () => import('pages/RssPage.vue')}],
  },
  {
    path: '/bydomain/:encodedUrl',
    component: () => import('layouts/FullPageLayout.vue'),
    children: [{path: '', component: () => import('pages/ByDomainPage.vue')}],
  },
  {
    path: '/historyByAge/:encodedAge',
    component: () => import('layouts/DefaultLayout.vue'),
    children: [{path: '', component: () => import('pages/ByAgePage.vue')}],
  },
  {
    path: '/features/:feature',
    component: () => import('layouts/FullPageLayout.vue'),
    children: [{path: '', component: () => import('pages/FeaturesPage.vue')}],
  },
  {
    path: '/search',
    component: () => import('layouts/FullPageLayout.vue'),
    children: [{path: '', component: () => import('pages/SearchPage.vue')}],
  },
  {
    path: '/searchresult',
    component: () => import('layouts/FullPageLayout.vue'),
    children: [{path: '', component: () => import('pages/SearchResultPage.vue')}],
  },
  {
    path: '/pwa/imp/:sharedId',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{path: '', component: () => import('pages/public/ImportPublicTabsetPage.vue')}],
  },
  {
    path: '/pwa/tabsets/:tabsetId',
    component: () => import('layouts/PwaPageLayout.vue'),
    children: [{path: '', component: () => import('pages/pwa/PwaTabsetPage.vue')}],
  },
  {
    path: '/contentscript',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{path: '', component: () => import('pages/contentscript/ContentScriptPage.vue')}],
  },
  // {
  //   path: '/annotations/:tabId',
  //   component: () => import('layouts/PlainLayout.vue'),
  //   children: [{ path: '', component: () => import('pages/annotations/TabAnnotation.vue') }],
  // },
  {
    path: '/iframe/:tabId',
    component: () => import('layouts/DefaultLayout.vue'),
    children: [{path: '', component: () => import('pages/IFramePage.vue')}],
  },
  {
    path: '/preview/:tabId',
    component: () => import('layouts/DefaultLayout.vue'),
    children: [{path: '', component: () => import('pages/PreviewPage.vue')}],
  },
  {
    path: '/browser/:tabId',
    component: () => import('layouts/FullPageLayout.vue'),
    children: [{path: '', component: () => import('pages/BrowserViewPage.vue')}],
  },
  {
    path: '/mainpanel/entities/:entityId', // editorjs setup cannot toggle between readonly/write mode
    component: () => import('layouts/PlainLayout.vue'),
    children: [{path: '', component: () => import('pages/mainpanel/MainPanelEntityPage.vue')}],
  },
  {
    path: '/mainpanel/entities/:entityId/items',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{path: '', component: () => import('pages/mainpanel/MainPanelEntityItemPage.vue')}],
  },
  {
    path: '/mainpanel/entities/:entityId',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{path: '', component: () => import('pages/mainpanel/MainPanelEntityPage.vue')}],
  },
  {
    path: '/help/:ident',
    component: () => import('layouts/DefaultLayout.vue'),
    children: [{path: '', component: () => import('pages/HelpPage.vue')}],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
