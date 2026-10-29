# HumanAPI - Humans as a Service

> AI Agent 人类任务租赁平台 - 让人类成为可调用的 API

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)
![Next.js](https://img.shields.io/badge/next.js-16.3.3-black.svg)
![CI](https://github.com/bit-cook/HumanAPI/actions/workflows/ci.yml/badge.svg)
![Docs](https://img.shields.io/badge/docs-GitHub%20Pages-blue)

> 📖 在线文档：https://bit-cook.github.io/HumanAPI/

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
- 📍 实时地理位置匹配（Haversine 距离 + locationMatch 打分）
- 📊 同分就近排序，结果稳定可预期

### v2.0.0 已实现
- 🤖 REST 路由与 MCP stdio 双入口，**12 个 MCP 工具**
- 🎯 五维专家匹配、地理距离计算、数据库分页
- 📋 任务 / 预约 / 评价 / 消息 / 争议完整生命周期
- ⚙️ 预约状态机单一权威定义，REST 与 MCP 共用（含 dispute / resolve）
- ⭐ 评价提交后同事务重算专家评分与评价数
- 🔐 服务级 API Key（timing-safe 比较）、严格 Zod v4 输入验证、原子状态迁移
- 🚦 每 API Key 固定窗口限流（默认 120 次/60s，429 + Retry-After）
- 🛡️ 统一安全响应头（HSTS、X-Frame-Options、nosniff 等）
- 🧪 55 个单元测试 + 21 个真实 PostgreSQL 集成测试
- 🐳 PostgreSQL 迁移、Docker Compose 启动链、health/ready 探针

> [!IMPORTANT]
> v2.0.0 是开源参考实现，不是多租户托管服务。Stripe 支付、实时通讯、文件上传、最终用户登录/资源级授权与合规认证尚未实现；相关字段和设计文档属于扩展点。

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/bit-cook/HumanAPI.git
cd HumanAPI
```

### 2. 安装依赖

```bash
npm ci
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

### 测试

```bash
npm test                 # 单元测试（55 个）
npm run test:integration # 集成测试（21 个，需要 DATABASE_URL 指向可用 PostgreSQL）
npm run check            # typecheck + lint + test + build + mcp:build + npm audit
```

## 📦 项目结构

```
HumanAPI/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # REST 路由与 MCP HTTP 桥
│   │   └── page.tsx      # 静态首页
│   ├── lib/              # 状态机、匹配、限流、校验、错误映射
│   └── types/            # TypeScript 类型
├── src/tests/integration # 真实数据库集成测试
├── prisma/               # 数据模型与迁移
├── mcp-server/           # MCP stdio Server（12 工具）
├── docs/                 # GitHub Pages 文档站点
└── .github/workflows/    # CI + Pages 部署
```

## 🔌 MCP Server 集成

在 MCP 客户端配置中添加：

```json
{
  "mcpServers": {
    "humanapi": {
      "command": "node",
      "args": ["/absolute/path/to/HumanAPI/mcp-server/dist/index.js"],
      "env": {
        "HUMANAPI_API_URL": "http://localhost:3000/api/mcp",
        "HUMANAPI_API_KEY": "与 API_KEY 相同的值"
      }
    }
  }
}
```

### 可用工具（12 个）

| 工具 | 描述 |
|------|------|
| `search_humans` | 按技能、位置、费率、评分搜索专家 |
| `get_human` | 读取单个专家档案 |
| `book_human` | 创建任务记录与待处理预约 |
| `get_booking` | 读取预约、支付字段与执行时间 |
| `update_booking` | 按合法状态迁移更新预约 |
| `list_skills` | 列出技能分类与技能条目 |
| `create_review` | 对已完成预约提交评价（自动重算评分） |
| `send_message` | 在预约上下文中发送消息 |
| `create_dispute` | 发起争议并将预约置为 DISPUTED |
| `get_dispute` | 读取争议详情 |
| `list_disputes` | 按状态/预约过滤争议 |
| `resolve_dispute` | 以 RESOLVED / REJECTED 关闭争议 |

## 📚 API 文档

### REST API

**人类专家**
- `GET /api/humans` - 专家列表（skills/lat/lon/maxDistance/rateMin/rateMax/ratingMin/availableNow/page/limit）
- `POST /api/humans` - 注册成为专家
- `GET /api/humans/:id` - 专家详情
- `PUT /api/humans/:id` - 更新档案
- `GET /api/humans/:id/reviews` - 分页读取评价

**任务**
- `GET /api/tasks` / `POST /api/tasks`
- `GET /api/tasks/:id` / `PUT /api/tasks/:id` / `DELETE /api/tasks/:id`

**预约**
- `GET /api/bookings` / `POST /api/bookings`（humanId 为 HumanProfile.id）
- `GET /api/bookings/:id` / `PUT /api/bookings/:id`
- `POST /api/bookings/:id/:action` - confirm / start / complete / cancel / **dispute** / **resolve**
- `POST /api/bookings/:id/reviews`
- `GET/POST /api/bookings/:id/messages`
- `POST /api/bookings/:id/disputes`

**争议**
- `GET /api/disputes` / `GET /api/disputes/:id` / `PUT /api/disputes/:id`

除 `/api`、`/api/health`、`/api/ready` 外，所有请求都必须携带 `Authorization: Bearer <API_KEY>` 或 `x-api-key: <API_KEY>`。

`GET /api/health` 是进程存活检查；`GET /api/ready` 会验证数据库连接，适合作为容器 readiness probe。

详细文档：[在线文档](https://bit-cook.github.io/HumanAPI/) · [TECHNICAL.md](TECHNICAL.md)

## 🏗️ 技术栈

### 前端
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS

### 后端
- Next.js Route Handlers
- Prisma ORM 6
- PostgreSQL 16+
- Zod v4

### 质量与部署
- Vitest（单元 + 真实数据库集成测试）
- ESLint 9 / TypeScript 严格模式
- GitHub Actions CI（ubuntu-latest + PostgreSQL 服务容器）
- GitHub Pages 文档站点
- Docker / Docker Compose

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

- API Key 认证（timing-safe 比较，fail-closed）
- 输入验证（Zod v4，所有 JSON 字段运行期校验）
- SQL 注入防护（Prisma 参数化）
- 每 Key 限流（429 + Retry-After）
- 安全响应头（HSTS / X-Frame-Options / nosniff / Referrer-Policy / Permissions-Policy）
- Prisma 已知错误码 → 语义化 HTTP 状态映射

资源级授权、HTTPS 终止和审计日志需要由部署方补齐。

## 🌍 多语言支持

- 🇨🇳 简体中文
- 🇺🇸 English
- 🌍 多币种 (CNY, USD, EUR, etc.)

## 📦 Docker 部署

```bash
# 构建并启动所有服务（含 migrate 任务）
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
- 文档: https://bit-cook.github.io/HumanAPI/

---

**HumanAPI - 让 AI 真正连接物理世界** 🚀

Made with ❤️ by Bit Cook
