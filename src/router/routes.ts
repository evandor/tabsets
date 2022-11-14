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
    path: '/about',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/About.vue') }],
  },
  {
    path: '/trypro',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/TryPro.vue') }],
  },
  {
    path: '/settings',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Settings.vue') }],
  },
  {
    path: '/tabset',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/CurrentTabs.vue') }],
  },
  {
    path: '/tab/:id',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/TabPage.vue') }],
  },
  {
    path: '/bookmarks/:id',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Bookmarks.vue') }],
  },
  {
    path: '/spaces',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Spaces.vue') }],
  },
  {
    path: '/mhtml/:encodedUrl',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/MHtmlPage.vue') }],
  },
  // {
  //   path: '/browser',
  //   component: () => import('layouts/MainLayout.vue'),
  //   children: [{ path: '', component: () => import('pages/ChromeTabset.vue') }],
  // },
  {
    path: '/search/:term',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/SearchPage.vue') }],
  },
  {
    path: '/debug',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/DebugPage.vue') }],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
