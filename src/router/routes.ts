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
    path: '/popup/welcome',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/popup/WelcomePage.vue') }],
  },
  {
    path: '/popup/getstarted',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/popup/GetStartedPage.vue') }],
  },
  {
    path: '/popup',
    component: () => import('layouts/PopupLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/popup/PopupPage.vue') }],
  },
  {
    path: '/popup/tabset',
    component: () => import('layouts/PopupLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/popup/PopupCollectionPage.vue') }],
  },
  {
    path: '/popup/tabsets',
    component: () => import('layouts/PopupLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/popup/PopupCollectionsPage.vue') }],
  },
  {
    path: '/popup/opentabs',
    component: () => import('layouts/PopupLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/popup/PopupOpenTabsPage.vue') }],
  },
  {
    path: '/popup/settings',
    component: () => import('layouts/PopupLayout.vue'),
    children: [{ path: '', component: () => import('src/core/pages/popup/PopupSettingsPage.vue') }],
  },

  {
    path: '/overlay/annotations',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{ path: '', component: () => import('src/annotations/AnnotationOverlay.vue') }],
  },

  /** FullPage **/
  {
    path: '/fullpage',
    component: () => import('layouts/FullPageLayout.vue'),
    children: [
      { path: '', component: () => import('src/core/pages/FullpageStart.vue') },
      { path: 'tabsets/:tabsetId', component: () => import('src/tabsets/pages/TabsetPage.vue') },
      {
        path: 'spaces',
        component: () => import('src/spaces/pages/MainPanelSpacesPage.vue'),
        props: { fullpage: true },
      },
    ],
  },

  /** SidePanel **/
  {
    path: '/sidepanel',
    component: () => import('layouts/SidePanelLayout.vue'),
    children: [
      { path: '', component: () => import('src/core/pages/SidePanelPage2.vue') },
      { path: 'bookmarks', component: () => import('src/core/pages/sidepanel/SidePanelBookmarksPage.vue') },
      {
        path: 'bookmarks/import',
        component: () => import('layouts/SidePanelWithoutLayout.vue'),
        children: [{ path: '', component: () => import('src/core/pages/sidepanel/SidePanelImportBookmarksPage.vue') }],
      },
      { path: 'byDomainList', component: () => import('src/core/pages/sidepanel/SidePanelByDomainList.vue') },
      { path: 'byDomain/:encodedUrl', component: () => import('src/core/pages/sidepanel/SidePanelByDomainPage.vue') },
      { path: 'collections', component: () => import('src/core/pages/SidePanelCollectionsPage.vue') },
      { path: 'latestList', component: () => import('src/pages/sidepanel/SidePanelLatestTabsPage.vue') },
      { path: 'messages', component: () => import('src/core/pages/sidepanel/SidePanelMessagesPage.vue') },
      { path: 'reminders', component: () => import('src/tabsets/pages/SidePanelRemindersPage.vue') },
      { path: 'research/:sourceId', component: () => import('src/core/pages/SidePanelResearchPage.vue') },
      { path: 'rss/:encodedUrl', component: () => import('src/core/pages/sidepanel/SidePanelRssPage.vue') },
      { path: 'rsslist', component: () => import('src/core/pages/sidepanel/SidePanelRssListViewer.vue') },
      { path: 'search', component: () => import('src/pages/SidePanelSearchPage.vue') },
      { path: 'sessions', component: () => import('src/tabsets/pages/SidePanelSessionsPage.vue') },
      { path: 'spaces', component: () => import('src/spaces/pages/SidePanelSpacesPage.vue') },
      { path: 'tab/:tabId', component: () => import('src/core/pages/sidepanel/SidePanelTabDetails.vue') },
      { path: 'tabsAsTree', component: () => import('src/core/pages/sidepanel/SidePanelTabsAsTreePage.vue') },
      { path: 'tabslist', component: () => import('src/opentabs/pages/SidePanelOpenTabsPage.vue') },
      { path: 'tags', component: () => import('src/core/pages/sidepanel/SidePanelTagsPage.vue') },
      { path: 'tagslist', component: () => import('src/core/pages/sidepanel/SidePanelTagsListViewer.vue') },
      { path: 'top10List', component: () => import('src/core/pages/sidepanel/SidePanelTop10Page.vue') },
      {
        path: 'welcome',
        component: () => import('layouts/SidePanelWithoutLayout.vue'),
        children: [{ path: '', component: () => import('src/core/pages/sidepanel/WelcomePage.vue') }],
      },
    ],
  },

  /** MainPanel (chrome extension plus main screen) **/
  {
    path: '/mainpanel',
    component: () => import('layouts/PlainLayout.vue'),
    children: [
      { path: 'bookmarks/:id', component: () => import('src/bookmarks/pages/MainPanelBookmarksPage.vue') },
      { path: 'editedHtml/:snapshotId', component: () => import('src/snapshots/pages/MainPanelHtmlPage.vue') },
      //{ path: 'features/:feature', component: () => import('src/features/pages/FeaturesPage.vue') },
      {
        path: 'features/:feature',
        component: () => import('layouts/PlainWithRightDrawerLayout.vue'),
        children: [{ path: '', component: () => import('src/features/pages/FeaturesPage.vue') }],
      },
      { path: 'html/:snapshotId', component: () => import('src/snapshots/pages/MainPanelHtmlPage.vue') },
      { path: 'html/:tabId/:blobId', component: () => import('src/snapshots/pages/MainPanelHtmlPage.vue') },
      { path: 'mhtml/:snapshotId', component: () => import('src/snapshots/pages/MainPanelMHtmlPage.vue') },
      { path: 'mhtml/:tabId/:blobIndex', component: () => import('src/snapshots/pages/MainPanelMHtmlPage.vue') },
      {
        path: 'navigation',
        component: () => import('layouts/MainNavigationLayout.vue'),
        children: [{ path: '', component: () => import('src/core/pages/mainpanel/NavigationPage.vue') }],
      },
      { path: 'obsidian/files/:file', component: () => import('src/core/pages/ObsidianPage.vue') },
      {
        path: 'pages/:pageId',
        component: () => import('src/tabsets/pages/cms/CustomPage.vue'),
        props: { edit: false },
      },
      {
        path: 'pages/:pageId/edit',
        component: () => import('src/tabsets/pages/cms/CustomPage.vue'),
        props: { edit: true },
      },
      { path: 'pdf/:snapshotId', component: () => import('src/snapshots/pages/MainPanelPdfPage.vue') },
      { path: 'pdf/:tabId/:blobId', component: () => import('src/snapshots/pages/MainPanelPngPage.vue') },
      { path: 'png/:snapshotId', component: () => import('src/snapshots/pages/MainPanelPngPage.vue') },
      { path: 'readingmode/:tabId', component: () => import('src/core/pages/mainpanel/MainPanelReadingModePage.vue') },
      { path: 'restapi/:api', component: () => import('src/core/pages/RestCallResultPage.vue') },
      {
        path: 'settings',
        component: () => import('layouts/PlainWithRightDrawerLayout.vue'),
        children: [{ path: '', component: () => import('src/pages/SettingsPage.vue') }],
      },
      {
        path: 'spaces',
        component: () => import('src/spaces/pages/MainPanelSpacesPage.vue'),
        props: { fullpage: false },
      },
      { path: 'tab/:id', component: () => import('src/core/pages/TabPage.vue') },
      { path: 'tabAssignment/:id', component: () => import('src/pages/mainpanel/MainPanelTabAssignmentPage.vue') },
      { path: 'tabsets/overview', component: () => import('src/tabsets/pages/MainPanelTabsetsOverviewPage.vue') },
      {
        path: 'tabsets/overview/:tabsetId',
        component: () => import('src/tabsets/pages/MainPanelTabsetOverviewPage.vue'),
      },
      {
        path: 'rezepte/:tabsetId',
        component: () => import('layouts/RezepteLayout.vue'),
        children: [{ path: '', component: () => import('src/pages/rezepte/IndexPage.vue') }],
      },
      {
        path: 'visualizations/folders',
        component: () => import('src/tabsets/pages/MainPanelFolderVisualisationPage.vue'),
      },
    ],
  },

  {
    path: '/recipe',
    component: () => import('layouts/RezepteLayout.vue'),
    children: [{ path: ':id', component: () => import('pages/rezepte/RecipeDetail.vue') }],
  },

  /** Overlay **/
  {
    path: '/overlay',
    component: () => import('layouts/MainNavigationLayout.vue'),
    children: [
      { path: 'note/:tabId', component: () => import('src/core/pages/mainpanel/NoteOverlayPage.vue'), props: true },
      {
        path: 'snapshots/:tabId',
        component: () => import('src/core/pages/mainpanel/SnapshotOverlayPage.vue'),
        props: true,
      },
    ],
  },

  /** TODOS **/

  {
    path: '/features/:feature',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{ path: '', component: () => import('src/features/pages/FeaturesPage.vue') }],
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

  {
    path: '/:catchAll(.*)*',
    component: () => import('src/app/pages/ErrorNotFound.vue'),
  },
]

export default routes
