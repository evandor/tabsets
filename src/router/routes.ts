import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect:
      process.env.MODE === 'pwa'
        ? '/sidepanel' // use case: sharing tabset, opening link, import in PWA for anonymous user
        : //'/sidepanel' : // use case: ???
          '/sidepanel',
  },
  {
    path: '/fullpage',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/FullpageStart.vue') }],
  },
  {
    path: '/sidepanel',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/SidePanelPage2.vue') }],
  },
  {
    path: '/sidepanel/collections',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/SidePanelCollectionsPage.vue') }],
  },
  {
    path: '/sidepanel/welcome',
    component: () => import('layouts/SidePanelNoFooterLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/sidepanel/WelcomePage.vue') }],
  },
  // {
  //   path: '/sidepanel/tabsets/:tabsetId',
  //   component: () => import('layouts/SidePanelLayout.vue'),
  //   children: [{ path: '', component: () => import('src/tabsets/pages/SidePanelTabsetPage.vue') }],
  // },
  {
    path: '/sidepanel/spaces',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{ path: '', component: () => import('src/spaces/pages/SidePanelSpacesPage.vue') }],
  },
  {
    path: '/sidepanel/search',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{ path: '', component: () => import('src/pages/sidepanelSearchPage.vue') }],
  },
  {
    path: '/sidepanel/research/:sourceId',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/SidePanelResearchPage.vue') }],
  },
  {
    path: '/sidepanel/tab/:tabId',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/sidepanel/SidePanelTabDetails.vue') }],
  },
  {
    path: '/sidepanel/bookmarks/import',
    component: () => import('layouts/SidePanelNoFooterLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/sidepanel/SidePanelImportBookmarksPage.vue') }],
  },
  {
    path: '/sidepanel/bookmarks',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/sidepanel/SidePanelBookmarksPage.vue') }],
  },
  {
    path: '/sidepanel/tabslist',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{ path: '', component: () => import('src/opentabs/pages/SidePanelOpenTabsPage.vue') }],
  },
  {
    path: '/sidepanel/sessions',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{ path: '', component: () => import('src/tabsets/pages/SidePanelSessionsPage.vue') }],
  },
  {
    path: '/sidepanel/reminders',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{ path: '', component: () => import('src/tabsets/pages/SidePanelRemindersPage.vue') }],
  },
  {
    path: '/sidepanel/tagslist',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/sidepanel/SidePanelTagsListViewer.vue') }],
  },
  {
    path: '/sidepanel/tags',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/sidepanel/SidePanelTagsPage.vue') }],
  },
  {
    path: '/sidepanel/rsslist',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/sidepanel/SidePanelRssListViewer.vue') }],
  },
  {
    path: '/sidepanel/rss/:encodedUrl',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/sidepanel/SidePanelRssPage.vue') }],
  },
  {
    path: '/sidepanel/byDomainList',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/sidepanel/SidePanelByDomainList.vue') }],
  },
  // {
  //   path: '/sidepanel/sharedTsList',
  //   component: () => import('layouts/SidePanelLayout.vue'),
  //   children: [{path: '', component: () => import('src/core/pages/sidepanel/SidePanelSharedTsList.vue')}],
  // },
  {
    path: '/sidepanel/latestList',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{ path: '', component: () => import('src/pages/sidepanel/SidePanelLatestTabsPage.vue') }],
  },
  {
    path: '/sidepanel/tabsAsTree',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/sidepanel/SidePanelTabsAsTreePage.vue') }],
  },
  {
    path: '/sidepanel/notesView',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/sidepanel/SidePanelNotesViewPage.vue') }],
  },
  {
    path: '/sidepanel/messages',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/sidepanel/SidePanelMessagesPage.vue') }],
  },
  {
    path: '/sidepanel/top10List',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/sidepanel/SidePanelTop10Page.vue') }],
  },
  {
    path: '/sidepanel/byDomain/:encodedUrl',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/sidepanel/SidePanelByDomainPage.vue') }],
  },
  {
    path: '/sidepanel/research/:sourceId',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/SidePanelResearchPage.vue') }],
  },
  {
    path: '/mainpanel/settings',
    component: () => import('layouts/PlainWithRightDrawerLayout.vue'),
    children: [{ path: '', component: () => import('src/pages/SettingsPage.vue') }],
  },
  {
    path: '/mainpanel/features/:feature',
    component: () => import('layouts/PlainWithRightDrawerLayout.vue'),
    children: [{ path: '', component: () => import('src/features/pages/FeaturesPage.vue') }],
  },
  {
    path: '/mainpanel/notes/:notebookId',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{ path: '', component: () => import('src/notes/pages/mainpanel/MainPanelNotePage.vue') }],
  },
  {
    path: '/mainpanel/notes/:notebookId/:subNoteId',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{ path: '', component: () => import('src/notes/pages/mainpanel/MainPanelNotePage.vue') }],
  },
  {
    path: '/mainpanel/notes/',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{ path: '', component: () => import('src/notes/pages/mainpanel/MainPanelNotePage.vue') }],
  },
  {
    path: '/mainpanel/html/:snapshotId', // both MHtml and HTML managed by same page
    component: () => import('layouts/PlainLayout.vue'),
    children: [{ path: '', component: () => import('src/snapshots/pages/MainPanelHtmlPage.vue') }],
  },
  {
    path: '/mainpanel/editedHtml/:snapshotId',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{ path: '', component: () => import('src/snapshots/pages/MainPanelHtmlPage.vue') }],
  },
  {
    path: '/mainpanel/mhtml/:snapshotId',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{ path: '', component: () => import('src/snapshots/pages/MainPanelMHtmlPage.vue') }],
  },
  {
    path: '/mainpanel/png/:snapshotId',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{ path: '', component: () => import('src/snapshots/pages/MainPanelPngPage.vue') }],
  },
  {
    path: '/mainpanel/pdf/:snapshotId',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{ path: '', component: () => import('src/snapshots/pages/MainPanelPdfPage.vue') }],
  },

  {
    path: '/mainpanel/tabsets/overview/:tabsetId',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{ path: '', component: () => import('src/tabsets/pages/MainPanelTabsetOverviewPage.vue') }],
  },
  {
    path: '/mainpanel/tabsets/overview',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{ path: '', component: () => import('src/tabsets/pages/MainPanelTabsetsOverviewPage.vue') }],
  },
  {
    path: '/mainpanel/png/:tabId/:blobId',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{ path: '', component: () => import('src/notes/pages/mainpanel/MainPanelNotePage.vue') }],
  },
  {
    path: '/mainpanel/html/:tabId/:blobId',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{ path: '', component: () => import('src/snapshots/pages/MainPanelHtmlPage.vue') }],
  },
  {
    path: '/mainpanel/pdf/:tabId/:blobId',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{ path: '', component: () => import('src/snapshots/pages/MainPanelPngPage.vue') }],
  },
  {
    path: '/mainpanel/tab/:id', // TODO combine with Tag page
    component: () => import('layouts/PlainLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/TabPage.vue') }],
  },
  // {
  //   path: '/mainpanel/suggestions/:suggestionId',
  //   component: () => import('layouts/PlainLayout.vue'),
  //   children: [
  //     {
  //       path: '',
  //       component: () => import('src/suggestions/pages/MainPanelCheckSuggestionPage.vue'),
  //     },
  //   ],
  // },
  {
    path: '/mainpanel/spaces', // TODO combine with Spaces page
    component: () => import('layouts/PlainLayout.vue'),
    children: [{ path: '', component: () => import('src/spaces/pages/MainPanelSpacesPage.vue') }],
  },
  {
    path: '/mainpanel/bookmarks/:id',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{ path: '', component: () => import('src/bookmarks/pages/MainPanelBookmarksPage.vue') }],
  },
  {
    path: '/mainpanel/tabAssignment/:id',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{ path: '', component: () => import('src/pages/mainpanel/MainPanelTabAssignmentPage.vue') }],
  },
  {
    path: '/mainpanel/mhtml/:tabId/:blobIndex',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{ path: '', component: () => import('src/snapshots/pages/MainPanelMHtmlPage.vue') }],
  },
  {
    path: '/mainpanel/readingmode/:tabId',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/mainpanel/MainPanelReadingModePage.vue') }],
  },
  {
    path: '/mainpanel/navigation',
    component: () => import('layouts/MainNavigationLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/mainpanel/NavigationPage.vue') }],
  },
  {
    path: '/overlay/note',
    component: () => import('layouts/MainNavigationLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/mainpanel/NoteOverlayPage.vue') }],
  },
  {
    path: '/overlay/snapshots',
    component: () => import('layouts/MainNavigationLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/mainpanel/SnapshotOverlayPage.vue') }],
  },
  {
    path: '/settings',
    component: () => import('layouts/DefaultLayout.vue'),
    children: [{ path: '', component: () => import('src/pages/SettingsPage.vue') }],
  },
  {
    path: '/tabsets/:tabsetId',
    component: () => import('layouts/FullPageLayout.vue'),
    children: [{ path: '', component: () => import('src/tabsets/pages/TabsetPage.vue') }],
  },
  {
    path: '/tabsets',
    component: () => import('layouts/FullPageLayout.vue'),
    children: [{ path: '', component: () => import('src/tabsets/pages/TabsetPage.vue') }],
  },
  {
    path: '/dynamicTs/:tabsetId',
    component: () => import('layouts/FullPageLayout.vue'),
    children: [{ path: '', component: () => import('src/tabsets/pages/TabsetPage.vue') }],
  },
  // {
  //   path: '/tab/:id',
  //   component: () => import('layouts/DefaultLayout.vue'),
  //   children: [{path: '', component: () => import('src/core/pages/TabPage.vue')}],
  // },
  {
    path: '/bookmarks/:id',
    component: () => import('layouts/FullPageLayout.vue'),
    children: [{ path: '', component: () => import('src/bookmarks/pages/BookmarksPage.vue') }],
  },
  {
    path: '/bydomain/:encodedUrl',
    component: () => import('layouts/FullPageLayout.vue'),
    children: [{ path: '', component: () => import('src/tabsets/pages/ByDomainPage.vue') }],
  },
  {
    path: '/historyByAge/:encodedAge',
    component: () => import('layouts/DefaultLayout.vue'),
    children: [{ path: '', component: () => import('src/tabsets/pages/ByAgePage.vue') }],
  },
  {
    path: '/search',
    component: () => import('layouts/FullPageLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/SearchPage.vue') }],
  },
  {
    path: '/searchresult',
    component: () => import('layouts/FullPageLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/SearchResultPage.vue') }],
  },
  // {
  //   path: '/iframe/:tabId',
  //   component: () => import('layouts/DefaultLayout.vue'),
  //   children: [{path: '', component: () => import('src/core/pages/IFramePage.vue')}],
  // },
  // {
  //   path: '/preview/:tabId',
  //   component: () => import('layouts/DefaultLayout.vue'),
  //   children: [{ path: '', component: () => import('src/core/pages/PreviewPage.vue') }],
  // },
  {
    path: '/browser/:tabId',
    component: () => import('layouts/FullPageLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/BrowserViewPage.vue') }],
  },
  // {
  //   path: '/help/:ident',
  //   component: () => import('layouts/DefaultLayout.vue'),
  //   children: [{ path: '', component: () => import('src/core/pages/HelpPage.vue') }],
  // },
  {
    path: '/mainpanel/obsidian/files/:file',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/ObsidianPage.vue') }],
  },
  {
    path: '/mainpanel/restapi/:api',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/RestCallResultPage.vue') }],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('src/app/pages/ErrorNotFound.vue'),
  },
]

export default routes
