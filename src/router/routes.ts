import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/start'
  },
  {
    path: '/start',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Start.vue') }],
  },
  {
    path: '/popup',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{ path: '', component: () => import('pages/PopupPage.vue') }],
  },
  {
    path: '/about',
    component: () => import('layouts/AboutLayout.vue'),
    children: [{ path: '', component: () => import('pages/AboutPage.vue') }],
  },
  {
    path: '/trypro',
    component: () => import('layouts/DefaultLayout.vue'),
    children: [{ path: '', component: () => import('pages/TryPro.vue') }],
  },
  {
    path: '/settings',
    component: () => import('layouts/DefaultLayout.vue'),
    children: [{ path: '', component: () => import('pages/SettingsPage.vue') }],
  },
  {
    path: '/stats',
    component: () => import('layouts/DefaultLayout.vue'),
    children: [{ path: '', component: () => import('pages/StatsPage.vue') }],
  },
  {
    path: '/tabset',
    component: () => import('layouts/DefaultLayout.vue'),
    children: [{ path: '', component: () => import('pages/CurrentTabs.vue') }],
  },
  {
    path: '/tabsets/:tabsetId',
    component: () => import('layouts/DefaultLayout.vue'),
    children: [{ path: '', component: () => import('pages/TabsetPage.vue') }],
  },
  {
    path: '/entityManager/:type',
    component: () => import('layouts/DefaultLayout.vue'),
    children: [{ path: '', component: () => import('pages/EntityManagerPage.vue') }],
  },
  {
    path: '/collections/:type/:collectionId',
    component: () => import('layouts/DefaultLayout.vue'),
    children: [{ path: '', component: () => import('pages/CollectionPage.vue') }],
  },
  {
    path: '/dynamicTs/:tabsetId',
    component: () => import('layouts/DefaultLayout.vue'),
    children: [{ path: '', component: () => import('pages/DynamicTabsetPage.vue') }],
  },
  {
    path: '/tab/:id',
    component: () => import('layouts/DefaultLayout.vue'),
    children: [{ path: '', component: () => import('pages/TabPage.vue') }],
  },
  {
    path: '/bookmarks/:id',
    component: () => import('layouts/DefaultLayout.vue'),
    children: [{ path: '', component: () => import('pages/BookmarksPage.vue') }],
  },
  {
    path: '/spaces',
    component: () => import('layouts/DefaultLayout.vue'),
    children: [{ path: '', component: () => import('pages/Spaces.vue') }],
  },
  {
    path: '/mhtml/:encodedUrl',
    component: () => import('layouts/DefaultLayout.vue'),
    children: [{ path: '', component: () => import('pages/MHtmlPage.vue') }],
  },
  {
    path: '/rss/:encodedUrl',
    component: () => import('layouts/DefaultLayout.vue'),
    children: [{ path: '', component: () => import('pages/RssPage.vue') }],
  },
  {
    path: '/bydomain/:encodedUrl',
    component: () => import('layouts/DefaultLayout.vue'),
    children: [{ path: '', component: () => import('pages/ByDomainPage.vue') }],
  },
  {
    path: '/historyByAge/:encodedAge',
    component: () => import('layouts/DefaultLayout.vue'),
    children: [{ path: '', component: () => import('pages/ByAgePage.vue') }],
  },
  {
    path: '/features/:feature',
    component: () => import('layouts/DefaultLayout.vue'),
    children: [{ path: '', component: () => import('pages/FeaturesPage.vue') }],
  },
  {
    path: '/search',
    component: () => import('layouts/DefaultLayout.vue'),
    children: [{ path: '', component: () => import('pages/SearchPage.vue') }],
  },
  {
    path: '/iframe/:tabId',
    component: () => import('layouts/DefaultLayout.vue'),
    children: [{ path: '', component: () => import('pages/IFramePage.vue') }],
  },
  {
    path: '/help/:ident',
    component: () => import('layouts/DefaultLayout.vue'),
    children: [{ path: '', component: () => import('pages/HelpPage.vue') }],
  },
  {
    path: '/newtab',
    component: () => import('layouts/NewTabLayout.vue'),
    children: [{ path: '', component: () => import('pages/NewTabPage.vue') }],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
