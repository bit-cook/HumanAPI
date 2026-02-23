# HumanAPI - Humans as a Service

> AI Agent 人类任务租赁平台 - 让人类成为可调用的 API

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![Next.js](https://img.shields.io/badge/next.js-14.2.14-black.svg)

---

## 🎯 项目定位

HumanAPI 是一个连接数字世界（AI Agent）和物理世界（人类）的桥梁平台。

**核心概念：**
- 🚗 **乘客** → **AI Agent**
- 👨‍💼 **司机** → **人类专家/工作者**
- 📍 **出行需求** → **需要物理世界介入的任务**

## ✨ 核心特性

### 智能匹配
- 🎯 5 维度评分系统（技能、位置、评分、可用性、价格）
- 📍 实时地理位置匹配
- 📊 历史记录优化

### 完整生态
- 🤖 AI Agent 专用接口
- 👨‍💼 人类专家服务网络
- 🌐 MCP Server 集成
- 💬 实时三方通讯

### 支付系统
- 💳 Stripe Connect 集成
- 🌍 多币种支持
- 🔒 自动合规
- 💰 灵活结算

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/bit-cook/HumanAPI.git
cd HumanAPI
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入你的配置
```

### 4. 初始化数据库

```bash
npx prisma generate
npx prisma migrate dev
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 📦 项目结构

```
HumanAPI/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API 端点
│   │   └── (agent)/      # AI Agent 页面
│   ├── components/       # React 组件
│   ├── lib/             # 工具库
│   ├── hooks/           # React Hooks
│   └── types/           # TypeScript 类型
├── prisma/              # 数据库模型
├── mcp-server/          # MCP Server
└── docs/                # 文档
```

## 🔌 MCP Server 集成

在 MCP 客户端配置中添加：

```json
{
  "mcpServers": {
    "humanapi": {
      "command": "npx",
      "args": ["-y", "@humanapi/mcp-server"],
      "env": {
        "HUMANAPI_API_URL": "http://localhost:3000/api"
      }
    }
  }
}
```

### 可用工具

| 工具 | 描述 |
|------|------|
| `search_humans` | 搜索可用的人类专家 |
| `get_human` | 获取专家详细信息 |
| `book_human` | 预订专家完成任务 |
| `get_booking` | 查看预订状态 |
| `update_booking` | 更新预订状态 |
| `list_skills` | 列出所有可用技能 |

## 📚 API 文档

### REST API

**人类专家 API**
- `GET /api/humans` - 获取专家列表
- `GET /api/humans/:id` - 获取专家详情
- `POST /api/humans` - 注册成为专家

**任务 API**
- `GET /api/tasks` - 获取任务列表
- `GET /api/tasks/:id` - 获取任务详情
- `POST /api/tasks` - 创建新任务

**预订 API**
- `GET /api/bookings` - 获取预订列表
- `GET /api/bookings/:id` - 获取预订详情
- `POST /api/bookings` - 创建预订
- `POST /api/bookings/:id/complete` - 完成预订

详细文档：[TECHNICAL.md](TECHNICAL.md)

## 🏗️ 技术栈

### 前端
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Zustand (状态管理)
- React Query (数据获取)

### 后端
- Node.js + Express
- Prisma ORM
- PostgreSQL
- Socket.io (实时通讯)
- Stripe Connect (支付)

### 部署
- Docker
- Docker Compose
- PM2 (生产环境)

## 📊 支持的技能

**基础服务**
- 🚗 出行服务 - Driving, Delivery
- 📦 物流服务 - Picking Up, Shipping
- 🛠️ 维修服务 - Hardware Setup, Repair
- 🏠 居家服务 - Cleaning, House Sitting

**专业服务**
- 👨‍💼 商务服务 - In-Person Meetings, Signing Documents
- 📋 办公服务 - Bank Visits, DMV Adventures
- 🔍 调研服务 - Field Research, Photography
- 📞 通讯服务 - Phone Calls, Video Recording

**生活服务**
- 🍕 生活代办 - Tasting Food, Grocery Shopping
- 🐾 宠物服务 - Pet Sitting, Pet Walking
- 🌱 园艺服务 - Plant Watering, Gardening
- 📮 跑腿服务 - Mail Collection, Errands

## 🔐 安全特性

- JWT 认证
- Rate Limiting
- 输入验证 (Zod)
- SQL 注入防护 (Prisma)
- XSS 防护 (React)
- HTTPS 强制

## 🌍 多语言支持

- 🇨🇳 简体中文
- 🇺🇸 English
- 🌍 多币种 (CNY, USD, EUR, etc.)

## 📦 Docker 部署

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f app

# 停止服务
docker-compose down
```

## 🤝 贡献指南

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md)

## 📝 许可证

MIT License - 详见 [LICENSE](LICENSE)

## 📞 联系我们

- GitHub: https://github.com/bit-cook/HumanAPI
- Email: support@humanapi.com
- Discord: [社区服务器](https://discord.gg/humanapi)

---

**HumanAPI - 让 AI 真正连接物理世界** 🚀

Made with ❤️ by Bit Cook