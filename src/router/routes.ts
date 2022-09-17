import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/tabset'
  },
  /*{
    path: '/login',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Login.vue') }],
    //children: [{ path: '', component: () => import('pages/Login.vue') }],
  },
  {
    path: '/tabsets/:tabsetId',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/TabsetPage.vue') }],
    //children: [{ path: '', component: () => import('pages/Login.vue') }],
  },*/
  {
    path: '/about',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/About.vue') }],
  },
  {
    path: '/tabset',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/CurrentTabs.vue') }],
  },
  {
    path: '/browser',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/ChromeTabset.vue') }],
  },
  {
    path: '/search/:term',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/SearchPage.vue') }],
    //children: [{ path: '', component: () => import('pages/Login.vue') }],
  },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
