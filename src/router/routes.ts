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
    path: '/register',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Register.vue') }],
  },
  {
    path: '/login',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Login.vue') }],
  },
  {
    path: '/subscription',
    component: () => import('layouts/SimpleLayout.vue'),
    children: [{ path: '', component: () => import('pages/Subscription.vue') }],
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
  // {
  //   path: '/browser',
  //   component: () => import('layouts/MainLayout.vue'),
  //   children: [{ path: '', component: () => import('pages/ChromeTabset.vue') }],
  // },
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
