import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'Home', component: () => import('@/views/Home.vue') },
  { path: '/resources', name: 'ResourceList', component: () => import('@/views/ResourceList.vue') },
  { path: '/resource/:id', name: 'ResourceDetail', component: () => import('@/views/ResourceDetail.vue') },
  { path: '/category/:id', name: 'Category', component: () => import('@/views/ResourceList.vue'), props: true },
  { path: '/tag/:id', name: 'Tag', component: () => import('@/views/ResourceList.vue'), props: true },
  { path: '/search', name: 'Search', component: () => import('@/views/Search.vue') },
  { path: '/page/:slug', name: 'Page', component: () => import('@/views/SinglePage.vue') },
  
  { path: '/admin/login', name: 'AdminLogin', component: () => import('@/views/admin/Login.vue') },
  {
    path: '/admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', name: 'AdminDashboard', component: () => import('@/views/admin/Dashboard.vue') },
      { path: 'resources', name: 'AdminResources', component: () => import('@/views/admin/Resources.vue') },
      { path: 'resource/create', name: 'AdminResourceCreate', component: () => import('@/views/admin/ResourceEdit.vue') },
      { path: 'resource/:id/edit', name: 'AdminResourceEdit', component: () => import('@/views/admin/ResourceEdit.vue'), props: true },
      { path: 'categories', name: 'AdminCategories', component: () => import('@/views/admin/Categories.vue') },
      { path: 'tags', name: 'AdminTags', component: () => import('@/views/admin/Tags.vue') },
      { path: 'comments', name: 'AdminComments', component: () => import('@/views/admin/Comments.vue') },
      { path: 'pages', name: 'AdminPages', component: () => import('@/views/admin/Pages.vue') },
      { path: 'nav', name: 'AdminNav', component: () => import('@/views/admin/Nav.vue') },
      { path: 'ad-cards', name: 'AdminAdCards', component: () => import('@/views/admin/AdCards.vue') },
      { path: 'links', name: 'AdminLinks', component: () => import('@/views/admin/Links.vue') },
      { path: 'settings', name: 'AdminSettings', component: () => import('@/views/admin/Settings.vue') },
      { path: 'admins', name: 'AdminAdmins', component: () => import('@/views/admin/Admins.vue') }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0 } }
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !localStorage.getItem('admin_token')) {
    next('/admin/login')
  } else {
    next()
  }
})

export default router
