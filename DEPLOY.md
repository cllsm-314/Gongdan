# 门店运营工单系统 - 部署说明

本指南将帮助您完成门店运营工单系统的完整部署。

## 目录

1. [创建 Supabase 项目](#1-创建-supabase-项目)
2. [执行数据库 Schema](#2-执行数据库-schema)
3. [配置 Supabase Storage](#3-配置-supabase-storage)
4. [配置飞书应用](#4-配置飞书应用)
5. [部署到 Vercel](#5-部署到-vercel)
6. [配置环境变量](#6-配置环境变量)
7. [添加管理员账号](#7-添加管理员账号)
8. [验证部署](#8-验证部署)

---

## 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com) 并登录您的账号
2. 点击 "New Project" 创建一个新项目
3. 填写项目信息：
   - **Organization**: 选择您的组织
   - **Name**: `store-workorder-system` (或您喜欢的名称)
   - **Database Password**: 设置一个强密码（请妥善保管）
   - **Region**: 选择靠近您的区域（如 `Northeast Asia` for 日本/韩国）
4. 等待项目创建完成（约2分钟）

## 2. 执行数据库 Schema

### 2.1 获取数据库连接信息

1. 在 Supabase 项目面板中，点击左侧菜单 "Settings" > "Database"
2. 找到 "Connection string" 部分
3. 选择 "URI" 标签，复制连接字符串
4. 连接字符串格式：`postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

### 2.2 执行 SQL Schema

1. 在 Supabase 项目面板中，点击左侧菜单 "SQL Editor"
2. 点击 "New query" 创建一个新查询
3. 打开 `supabase/schema.sql` 文件，复制全部内容
4. 粘贴到 SQL Editor 中
5. 点击 "Run" 执行 SQL

### 2.3 验证建表成功

执行以下查询验证表已创建：

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

应该看到以下表：
- `stores`
- `users`
- `tickets`
- `ticket_messages`
- `admin_users`

---

## 3. 配置 Supabase Storage

### 3.1 创建 Storage Bucket

1. 在 Supabase 项目面板中，点击左侧菜单 "Storage"
2. 点击 "New bucket" 创建新存储桶
3. 配置存储桶：
   - **Name**: `ticket-attachments`
   - **Public**: ✅ 勾选 "Public bucket"
4. 点击 "Create bucket"

### 3.2 配置 Storage 策略

在 SQL Editor 中执行以下 SQL：

```sql
-- 允许任何人上传附件
CREATE POLICY "Anyone can upload attachments" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'ticket-attachments');

-- 允许任何人查看附件
CREATE POLICY "Anyone can view attachments" ON storage.objects
    FOR SELECT USING (bucket_id = 'ticket-attachments');

-- 允许已认证用户删除自己的附件
CREATE POLICY "Users can delete own attachments" ON storage.objects
    FOR DELETE USING (bucket_id = 'ticket-attachments');
```

---

## 4. 配置飞书应用

### 4.1 创建飞书应用（如果还没有）

1. 访问 [飞书开放平台](https://open.feishu.cn/app)
2. 点击 "创建企业自建应用"
3. 填写应用信息：
   - **应用名称**: 门店工单系统
   - **应用描述**: 门店运营工单系统
4. 点击创建

### 4.2 获取应用凭证

1. 在应用详情页，点击 "凭证与基础信息"
2. 保存 **App ID** 和 **App Secret**：
   - App ID: `cli_xxxxxxxxxxxxxxxxxx`
   - App Secret: `xxxxxxxxxxxxxxxxxxxxxxxxxx`

### 4.3 配置权限

1. 在左侧菜单点击 "权限管理"
2. 搜索并添加以下权限：
   - `contact:user.employee_id:readonly` - 获取用户员工ID
   - `user.id:readonly` - 获取用户 ID
   - `user.name:readonly` - 获取用户姓名
   - `user.avatar:readonly` - 获取用户头像

### 4.4 配置重定向地址

1. 在左侧菜单点击 "安全设置"
2. 找到 "重定向 URL" 配置
3. 添加以下地址：
   ```
   https://your-domain.vercel.app/api/auth/callback
   ```
   （将 `your-domain.vercel.app` 替换为您的实际域名）

### 4.5 发布应用

1. 在左侧菜单点击 "版本管理与发布"
2. 点击 "创建版本"
3. 填写版本信息并提交审核
4. 发布应用

---

## 5. 部署到 Vercel

### 5.1 准备代码

1. 确保代码已推送到 GitHub 仓库
2. 访问 [Vercel](https://vercel.com) 并登录

### 5.2 创建项目

1. 点击 "Add New..." > "Project"
2. 选择您的 GitHub 仓库
3. Vercel 会自动检测 Next.js 项目

### 5.3 配置环境变量

在 Vercel 项目设置中，添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJxxx...` | Supabase 匿名密钥 |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJxxx...` | Supabase 服务角色密钥 |
| `FEISHU_APP_ID` | `cli_xxx` | 飞书应用 App ID |
| `FEISHU_APP_SECRET` | `xxx` | 飞书应用 App Secret |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.vercel.app` | 您的 Vercel 域名 |
| `SESSION_SECRET` | `至少32个字符的随机字符串` | Session 加密密钥 |

### 5.4 部署

1. 点击 "Deploy"
2. 等待构建和部署完成（约2-3分钟）

### 5.5 更新飞书重定向地址

部署成功后，将 Vercel 分配的域名更新到飞书应用的重定向地址中。

---

## 6. 配置环境变量

如果需要在本地开发，创建一个 `.env.local` 文件：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# 飞书
FEISHU_APP_ID=cli_xxx
FEISHU_APP_SECRET=xxx

# 应用
NEXT_PUBLIC_APP_URL=http://localhost:3000
SESSION_SECRET=your-secret-key-at-least-32-characters
```

---

## 7. 添加管理员账号

### 7.1 通过数据库添加

在 Supabase SQL Editor 中执行：

```sql
-- 添加管理员
INSERT INTO admin_users (feishu_user_id, name) 
VALUES ('your_feishu_user_id', '管理员姓名');

-- 查看所有管理员
SELECT * FROM admin_users;
```

### 7.2 自动识别管理员

首次通过飞书登录的用户：
- 如果在 `admin_users` 表中存在对应的 `feishu_user_id`，自动获得管理员权限
- 其他用户默认为门店人员角色

---

## 8. 验证部署

### 8.1 检查应用访问

1. 访问 `https://your-domain.vercel.app`
2. 应该看到登录页面

### 8.2 测试登录流程

1. 点击 "使用飞书登录"
2. 使用飞书扫码授权
3. 应该能够成功登录并看到首页

### 8.3 测试工单提交流程

1. 登录后选择门店（如果需要绑定）
2. 点击 "开关房申请" 或其他工单类型
3. 填写表单并提交
4. 验证工单是否成功创建

### 8.4 测试管理功能

1. 使用管理员账号登录
2. 访问 `/admin` 后台
3. 验证能够看到所有工单
4. 测试回复工单功能

### 8.5 测试实时通知

1. 门店提交新工单
2. 验证管理员端是否收到浏览器通知
3. 验证页面内通知弹窗

---

## 故障排除

### 常见问题

1. **登录失败**
   - 检查飞书应用的权限配置
   - 检查重定向地址是否正确
   - 检查环境变量是否正确设置

2. **无法上传附件**
   - 检查 Storage bucket 是否创建
   - 检查 Storage 策略是否配置
   - 检查文件大小是否超过限制（10MB）

3. **实时消息不工作**
   - 检查 Supabase Realtime 是否启用
   - 检查 RLS 策略是否正确配置

4. **样式异常**
   - 确保执行了 `npm install`
   - 检查 Tailwind CSS 配置

### 获取帮助

如遇到问题，请检查：
1. Vercel 部署日志
2. 浏览器控制台错误
3. Supabase 数据库日志

---

## 技术支持

如需技术支持，请联系：
- 项目负责人：张春雷
- 门店总经理

---

## 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 支持4种工单类型
- 支持飞书OAuth登录
- 支持实时消息推送
