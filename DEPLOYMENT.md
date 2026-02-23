# HumanAPI - 部署指南

## 前置要求

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose（可选）
- Stripe 账户（用于支付）

## 快速开始（开发环境）

### 1. 克隆项目

```bash
cd /root/.openclaw/workspace/agent-didi
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

### 4. 启动数据库

使用 Docker Compose：

```bash
docker-compose up -d postgres redis
```

或者手动启动 PostgreSQL 和 Redis。

### 5. 初始化数据库

```bash
# 生成 Prisma Client
npx prisma generate

# 运行迁移
npx prisma migrate dev

# （可选）填充种子数据
npm run db:seed
```

### 6. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## Docker 部署

### 1. 构建镜像

```bash
docker-compose build
```

### 2. 启动所有服务

```bash
docker-compose up -d
```

### 3. 查看日志

```bash
docker-compose logs -f app
```

### 4. 停止服务

```bash
docker-compose down
```

## 生产部署

### 使用 Vercel

1. 推送代码到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 部署

### 使用 Railway

1. 创建新项目
2. 添加 PostgreSQL 和 Redis
3. 配置环境变量
4. 部署

### 使用 AWS ECS

1. 构建 Docker 镜像
2. 推送到 ECR
3. 配置 ECS 任务定义
4. 部署服务

### 使用阿里云

1. 使用阿里云容器服务（ACK）
2. 配置负载均衡
3. 配置域名和 SSL
4. 部署

## 环境变量配置

### 必需变量

```env
# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/agent_didi

# NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret-key

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 可选变量

```env
# Redis
REDIS_URL=redis://localhost:6379

# AWS S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=agent-didi-uploads

# SMTP 邮件
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@agentdidi.com
```

## 数据库迁移

### 开发环境

```bash
# 创建新迁移
npx prisma migrate dev --name migration_name

# 重置数据库
npx prisma migrate reset
```

### 生产环境

```bash
# 应用迁移
npx prisma migrate deploy

# 查看迁移状态
npx prisma migrate status
```

## Stripe 配置

### 1. 创建 Stripe Connect

登录 Stripe Dashboard：
1. 进入 Settings → Connect
2. 启用 Connect
3. 配置 OAuth 设置

### 2. 配置 Webhook

1. 在 Stripe Dashboard 创建 Webhook
2. 端点：`https://yourdomain.com/api/stripe/webhook`
3. 选择事件：
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated`
   - `transfer.completed`

### 3. 人类专家 Onboarding

人类专家注册时会跳转到 Stripe Connect onboarding 页面完成验证。

## 监控和日志

### 使用 PM2

```bash
npm install -g pm2

# 启动
pm2 start npm --name "agent-didi" -- start

# 查看日志
pm2 logs agent-didi

# 重启
pm2 restart agent-didi

# 停止
pm2 stop agent-didi
```

### 使用 Docker

```bash
# 查看日志
docker-compose logs -f app

# 查看资源使用
docker stats
```

## 备份和恢复

### 数据库备份

```bash
# 备份
pg_dump -U user -d agent_didi > backup.sql

# 恢复
psql -U user -d agent_didi < backup.sql
```

### 文件备份

```bash
# 备份 S3 文件
aws s3 sync s3://agent-didi-uploads ./backup
```

## 安全建议

1. **使用 HTTPS** - 生产环境必须启用 SSL
2. **环境变量** - 不要在代码中硬编码密钥
3. **Rate Limiting** - 配置 API 速率限制
4. **CORS** - 配置正确的 CORS 策略
5. **输入验证** - 验证所有用户输入
6. **SQL 注入** - 使用 Prisma ORM 防止注入
7. **XSS 防护** - React 自动转义，但要小心 dangerouslySetInnerHTML

## 性能优化

1. **CDN** - 使用 CDN 加速静态资源
2. **图片优化** - 使用 Next.js Image 组件
3. **代码分割** - 利用 Next.js 自动代码分割
4. **缓存** - 使用 Redis 缓存热门数据
5. **数据库索引** - 确保 Prisma schema 有正确的索引
6. **连接池** - 配置数据库连接池

## 常见问题

### Q: 数据库连接失败

A: 检查 DATABASE_URL 是否正确，数据库是否运行。

### Q: Stripe 支付失败

A: 检查 API Keys 和 Webhook Secret 是否正确。

### Q: Redis 连接错误

A: 确保 Redis 正在运行，检查 REDIS_URL。

### Q: 上传文件失败

A: 检查 AWS S3 配置和权限。

## 支持

- 文档：https://docs.agentdidi.com
- GitHub Issues：https://github.com/agent-didi/issues
- 邮件：support@agentdidi.com

---

**Agent Didi 部署指南 v1.0.0**