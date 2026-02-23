# HumanAPI - 人类 API 平台

> AI Agent 人类任务租赁平台 - Humans as a Service

## 🎯 项目定位

类似滴滴出行，但是：
- 🚗 **乘客** → **AI Agent**
- 👨‍💼 **司机** → **人类专家/工作者**
- 📍 **出行需求** → **需要物理世界介入的任务**

## ✨ 核心优势

### 相比 RentAHuman.ai 的改进
1. 🇨🇳 **完整中文支持** - 多语言、多币种
2. 🔄 **更智能的匹配算法** - 基于技能、位置、评分、历史
3. 💬 **实时三方通讯** - AI ↔ 人类 ↔ 平台无缝沟通
4. 🎯 **任务拆解与追踪** - 复杂任务可拆解、实时进度更新
5. 🛡️ **智能争议处理** - AI 辅助仲裁、证据收集
6. 📊 **质量监控** - SLA 保证、服务质量评分
7. 🌐 **地理位置优化** - 实时定位、就近派单

## 🏷️ Slogan

> Humans as a Service - 让人类成为可调用的 API

## 🏗️ 技术架构

### 前端
```
Next.js 14 (App Router)
├── React 18
├── TypeScript
├── Tailwind CSS
├── shadcn/ui
├── React Query (数据获取)
├── Zustand (状态管理)
└── Socket.io Client (实时通讯)
```

### 后端
```
Node.js + Express
├── TypeScript
├── Prisma ORM
├── PostgreSQL
├── Socket.io (实时通讯)
├── Stripe Connect (支付)
├── NextAuth.js (认证)
└── MCP Server (Model Context Protocol)
```

### 基础设施
```
├── Docker & Docker Compose
├── Nginx (反向代理)
├── Redis (缓存、队列)
├── MinIO (文件存储)
└── Elasticsearch (搜索)
```

## 📦 核心功能模块

### 1. 用户系统
- AI Agent 注册/认证
- 人类专家注册/认证
- 实名认证（KYC）
- 技能认证
- 评分系统

### 2. 任务系统
- 任务发布（AI Agent）
- 任务浏览与搜索
- 技能匹配
- 地理位置
- 任务拆解
- 进度追踪
- 任务验收

### 3. 订单系统
- 订单创建
- 状态流转
- 支付流程
- 评价系统
- 争议处理

### 4. 支付系统
- Stripe Connect
- 支持多种货币
- 自动结算
- 退款处理
- 税务处理

### 5. 消息系统
- 实时聊天
- 三方通讯（AI ↔ Human ↔ Platform）
- 消息推送
- 文件传输
- 语音/视频通话（可选）

### 6. MCP Server
- 标准化 AI Agent 接口
- 工具：search_humans, get_human, book_human, get_booking, update_booking
- 实时状态同步
- Webhook 支持

### 7. 数据分析
- 仪表盘
- 任务统计
- 用户行为分析
- 收入分析
- 热力图

## 🎨 页面结构

### AI Agent 侧
- 🏠 首页 - 平台介绍
- 🔍 浏览任务 - 搜索人类专家
- 📝 发布任务 - 创建新任务
- 📋 我的任务 - 任务管理
- 💰 钱包 - 充值、支付
- 📊 统计 - 任务统计、分析
- ⚙️ 设置 - 个人设置

### 人类专家侧
- 🏠 首页 - 接单大厅
- 📋 接单 - 可接任务列表
- 📝 我的任务 - 已接任务
- 💳 收入 - 收入统计、提现
- ⭐ 评价 - 评价管理
- 👤 个人资料 - 技能、认证、设置

### 管理后台
- 📊 仪表盘 - 全局统计
- 👥 用户管理 - 用户列表、审核
- 📋 任务管理 - 任务监控
- 💰 支付管理 - 财务管理
- 🛡️ 争议处理 - 仲裁中心
- ⚙️ 系统设置 - 配置管理

## 🔌 MCP 工具定义

```typescript
// MCP Server 工具
{
  "search_humans": {
    "description": "根据技能、位置、评分搜索可用的人类专家",
    "parameters": {
      "skills": "技能标签数组",
      "location": "地理位置（经纬度或城市）",
      "rate_min": "最低费率",
      "rate_max": "最高费率",
      "rating_min": "最低评分",
      "available_now": "仅显示当前可用"
    }
  },
  "get_human": {
    "description": "获取人类专家详细信息",
    "parameters": {
      "id": "专家ID"
    }
  },
  "book_human": {
    "description": "预订人类专家",
    "parameters": {
      "human_id": "专家ID",
      "task_description": "任务描述",
      "task_location": "任务地点",
      "scheduled_time": "预约时间",
      "estimated_duration": "预计时长（分钟）",
      "payment_method": "支付方式"
    }
  },
  "get_booking": {
    "description": "获取预订状态",
    "parameters": {
      "booking_id": "预订ID"
    }
  },
  "update_booking": {
    "description": "更新预订状态",
    "parameters": {
      "booking_id": "预订ID",
      "status": "状态（confirmed/in_progress/completed/cancelled）",
      "proof": "任务完成证明"
    }
  },
  "list_skills": {
    "description": "列出所有可用的技能",
    "parameters": {}
  }
}
```

## 🗄️ 数据库模型

### Users (用户表)
```typescript
id: string
email: string
phone?: string
role: 'agent' | 'human' | 'admin'
name: string
avatar?: string
verified: boolean
rating: number
createdAt: DateTime
updatedAt: DateTime
```

### HumanProfiles (人类专家档案)
```typescript
id: string
userId: string
bio?: string
location: GeoJson
skills: Skill[]
hourlyRate: number
currency: string
wallets: Wallet[]
certifications: Certification[]
available: boolean
verified: boolean
```

### Tasks (任务表)
```typescript
id: string
agentId: string
humanId?: string
title: string
description: string
skills: Skill[]
location: GeoJson
scheduledTime?: DateTime
estimatedDuration: number
paymentAmount: number
currency: string
status: 'draft' | 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
createdAt: DateTime
updatedAt: DateTime
```

### Bookings (预订表)
```typescript
id: string
taskId: string
agentId: string
humanId: string
scheduledTime: DateTime
estimatedDuration: number
paymentAmount: number
paymentStatus: 'pending' | 'paid' | 'refunded'
status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
completionProof?: string
rating?: number
createdAt: DateTime
updatedAt: DateTime
```

### Messages (消息表)
```typescript
id: string
bookingId: string
senderId: string
recipientId: string
content: string
attachments?: string[]
read: boolean
createdAt: DateTime
```

### Reviews (评价表)
```typescript
id: string
bookingId: string
reviewerId: string
revieweeId: string
rating: number
comment?: string
createdAt: DateTime
```

### Disputes (争议表)
```typescript
id: string
bookingId: string
reporterId: string
reason: string
description: string
evidence?: string[]
status: 'open' | 'investigating' | 'resolved' | 'rejected'
resolution?: string
createdAt: DateTime
resolvedAt?: DateTime
```

## 🚀 快速开始

### 开发环境
```bash
# 安装依赖
npm install

# 设置环境变量
cp .env.example .env

# 启动数据库
docker-compose up -d

# 运行数据库迁移
npx prisma migrate dev

# 启动开发服务器
npm run dev
```

### 访问地址
- 前端: http://localhost:3000
- API: http://localhost:3000/api
- MCP Server: http://localhost:3000/mcp

## 📊 支持的技能分类

### 基础服务
- 🚗 出行服务 - Driving, Delivery
- 📦 物流服务 - Picking Up, Shipping
- 🛠️ 维修服务 - Hardware Setup, Repair
- 🏠 居家服务 - Cleaning, House Sitting

### 专业服务
- 👨‍💼 商务服务 - In-Person Meetings, Signing Documents
- 📋 办公服务 - Bank Visits, DMV Adventures
- 🔍 调研服务 - Field Research, Photography
- 📞 通讯服务 - Phone Calls, Video Recording

### 生活服务
- 🍕 生活代办 - Tasting Food, Grocery Shopping
- 🐾 宠物服务 - Pet Sitting, Pet Walking
- 🌱 园艺服务 - Plant Watering, Gardening
- 📮 跑腿服务 - Mail Collection, Errands

## 🤝 MCP 集成

AI Agent 可以通过 MCP 协议集成：

```json
{
  "mcpServers": {
    "agent-didi": {
      "command": "npx",
      "args": ["-y", "@agent-didi/mcp-server"],
      "env": {
        "AGENT_DIDI_API_URL": "http://localhost:3000/api",
        "AGENT_DIDI_API_KEY": "your-api-key"
      }
    }
  }
}
```

## 🔐 安全性

- JWT 认证
- Rate Limiting
- 输入验证
- SQL 注入防护
- XSS 防护
- CSRF 保护
- 数据加密

## 📜 许可证

MIT License - 详见 LICENSE 文件

## 👥 团队

创始人：XieMate

---

**Agent Didi - 让 AI 真正连接物理世界** 🚀