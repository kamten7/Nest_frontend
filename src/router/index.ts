import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/landlord/map',
    },
    {
      path: '/landlord/login',
      name: 'LandlordLogin',
      component: () => import('@/views/landlord/LandlordLoginPage.vue'),
      meta: { title: '房东登录' },
    },
    {
      // 房东管理端统一布局：导航栏 + 子页面
      path: '/landlord',
      component: () => import('@/layouts/LandlordLayout.vue'),
      children: [
        {
          path: 'map',
          name: 'LandlordMap',
          component: () => import('@/views/landlord/LandlordMapPage.vue'),
          meta: { title: '房源地图' },
        },
        {
          path: 'house/list',
          name: 'HouseList',
          component: () => import('@/views/landlord/HouseListPage.vue'),
          meta: { title: '我的房源' },
        },
        {
          path: 'house/create',
          name: 'HouseCreate',
          component: () => import('@/views/landlord/HouseCreatePage.vue'),
          meta: { title: '添加房源' },
        },
        {
          path: 'house/edit/:id',
          name: 'HouseEdit',
          component: () => import('@/views/landlord/HouseCreatePage.vue'),
          meta: { title: '编辑房源' },
        },
        {
          path: 'house/detail/:id',
          name: 'HouseDetail',
          component: () => import('@/views/house/HouseDetailPage.vue'),
          meta: { title: '房源详情' },
        },
        {
          path: 'appointment',
          name: 'Appointment',
          component: () => import('@/views/landlord/AppointmentPage.vue'),
          meta: { title: '预约管理' },
        },
        {
          path: 'profile',
          name: 'Profile',
          component: () => import('@/views/landlord/LandlordProfilePage.vue'),
          meta: { title: '个人中心' },
        },
        {
          path: 'chat',
          name: 'ChatPage',
          component: () => import('@/views/landlord/ChatPage.vue'),
          meta: { title: '消息' },
        },
        {
          path: 'wallet',
          name: 'Wallet',
          component: () => import('@/views/landlord/WalletPage.vue'),
          meta: { title: '钱包' },
        },
        {
          path: 'rent',
          name: 'Rent',
          component: () => import('@/views/landlord/RentPage.vue'),
          meta: { title: '租房订单' },
        },
        {
          path: 'rent/detail/:id',
          name: 'RentDetail',
          component: () => import('@/views/landlord/RentDetailPage.vue'),
          meta: { title: '订单详情' },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/landlord/map',
    },
  ],
})

// 路由守卫 —— 未登录跳转登录页
router.beforeEach((to, _from, next) => {
  document.title = (to.meta.title as string) || 'Nest 安居'
  if (to.path === '/landlord/login') {
    next()
    return
  }
  const token = localStorage.getItem('adminToken')
  if (!token) {
    next('/landlord/login')
  } else {
    next()
  }
})

export default router
