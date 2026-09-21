<h1 align="center">🏠 Nest 安居 · 房东管理端</h1>

<p align="center">
  <strong>多房东 AI 租房平台 · 房东 Web 管理端 · 房源管理 + 地图选点 + 预约处理 + 钱包结算 + 实时聊天</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vuedotjs&logoColor=white" alt="Vue 3">
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Element_Plus-2.14-409EFF?logo=element&logoColor=white" alt="Element Plus">
  <img src="https://img.shields.io/badge/Pinia-4-FFD859?logo=pinia&logoColor=black" alt="Pinia">
  <img src="https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet&logoColor=white" alt="Leaflet">
  <img src="https://img.shields.io/badge/Axios-1.19-5A29E4?logo=axios&logoColor=white" alt="Axios">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
</p>

<p align="center">
  <a href="#-项目介绍">项目介绍</a> ·
  <a href="#-技术栈">技术栈</a> ·
  <a href="#-页面与路由">页面与路由</a> ·
  <a href="#-快速开始">快速开始</a> ·
  <a href="#-与后端的对接约定">后端对接</a> ·
  <a href="#-常见问题">常见问题</a>
</p>


---


## 📖 项目介绍

**Nest（安居）** 是一套**多房东 AI 租房平台**，覆盖**租客微信小程序**与**房东 Web 管理端**双端。本仓库是其中的**房东管理端**：房东在这里发布与管理房源、处理租客的看房预约、跟进租房订单、审批退租结算、查看钱包流水，并通过 WebSocket 长连接与租客实时沟通。

> 后端具备两个技术亮点，本端均已完成对接：**LangChain4j 真实 Agent 找房**（租客侧能力，服务端实现）与 **Netty 长连接实时聊天**（本端通过 `ws://` 接入）。

项目由三个**相互独立的 Git 仓库**组成，各自独立开发、独立提交：

| 端 | 仓库 | 技术栈 |
|----|------|--------|
| 服务端 | [Nest_Backend](https://github.com/kamten7/Nest_Backend) | Spring Boot 3 多模块 · MyBatis · MySQL · Redis · Netty |
| 房东管理端 | [**Nest_frontend**](https://github.com/kamten7/Nest_frontend)（本仓库） | Vue 3 + TypeScript + Element Plus |
| 租客端 | [Nest_uniapp](https://github.com/kamten7/Nest_uniapp) | uni-app + Vue 3 + Pinia（微信小程序） |

三端共用同一套后端 API，采用 **JWT 双通道认证**：本端请求携带 `token` 头（租客端携带 `authentication` 头），服务端用两把独立密钥分别签发与校验，互不通用。


---


## 🛠 技术栈

| 类别 | 选型 | 说明 |
|------|------|------|
| 核心框架 | Vue 3.5（`<script setup>` 组合式 API） | 响应式视图层 |
| 语言 | TypeScript 6.0 | 全量类型标注，构建时 `vue-tsc` 类型检查 |
| 构建工具 | Vite 8 | 秒级冷启动 + HMR |
| UI 组件库 | Element Plus 2.14 + `@element-plus/icons-vue` | 表格 / 表单 / 弹窗 / 消息提示 |
| 状态管理 | Pinia 4 | 登录态与全局通知 |
| 路由 | Vue Router 4 | 布局嵌套 + 登录守卫 |
| HTTP | Axios 1.19 | 请求 / 响应拦截器统一处理 |
| 地图 | Leaflet 1.9 | 房源地图选点与标记点展示 |
| 实时通信 | 原生 `WebSocket` | 接入后端 Netty 长连接，接收消息 / 预约推送 |


---


## 💡 功能模块

| 模块 | 页面（`src/views/landlord/`） | 能力说明 |
|------|------------------------------|----------|
| 登录 | `LandlordLoginPage.vue` | 手机号 + 密码登录，签发房东端 JWT 并持久化 |
| 房源地图 | `LandlordMapPage.vue` | Leaflet 地图展示名下房源标记点，点击进入详情 |
| 我的房源 | `HouseListPage.vue` | 房源列表、状态切换（上架 / 下架）、删除房源 |
| 添加 / 编辑房源 | `HouseCreatePage.vue` | 房源信息表单 + **地图拖拽选点** + 地址经纬度互转 + **多图上传**（同一组件复用为编辑页） |
| 房源详情 | `views/house/HouseDetailPage.vue` | 房源完整信息与图片轮播 |
| 预约管理 | `AppointmentPage.vue` | 查看租客看房预约，确认 / 完成 / 取消 |
| 租房订单 | `RentPage.vue` | 在租订单列表与状态筛选 |
| 订单详情 | `RentDetailPage.vue` | 缴费记录、缴租进度、**退租结算**（可扣款后退回押金） |
| 我的钱包 | `WalletPage.vue` | 可提现余额 / 在租锁定押金 / 收支流水 / 提现 |
| 消息 | `ChatPage.vue` | 与租客一对一会话，长连接实时收发 |
| 个人中心 | `LandlordProfilePage.vue` | 房东资料与账号信息 |

**公共能力**：`LandlordLayout.vue` 提供统一导航布局，并在挂载后建立 Netty WebSocket 连接，接收租客的消息与新预约推送；`NotificationHost.vue` 配合 `stores/notification.ts` 做全局通知弹窗。


---


## 🧭 页面与路由

路由定义集中在 `src/router/index.ts`，采用「登录页 + 布局嵌套」两级结构：

```
/                              → 重定向到 /landlord/map
/landlord/login                房东登录（无需鉴权）

/landlord                      LandlordLayout（统一布局）
├── map                        房源地图
├── house/list                 我的房源
├── house/create               添加房源
├── house/edit/:id             编辑房源（复用 HouseCreatePage）
├── house/detail/:id           房源详情
├── appointment                预约管理
├── rent                       租房订单
├── rent/detail/:id            订单详情
├── wallet                     我的钱包
├── chat                       消息
└── profile                    个人中心

/:pathMatch(.*)*               → 兜底重定向到 /landlord/map
```

**路由守卫**：除 `/landlord/login` 外，所有路由都会检查 `localStorage.adminToken`；缺失则重定向到登录页。同时根据 `meta.title` 动态设置浏览器标题。


---


## 📁 目录结构

```
.
├── public/
│   └── leaflet/                 # Leaflet 地图标记图标（marker / layers）
├── src/
│   ├── api/                     # 接口层（按业务域拆分，统一走 request.ts）
│   │   ├── request.ts           #   Axios 实例 + 请求/响应拦截器 + 后端地址派生
│   │   ├── house.ts             #   登录 / 房源 CRUD / 地图标记 / 地理编码 / 图片上传
│   │   ├── appointment.ts       #   预约的查询 / 确认 / 完成 / 取消
│   │   ├── rent.ts              #   租房订单列表 / 详情 / 退租结算
│   │   ├── wallet.ts            #   钱包余额 / 流水 / 提现 / 幂等键
│   │   └── chat.ts              #   会话 / 历史消息 / 未读数
│   ├── assets/                  # 静态资源
│   ├── components/
│   │   └── NotificationHost.vue #   全局通知弹窗宿主
│   ├── layouts/
│   │   └── LandlordLayout.vue   #   统一布局 + WebSocket 连接入口
│   ├── router/index.ts          #   路由表 + 登录守卫
│   ├── stores/
│   │   ├── auth.ts              #   登录态
│   │   └── notification.ts      #   全局通知队列
│   ├── utils/
│   │   └── jwt.ts               #   JWT 解析（取 landlordId 等）
│   ├── views/
│   │   ├── landlord/            #   房东端页面
│   │   └── house/               #   房源详情页（两端复用）
│   ├── App.vue                  #   根组件
│   └── main.ts                  #   入口：挂载 Element Plus 与图标
├── index.html
├── vite.config.ts               # 别名 @ → src；dev server 监听 0.0.0.0:5173
└── package.json
```


---


## 🚀 快速开始

### 环境要求

| 依赖 | 版本要求 |
|------|----------|
| Node.js | >= 18 |
| npm | >= 9 |
| 后端服务 | 需同时启动 HTTP 接口服务与 Netty 长连接服务（见下） |

### 第 1 步：启动后端

本端所有数据都来自后端，**必须先跑起后端**。具体步骤见 [Nest_Backend](https://github.com/kamten7/Nest_Backend) 的 README。

后端会提供两个**不同端口**的服务：

| 服务 | 默认地址 | 用途 |
|------|----------|------|
| HTTP 接口 | `http://localhost:8080` | REST 接口、登录 |
| WebSocket 长连接 | `ws://localhost:8081` | 聊天消息与预约实时推送（由 Netty 提供） |

### 第 2 步：安装依赖并启动

```bash
npm install
npm run dev
```

启动后访问 `http://localhost:5173`（`vite.config.ts` 监听 `0.0.0.0:5173`，同局域网设备也可访问）。

> 首次进入会自动跳转 `/landlord/login`，用后端种子数据里的房东账号登录即可。

### 第 3 步：构建

```bash
npm run build      # 先跑 vue-tsc 类型检查，再执行 vite build，产物在 dist/
npm run preview    # 本地预览构建产物
```

### npm 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（HMR） |
| `npm run build` | `vue-tsc -b` 类型检查 + 生产构建 |
| `npm run preview` | 预览 `dist/` 构建产物 |


---


## 🔌 与后端的对接约定

### 后端地址的派生规则（重要）

`src/api/request.ts` **不写死后端地址**，而是按「当前打开页面的主机名」派生：

```ts
const backendHost = env.VITE_BACKEND_HOST || window.location.hostname || 'localhost'
export const apiBaseUrl = `http://${backendHost}:${env.VITE_HTTP_PORT || '8080'}`
export const wsBaseUrl  = `ws://${backendHost}:${env.VITE_WS_PORT   || '8081'}`
```

之所以不写死 `localhost`：`vite.config.ts` 把 dev server 绑到 `0.0.0.0`，终端会打印多个 Network 地址（LAN / VMware / WSL vEthernet…）。用哪个地址打开页面，页面里的 `localhost` 就指向哪个环境 —— 写死会出现「只有从 localhost 打开时 WebSocket 才连得上，换其它入口地址就发不出消息」。

可选覆盖：在项目根的 `.env` 中设置 `VITE_BACKEND_HOST` / `VITE_HTTP_PORT` / `VITE_WS_PORT`。

> ⚠️ **WebSocket 端口不能由 HTTP 端口派生**——聊天长连接由后端的 Netty 独立提供，端口与 HTTP 不同。

### 接口约定

| 约定项 | 内容 |
|--------|------|
| 认证方式 | 请求头 `token` 携带房东端 JWT，由请求拦截器从 `localStorage.adminToken` 自动注入 |
| 响应结构 | `{ code, msg, data }`，`code === 1` 表示成功，其余由响应拦截器统一弹出 `msg` |
| 分页结构 | 数据位于 `data.records`，总数位于 `data.total` |
| 登录接口 | `POST /admin/landlord/login`，入参 `{ phone, password }` |
| 鉴权失效 | 返回 HTTP 401 时自动清除 `adminToken` 并跳转 `/landlord/login`；403 提示无权限 |
| 长连接 | `${wsBaseUrl}/ws/chat/landlord/{landlordId}?token=xxx`，用于接收租客消息与预约推送 |

接口按角色划分命名空间，本端全部使用 `/admin/**`（租客端使用 `/user/**`），服务端由两个独立拦截器分别守卫。


---


## 📸 实机展示

房东端各页面截图见 **[后端仓库 README](https://github.com/kamten7/Nest_Backend#-实机展示)**（含房源地图、房源管理、添加房源、预约管理、钱包、聊天、个人中心）。


---


## ❓ 常见问题

| 现象 | 排查方向 |
|------|----------|
| 登录成功但接口全部 401 | 检查 `localStorage.adminToken` 是否存在；若刚清过缓存需重新登录 |
| 接口通但收不到聊天 / 预约推送 | WebSocket 端口 `8081` 未启动或写错。确认 `wsBaseUrl` 指向 Netty 服务而非 HTTP 端口 |
| 从局域网 IP 打开时消息发不出去 | 后端地址按页面主机名派生，需确认后端允许跨域；或改用 `.env` 显式指定 `VITE_BACKEND_HOST` |
| 地图不显示标记图标 | `public/leaflet/` 下的 marker 图片缺失，或 Leaflet 的 `iconUrl` 路径被改动 |
| `npm run build` 报类型错误 | 构建会先跑 `vue-tsc`；先修类型错误，或单独执行 `npx vue-tsc -b` 定位 |
| 控制台报 `/favicon.svg` 404 | `index.html` 声明了站点图标，但仓库未附带图标文件。放入自己的 `public/favicon.svg` 即可，或删掉该 `<link>` |
| 刷新子路由 404 | 路由使用 `createWebHistory`，部署时需把服务器配置为回退到 `index.html` |


---


## 📄 License

MIT © [kamten7](https://github.com/kamten7)
