# Agent Didi - 项目文件结构

```
agent-didi/
├── README.md                           # 项目介绍
├── TECHNICAL.md                       # 技术设计文档
├── package.json                       # 项目依赖
├── tsconfig.json                      # TypeScript 配置
├── next.config.js                     # Next.js 配置
├── tailwind.config.js                 # Tailwind CSS 配置
├── .env.example                       # 环境变量示例
├── .gitignore                         # Git 忽略文件
├── docker-compose.yml                 # Docker 编排
├── Dockerfile                         # Docker 镜像
│
├── prisma/                            # Prisma ORM
│   ├── schema.prisma                  # 数据库模型
│   ├── seed.ts                        # 种子数据
│   └── migrations/                    # 数据库迁移
│
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── layout.tsx                 # 根布局
│   │   ├── page.tsx                   # 首页
│   │   ├── globals.css                # 全局样式
│   │   │
│   │   ├── (agent)/                   # AI Agent 页面组
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx               # Agent 首页
│   │   │   ├── tasks/
│   │   │   │   ├── page.tsx           # 任务列表
│   │   │   │   ├── [id]/page.tsx      # 任务详情
│   │   │   │   └── new/page.tsx       # 创建任务
│   │   │   ├── bookings/
│   │   │   │   ├── page.tsx           # 预订列表
│   │   │   │   └── [id]/page.tsx      # 预订详情
│   │   │   ├── wallet/
│   │   │   │   └── page.tsx           # 钱包
│   │   │   └── settings/
│   │   │       └── page.tsx           # 设置
│   │   │
│   │   ├── (human)/                   # Human Expert 页面组
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx               # Human 首页
│   │   │   ├── browse/
│   │   │   │   └── page.tsx           # 浏览任务
│   │   │   ├── tasks/
│   │   │   │   ├── page.tsx           # 我的任务
│   │   │   │   └── [id]/page.tsx      # 任务详情
│   │   │   ├── earnings/
│   │   │   │   └── page.tsx           # 收入
│   │   │   ├── profile/
│   │   │   │   └── page.tsx           # 个人资料
│   │   │   └── reviews/
│   │   │       └── page.tsx           # 评价管理
│   │   │
│   │   ├── (admin)/                   # 管理后台页面组
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx               # 仪表盘
│   │   │   ├── users/
│   │   │   │   └── page.tsx           # 用户管理
│   │   │   ├── tasks/
│   │   │   │   └── page.tsx           # 任务管理
│   │   │   ├── bookings/
│   │   │   │   └── page.tsx           # 预订管理
│   │   │   ├── disputes/
│   │   │   │   └── page.tsx           # 争议处理
│   │   │   └── settings/
│   │   │       └── page.tsx           # 系统设置
│   │   │
│   │   ├── api/                       # API 路由
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/route.ts  # NextAuth
│   │   │   │   ├── register/route.ts
│   │   │   │   └── login/route.ts
│   │   │   ├── humans/
│   │   │   │   ├── route.ts           # GET/POST humans
│   │   │   │   └── [id]/route.ts      # GET/PUT human
│   │   │   ├── tasks/
│   │   │   │   ├── route.ts           # GET/POST tasks
│   │   │   │   └── [id]/route.ts      # GET/PUT/DELETE task
│   │   │   ├── bookings/
│   │   │   │   ├── route.ts           # GET/POST bookings
│   │   │   │   └── [id]/route.ts      # GET/PUT booking
│   │   │   ├── messages/
│   │   │   │   └── [id]/route.ts      # POST message
│   │   │   ├── reviews/
│   │   │   │   └── route.ts           # POST review
│   │   │   ├── disputes/
│   │   │   │   └── [id]/route.ts      # POST/PUT dispute
│   │   │   └── mcp/
│   │   │       └── route.ts           # MCP Server 端点
│   │   │
│   │   └── (public)/                  # 公共页面
│   │       ├── about/page.tsx         # 关于我们
│   │       ├── pricing/page.tsx       # 定价
│   │       └── contact/page.tsx       # 联系我们
│   │
│   ├── components/                    # React 组件
│   │   ├── ui/                        # shadcn/ui 组件
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   └── ...
│   │   ├── agent/                     # Agent 专用组件
│   │   │   ├── TaskCard.tsx
│   │   │   ├── CreateTaskForm.tsx
│   │   │   └── BookingList.tsx
│   │   ├── human/                     # Human 专用组件
│   │   │   ├── TaskBrowser.tsx
│   │   │   ├── EarningsChart.tsx
│   │   │   └── ProfileSetup.tsx
│   │   └── shared/                    # 共享组件
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       ├── Map.tsx
│   │       ├── Chat.tsx
│   │       └── Rating.tsx
│   │
│   ├── lib/                           # 工具库
│   │   ├── db.ts                      # Prisma 客户端
│   │   ├── auth.ts                    # 认证工具
│   │   ├── utils.ts                   # 通用工具
│   │   ├── matching.ts                # 匹配算法
│   │   ├── location.ts                # 地理位置
│   │   └── socket.ts                  # Socket.io 客户端
│   │
│   ├── services/                      # 业务逻辑服务
│   │   ├── task.service.ts            # 任务服务
│   │   ├── booking.service.ts         # 预订服务
│   │   ├── human.service.ts           # 人类专家服务
│   │   ├── payment.service.ts         # 支付服务
│   │   ├── notification.service.ts    # 通知服务
│   │   └── dispute.service.ts         # 争议服务
│   │
│   ├── hooks/                         # React Hooks
│   │   ├── useAuth.ts                 # 认证 Hook
│   │   ├── useTasks.ts                # 任务 Hook
│   │   ├── useBookings.ts             # 预订 Hook
│   │   ├── useMessages.ts             # 消息 Hook
│   │   └── useSocket.ts               # Socket Hook
│   │
│   ├── types/                         # TypeScript 类型定义
│   │   ├── user.ts                    # User 类型
│   │   ├── task.ts                    # Task 类型
│   │   ├── booking.ts                 # Booking 类型
│   │   ├── human.ts                   # Human 类型
│   │   ├── api.ts                     # API 类型
│   │   └── mcp.ts                     # MCP 类型
│   │
│   ├── config/                        # 配置文件
│   │   ├── stripe.ts                  # Stripe 配置
│   │   ├── s3.ts                      # S3 配置
│   │   └── constants.ts               # 常量
│   │
│   └── middleware.ts                  # Next.js 中间件
│
├── mcp-server/                        # MCP Server
│   ├── package.json
│   ├── src/
│   │   ├── server.ts                  # MCP Server 主文件
│   │   ├── tools/
│   │   │   ├── search-humans.ts
│   │   │   ├── get-human.ts
│   │   │   ├── book-human.ts
│   │   │   ├── get-booking.ts
│   │   │   ├── update-booking.ts
│   │   │   └── list-skills.ts
│   │   └── types.ts
│   └── README.md
│
├── scripts/                           # 脚本
│   ├── seed-db.ts                     # 种子数据库
│   └── migrate.ts                     # 迁移脚本
│
└── public/                            # 静态资源
    ├── images/
    ├── icons/
    └── favicon.ico
```

## 核心文件说明

### Prisma Schema (prisma/schema.prisma)
定义所有数据库模型：User, HumanProfile, Task, Booking, Message, Review, Dispute 等

### API 路由 (src/app/api/)
所有 REST API 端点，使用 Next.js Route Handlers

### MCP Server (mcp-server/)
独立的 MCP Server 包，可以被其他 AI Agent 项目引入

### Components (src/components/)
- `ui/`: shadcn/ui 基础组件
- `agent/`: AI Agent 专用组件
- `human/`: 人类专家专用组件
- `shared/`: 共享组件

### Services (src/services/)
业务逻辑层，处理复杂操作：
- Task Service: 任务创建、分配、完成
- Booking Service: 预订管理
- Payment Service: 支付处理
- Notification Service: 通知发送

### Hooks (src/hooks/)
React 自定义 Hooks，封装状态和逻辑
- useAuth: 认证状态
- useTasks: 任务管理
- useBookings: 预订管理
- useSocket: WebSocket 连接

### Types (src/types/)
TypeScript 类型定义，确保类型安全

## 开发工作流

### 1. 数据库变更
```bash
# 修改 schema.prisma
npx prisma migrate dev --name migration_name
# 生成类型
npx prisma generate
```

### 2. 添加新 API
```bash
# 创建文件
touch src/app/api/new-endpoint/route.ts
```

### 3. 添加新页面
```bash
# 创建文件
touch src/app/(agent)/new-page/page.tsx
```

### 4. 测试
```bash
# 运行测试
npm test
```

### 5. 构建
```bash
# 生产构建
npm run build
```

## 文件命名约定

- **组件**: PascalCase (TaskCard.tsx)
- **页面**: page.tsx 或 layout.tsx
- **API**: route.ts
- **工具函数**: camelCase (utils.ts)
- **类型**: camelCase (user.ts)
- **配置**: camelCase (config.ts)

## 代码组织原则

1. **按功能分组**：agent/, human/, admin/ 页面组
2. **按类型分层**：components/, services/, hooks/, types/
3. **共享代码放在 shared/**：避免重复
4. **保持文件小而专一**：单一职责原则

---

**Agent Didi 项目结构 v1.0**