# 门店运营工单系统 - 项目规格书

## 项目概述
为德胧集团搭建门店运营需求工单系统，支持47家门店向2名管理员提交工单，实现双向实时通信。

## 核心需求

### 1. 用户角色
- **门店人员**：47家门店，通过飞书扫码登录，提交工单、接收回复
- **管理员**：张春雷 + 门店总经理，共2人，接收工单、处理并回复

### 2. 4个工单入口
| 入口名称 | 备注说明 | 特殊校验 |
|---------|---------|---------|
| 开关房申请 | 请阐述原因及需求 | 无 |
| 调价申请 | 请阐述原因及需求 | 无 |
| 企业卡创建 | 仅限9和1开头税号之外，需提供企业联系人姓名电话及销售姓名电话 | 税号不能以9或1开头；必填：企业联系人姓名、电话、销售姓名、电话 |
| 企业白名单录入 | 请使用通用模版，告知企业全称 | 必填：企业全称 |

### 3. 提交方式
- 文字、图片、文件（三种方式都支持）

### 4. 实时通信
- 门店提交工单后，管理员后台**即时弹出消息提醒**
- 管理员可以文字或图片回复
- 门店**即时收到回复通知**

### 5. 登录方式
- 飞书扫码登录
- 门店身份通过飞书登录自动关联

## 技术方案

### 技术栈
- **前端框架**：Next.js 14 (App Router)
- **UI**：Tailwind CSS + shadcn/ui
- **数据库**：Supabase (PostgreSQL)
- **实时通信**：Supabase Realtime
- **文件存储**：Supabase Storage
- **登录认证**：飞书 OAuth2 扫码
- **部署**：Vercel

### 飞书应用配置
- **App ID:** cli_aa8e951756badbc2
- **App Secret:** aarzxsK7Vb31le4VMyK1hjMmyIxNqYg4
- **桌面端主页:** https://store-ops.vercel.app (待部署后确认)
- **重定向地址:** https://store-ops.vercel.app/api/auth/callback

### 数据库表设计

#### stores（门店表）
- id: uuid (主键)
- name: text (门店名称)
- feishu_department_id: text (飞书部门ID，可选)
- created_at: timestamptz

#### users（用户表）
- id: uuid (主键)
- feishu_user_id: text (飞书用户ID，唯一)
- name: text (姓名)
- avatar_url: text (头像)
- store_id: uuid (关联门店，门店人员才有)
- role: text ('admin' | 'store')
- created_at: timestamptz

#### tickets（工单表）
- id: uuid (主键)
- type: text ('switch_room' | 'price_adjustment' | 'enterprise_card' | 'whitelist')
- store_id: uuid (提交门店)
- created_by: uuid (提交人)
- title: text (工单标题)
- status: text ('pending' | 'processing' | 'completed' | 'closed')
- form_data: jsonb (表单数据，含各类字段)
- created_at: timestamptz
- updated_at: timestamptz

#### ticket_messages（工单消息表）
- id: uuid (主键)
- ticket_id: uuid (关联工单)
- sender_id: uuid (发送人)
- content: text (文字内容)
- attachment_type: text ('text' | 'image' | 'file', 可选)
- attachment_url: text (附件地址，可选)
- created_at: timestamptz

### 页面结构

#### 门店端
1. `/` - 首页，4个工单入口卡片
2. `/ticket/new?type=xxx` - 提交工单页面
3. `/ticket/[id]` - 工单详情页（含对话）
4. `/my-tickets` - 我的工单列表

#### 管理端
1. `/admin` - 管理后台首页，实时工单列表
2. `/admin/ticket/[id]` - 工单处理页（含对话、回复）

### 实时推送方案
- 使用 Supabase Realtime 的 Postgres Changes 监听 ticket_messages 表的 INSERT 事件
- 管理员端监听新工单和新消息，弹出通知
- 门店端监听管理员回复

### 飞书OAuth流程
1. 前端跳转飞书授权页：`https://open.feishu.cn/open-apis/authen/v1/authorize?app_id=xxx&redirect_uri=xxx&state=xxx`
2. 用户扫码授权后回调到 `/api/auth/callback`
3. 后端用 code 换取 user_access_token
4. 用 token 获取用户信息，查找或创建本地用户
5. 设置 session/cookie，完成登录

### 文件上传方案
- 使用 Supabase Storage 创建 `ticket-attachments` bucket
- 前端直传，后端生成签名URL
- 支持图片、PDF、Word等常见格式

## 环境变量
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
FEISHU_APP_ID=cli_aa8e951756badbc2
FEISHU_APP_SECRET=aarzxsK7Vb31le4VMyK1hjMmyIxNqYg4
NEXT_PUBLIC_APP_URL=https://store-ops.vercel.app
```

## 产出要求
1. 完整的 Next.js 项目代码，放到 `./门店工单系统/` 目录下
2. Supabase 数据库初始化 SQL 文件
3. 部署说明文档 DEPLOY.md
4. 项目可直接 `npm install && npm run dev` 运行
