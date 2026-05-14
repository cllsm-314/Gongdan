# 门店运营工单系统

为德胧集团搭建的门店运营需求工单系统，支持47家门店向管理员提交工单，实现双向实时通信。

## 功能特性

- 🔐 **飞书OAuth登录** - 安全便捷的企业账号登录
- 📝 **4种工单类型**
  - 开关房申请
  - 调价申请
  - 企业卡创建
  - 企业白名单录入
- 💬 **实时消息推送** - 基于Supabase Realtime
- 📎 **附件上传** - 支持图片、PDF、Word、Excel
- 📱 **移动端适配** - 响应式设计

## 技术栈

- **前端框架**: Next.js 14 (App Router)
- **UI框架**: Tailwind CSS + shadcn/ui
- **数据库**: Supabase (PostgreSQL)
- **实时通信**: Supabase Realtime
- **文件存储**: Supabase Storage
- **登录认证**: 飞书 OAuth2
- **部署**: Vercel

## 快速开始

### 环境要求

- Node.js 18+
- npm / yarn / pnpm

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env.local` 并填写配置：

```bash
cp .env.example .env.local
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 项目结构

```
门店工单系统/
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── api/               # API 路由
│   │   ├── admin/             # 管理后台
│   │   ├── login/             # 登录页
│   │   └── ticket/            # 工单相关页面
│   ├── components/            # React 组件
│   │   ├── ui/                # UI 基础组件
│   │   └── ...                # 业务组件
│   ├── lib/                   # 工具库
│   │   ├── supabase.ts        # Supabase 客户端
│   │   ├── feishu.ts         # 飞书 API
│   │   └── auth.ts           # 认证中间件
│   └── types/                  # TypeScript 类型
├── supabase/
│   └── schema.sql             # 数据库初始化
├── public/                    # 静态资源
└── DEPLOY.md                  # 部署说明
```

## 部署

详细部署说明请参考 [DEPLOY.md](./DEPLOY.md)

## 许可证

私有项目 - 德胧集团
