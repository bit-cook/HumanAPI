# Agent Didi - 技术设计文档

> **历史设计稿 / v2.0.0 实现状态**：当前仓库已实现 Next.js REST/MCP、Prisma/PostgreSQL、匹配与服务级 API Key；本文中的 NextAuth、Socket.io、Redis、Stripe、S3、最终用户授权和支付 webhook 尚未实现，不能视为生产能力。

## 1. 系统架构设计

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端层                              │
├─────────────────────────────────────────────────────────────┤
│  AI Agent App    │   Human Expert App   │   Admin Panel     │
│  (Next.js)       │   (Next.js)          │   (Next.js)       │
└──────────────────┼──────────────────────┼───────────────────┘
                   │                      │
                   └──────────┬───────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                            │
│                 (Nginx + Rate Limiting)                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
    ┌───────────────────────┼───────────────────────┐
    │                       │                       │
┌───┴────┐           ┌──────┴───────┐        ┌─────┴────────┐
│ API    │           │  MCP Server  │        │  WebSocket   │
│ Server │           │  (Express)   │        │  (Socket.io) │
└───┬────┘           └──────┬───────┘        └─────┬────────┘
    │                       │                      │
    └───────────┬───────────┼──────────────────────┘
                │           │
        ┌───────┴───────┐   │
        │   Business    │   │
        │    Logic      │   │
        └───────┬───────┘   │
                │           │
    ┌───────────┼───────────┼──────────┐
    │           │           │          │
┌───┴───┐  ┌────┴────┐  ┌───┴───┐  ┌───┴────┐
│Prisma │  │ Redis   │  │Stripe │  │   S3   │
│ (ORM) │  │ (Cache) │  │Connect│  │(Files) │
└───┬───┘  └─────────┘  └───────┘  └────────┘
    │
┌───┴─────────┐
│ PostgreSQL  │
│  (Database) │
└─────────────┘
```

### 1.2 技术栈选择理由

#### 前端: Next.js 14 + TypeScript
- ✅ App Router - 更好的性能和SEO
- ✅ Server Components - 减少客户端负载
- ✅ TypeScript - 类型安全
- ✅ shadcn/ui - 美观、可定制
- ✅ React Query - 服务端状态管理

#### 后端: Node.js + Express + TypeScript
- ✅ 与前端统一语言
- ✅ Express - 成熟、灵活
- ✅ TypeScript - 类型安全
- ✅ 易于部署和维护

#### 数据库: PostgreSQL + Prisma
- ✅ PostgreSQL - 强大的关系型数据库
- ✅ Prisma - 现代化的ORM
- ✅ 类型安全的查询
- ✅ 自动迁移

#### 实时通讯: Socket.io
- ✅ 实时双向通讯
- ✅ 自动重连
- ✅ 跨浏览器支持
- ✅ 易于集成

#### 认证: NextAuth.js
- ✅ 多种登录方式
- ✅ JWT + Session
- ✅ 类型安全
- ✅ 易于集成

#### 支付: Stripe Connect
- ✅ 市场平台支付
- ✅ 自动合规
- ✅ 全球支持
- ✅ 灵活的支付方式

## 2. 数据库设计

### 2.1 ER图

```
User (1) ----< HumanProfile (1)
 |                         |
 |                         |--< Wallet (1:N)
 |                         |--< Certification (1:N)
 |
 |--< Task (1:N)           |--< Skill (1:N)
 |
 |--< Booking (1:N)
 |
 |--< Review (1:N)       Booking (1) --< Message (1:N)
 |
 |--< Dispute (1:N)
```

### 2.2 Prisma Schema 详细设计

#### User Model
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  phone         String?   @unique
  password      String?
  name          String
  avatar        String?
  role          UserRole  @default(AGENT)
  verified      Boolean   @default(false)
  rating        Float     @default(5.0)
  totalReviews  Int       @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  humanProfile  HumanProfile?
  tasks         Task[]
  bookingsAsAgent Booking[]      @relation("AgentBookings")
  bookingsAsHuman Booking[]      @relation("HumanBookings")
  reviewsGiven  Review[]         @relation("ReviewsGiven")
  reviewsReceived Review[]       @relation("ReviewsReceived")
  disputes      Dispute[]

  @@index([email])
  @@index([phone])
}

enum UserRole {
  AGENT
  HUMAN
  ADMIN
}
```

#### HumanProfile Model
```prisma
model HumanProfile {
  id              String    @id @default(cuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  bio             String?
  location        Json
  skills          Json      // 技能列表 [{name, verified}]
  hourlyRate      Float
  currency        String    @default("CNY")
  available       Boolean   @default(true)
  verified        Boolean   @default(false)
  totalTasks      Int       @default(0)
  successRate     Float     @default(100.0)

  wallets         Wallet[]
  certifications  Certification[]

  @@index([location])
  @@index([hourlyRate])
}
```

#### Wallet Model
```prisma
model Wallet {
  id              String    @id @default(cuid())
  humanProfileId  String
  humanProfile    HumanProfile @relation(fields: [humanProfileId], references: [id], onDelete: Cascade)
  type            WalletType
  address         String
  network         String?
  confirmed       Boolean   @default(false)
  createdAt       DateTime  @default(now())

  @@index([humanProfileId])
}

enum WalletType {
  STRIPE_CONNECT
  CRYPTO
}
```

#### Certification Model
```prisma
model Certification {
  id              String    @id @default(cuid())
  humanProfileId  String
  humanProfile    HumanProfile @relation(fields: [humanProfileId], references: [id], onDelete: Cascade)
  name            String
  issuer          String?
  documentUrl     String
  verified        Boolean   @default(false)
  verifiedAt      DateTime?
  createdAt       DateTime  @default(now())

  @@index([humanProfileId])
}
```

#### Task Model
```prisma
model Task {
  id              String    @id @default(cuid())
  agentId         String
  agent           User      @relation(fields: [agentId], references: [id])
  humanId         String?
  human           User?     @relation("TaskHuman", fields: [humanId], references: [id])
  title           String
  description     String    @db.Text
  skills          Json      // 技能需求
  location        Json      // 任务位置
  scheduledTime   DateTime?
  estimatedDuration Int      // 预计时长（分钟）
  paymentAmount   Float
  currency        String    @default("CNY")
  status          TaskStatus @default(DRAFT)
  priority        Int       @default(5) // 1-10, 10最高
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  completedAt     DateTime?

  booking         Booking?

  @@index([agentId])
  @@index([humanId])
  @@index([status])
  @@index([scheduledTime])
}

enum TaskStatus {
  DRAFT
  OPEN
  ASSIGNED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

#### Booking Model
```prisma
model Booking {
  id              String        @id @default(cuid())
  taskId          String        @unique
  task            Task          @relation(fields: [taskId], references: [id], onDelete: Cascade)
  agentId         String
  agent           User          @relation("AgentBookings", fields: [agentId], references: [id])
  humanId         String
  human           User          @relation("HumanBookings", fields: [humanId], references: [id])
  scheduledTime   DateTime
  estimatedDuration Int
  actualDuration   Int?
  paymentAmount   Float
  paymentStatus   PaymentStatus @default(PENDING)
  status          BookingStatus @default(PENDING)
  completionProof String?
  agentRating     Float?
  humanRating     Float?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  startedAt       DateTime?
  completedAt     DateTime?

  messages        Message[]
  reviews         Review[]
  disputes        Dispute[]

  @@index([agentId])
  @@index([humanId])
  @@index([status])
  @@index([scheduledTime])
}

enum PaymentStatus {
  PENDING
  PAID
  REFUNDED
  PARTIALLY_REFUNDED
}

enum BookingStatus {
  PENDING
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  DISPUTED
}
```

#### Message Model
```prisma
model Message {
  id              String    @id @default(cuid())
  bookingId       String
  booking         Booking   @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  senderId        String
  sender          User      @relation("MessageSender", fields: [senderId], references: [id])
  recipientId     String
  recipient       User      @relation("MessageRecipient", fields: [recipientId], references: [id])
  content         String    @db.Text
  attachments     Json?     // 文件列表
  read            Boolean   @default(false)
  createdAt       DateTime  @default(now())

  @@index([bookingId])
  @@index([senderId])
  @@index([recipientId])
  @@index([createdAt])
}
```

#### Review Model
```prisma
model Review {
  id              String    @id @default(cuid())
  bookingId       String
  booking         Booking   @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  reviewerId      String
  reviewer        User      @relation("ReviewsGiven", fields: [reviewerId], references: [id])
  revieweeId      String
  reviewee        User      @relation("ReviewsReceived", fields: [revieweeId], references: [id])
  rating          Float     // 1-5
  comment         String?   @db.Text
  createdAt       DateTime  @default(now())

  @@unique([bookingId, reviewerId])
  @@index([bookingId])
  @@index([reviewerId])
  @@index([revieweeId])
}
```

#### Dispute Model
```prisma
model Dispute {
  id              String        @id @default(cuid())
  bookingId       String
  booking         Booking       @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  reporterId      String
  reporter        User          @relation(fields: [reporterId], references: [id])
  reason          String
  description     String        @db.Text
  evidence        Json?         // 证据文件列表
  status          DisputeStatus @default(OPEN)
  aiResolution    String?       @db.Text
  humanResolution String?       @db.Text
  resolvedAt      DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([bookingId])
  @@index([reporterId])
  @@index([status])
}

enum DisputeStatus {
  OPEN
  INVESTIGATING
  RESOLVED
  REJECTED
}
```

## 3. API 设计

### 3.1 REST API 端点

#### 认证 API
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
```

#### 人类专家 API
```
GET    /api/humans
GET    /api/humans/:id
GET    /api/humans/:id/reviews
POST   /api/humans/:id/book
PUT    /api/humans/me
POST   /api/humans/me/skills
POST   /api/humans/me/certifications
POST   /api/humans/me/wallets
```

#### 任务 API
```
GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/:id
PUT    /api/tasks/:id
DELETE /api/tasks/:id
POST   /api/tasks/:id/assign
POST   /api/tasks/:id/start
POST   /api/tasks/:id/complete
POST   /api/tasks/:id/cancel
```

#### 预订 API
```
GET    /api/bookings
POST   /api/bookings
GET    /api/bookings/:id
PUT    /api/bookings/:id
POST   /api/bookings/:id/confirm
POST   /api/bookings/:id/start
POST   /api/bookings/:id/complete
POST   /api/bookings/:id/cancel
POST   /api/bookings/:id/proof
```

#### 消息 API
```
GET    /api/bookings/:id/messages
POST   /api/bookings/:id/messages
PUT    /api/messages/:id/read
```

#### 评价 API
```
POST   /api/bookings/:id/reviews
GET    /api/users/:id/reviews
```

#### 争议 API
```
POST   /api/bookings/:id/disputes
GET    /api/disputes/:id
PUT    /api/disputes/:id
POST   /api/disputes/:id/resolve
```

#### 技能 API
```
GET    /api/skills
GET    /api/skills/:category
```

### 3.2 MCP Server 端点

```
POST   /mcp/tools/search_humans
POST   /mcp/tools/get_human
POST   /mcp/tools/book_human
POST   /mcp/tools/get_booking
POST   /mcp/tools/update_booking
POST   /mcp/tools/list_skills
```

## 4. 实时通讯设计

### 4.1 Socket.io 事件

#### 客户端 → 服务器
```javascript
// 连接
socket.on('connect', () => {
  socket.emit('authenticate', { token: 'jwt-token' })
})

// 认证
socket.emit('authenticate', { token: 'jwt-token' })

// 订阅预订频道
socket.emit('join_booking', { bookingId: 'xxx' })

// 发送消息
socket.emit('send_message', {
  bookingId: 'xxx',
  content: 'message',
  attachments: []
})

// 更新任务状态
socket.emit('update_task_status', {
  taskId: 'xxx',
  status: 'IN_PROGRESS'
})
```

#### 服务器 → 客户端
```javascript
// 认证成功
socket.emit('authenticated', { userId: 'xxx' })

// 新消息
socket.emit('new_message', {
  bookingId: 'xxx',
  message: { ... }
})

// 任务状态更新
socket.emit('task_status_updated', {
  taskId: 'xxx',
  status: 'IN_PROGRESS'
})

// 新预订
socket.emit('new_booking', { booking: { ... } })

// 预订取消
socket.emit('booking_cancelled', { bookingId: 'xxx' })
```

## 5. 匹配算法设计

### 5.1 评分系统

```typescript
interface MatchScore {
  skillMatch: number;      // 技能匹配度 0-100
  locationMatch: number;   // 位置匹配度 0-100
  ratingMatch: number;     // 评分匹配度 0-100
  availabilityMatch: number; // 可用性匹配 0-100
  priceMatch: number;      // 价格匹配度 0-100
  totalScore: number;      // 总分 0-100
}

function calculateMatchScore(
  task: Task,
  human: HumanProfile
): MatchScore {
  const skillMatch = calculateSkillMatch(task.skills, human.skills);
  const locationMatch = calculateLocationMatch(task.location, human.location);
  const ratingMatch = human.user.rating * 20; // 5分=100分
  const availabilityMatch = human.available ? 100 : 0;
  const priceMatch = calculatePriceMatch(task.paymentAmount, human.hourlyRate);

  const totalScore = (
    skillMatch * 0.35 +
    locationMatch * 0.25 +
    ratingMatch * 0.20 +
    availabilityMatch * 0.15 +
    priceMatch * 0.05
  );

  return {
    skillMatch,
    locationMatch,
    ratingMatch,
    availabilityMatch,
    priceMatch,
    totalScore
  };
}
```

### 5.2 地理位置距离计算

```typescript
import { distance as geodistance } from 'geolocation-utils';

function calculateDistance(
  loc1: { lat: number; lon: number },
  loc2: { lat: number; lon: number }
): number {
  return geodistance(
    [loc1.lon, loc1.lat],
    [loc2.lon, loc2.lat]
  ) * 1000; // 转换为米
}

function calculateLocationMatch(
  taskLoc: { lat: number; lon: number },
  humanLoc: { lat: number; lon: number },
  maxDistance = 10000 // 最大距离10公里
): number {
  const distance = calculateDistance(taskLoc, humanLoc);
  return Math.max(0, 100 - (distance / maxDistance) * 100);
}
```

## 6. 支付流程设计

### 6.1 Stripe Connect 流程

1. **Human 专家注册 Stripe Connect**
   ```
   POST /api/stripe/onboarding
   → 返回 Stripe Onboarding 链接
   → Human 完成验证
   ```

2. **Agent 预订并支付**
   ```
   POST /api/bookings
   → 创建支付意向
   → Agent 支付到平台账户
   → 资金冻结
   ```

3. **任务完成后**
   ```
   POST /api/bookings/:id/complete
   → 触发转账给 Human
   → Stripe Connect 自动分账
   ```

### 6.2 支付状态

```typescript
enum PaymentStatus {
  PENDING,           // 待支付
  PROCESSING,        // 处理中
  PAID,              // 已支付
  REJECTED,          // 拒绝
  REFUNDED,          // 已退款
  PARTIALLY_REFUNDED // 部分退款
}
```

## 7. 安全设计

### 7.1 认证与授权

- JWT Token 认证
- Token 刷新机制
- Role-based Access Control (RBAC)
- Rate Limiting

### 7.2 数据验证

```typescript
import { z } from 'zod';

const taskSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(10).max(2000),
  skills: z.array(z.string()).min(1),
  location: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()])
  }),
  scheduledTime: z.date().optional(),
  estimatedDuration: z.number().min(15).max(480), // 15分钟-8小时
  paymentAmount: z.number().positive(),
  currency: z.string().length(3)
});
```

### 7.3 敏感数据保护

- 密码加密 (bcrypt)
- API Key 加密存储
- 数据传输加密 (HTTPS)
- 数据库加密

## 8. 性能优化

### 8.1 缓存策略

- Redis 缓存热门人类专家列表
- Redis 缓存任务搜索结果
- CDN 缓存静态资源

### 8.2 数据库优化

- 合理的索引设计
- 查询优化
- 分页查询
- 连接池管理

### 8.3 前端优化

- Server Components
- 图片懒加载
- 代码分割
- 预加载关键资源

## 9. 监控与日志

### 9.1 监控指标

- API 响应时间
- 错误率
- 任务完成率
- 支付成功率
- 用户活跃度

### 9.2 日志系统

```typescript
logger.info('Task created', {
  taskId: 'xxx',
  agentId: 'xxx',
  timestamp: new Date()
});

logger.error('Payment failed', {
  bookingId: 'xxx',
  error: error.message,
  stack: error.stack
});
```

## 10. 部署架构

### 10.1 Docker Compose 配置

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=agent_didi
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 10.2 环境变量

```env
# 数据库
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
AWS_S3_BUCKET=...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
```

---

**技术设计文档 v1.0**
