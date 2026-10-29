# HumanAPI v2.0.0 部署指南

## 实现范围

当前发布包含 Next.js 16、PostgreSQL 16、Prisma migration、服务级 API Key、每 Key 限流、安全响应头和 MCP stdio Server（12 个工具）。最终用户身份/资源级授权、Stripe、Redis、Socket.io、S3 和合规认证尚未实现。

## 前置要求

- Node.js 22+
- npm 10+
- PostgreSQL 16，或 Docker
- 一个长随机 `API_KEY`

## Docker Compose（推荐）

复制环境变量并至少设置 API Key：

```bash
cp .env.example .env
# 编辑 .env：设置 API_KEY 与 HUMANAPI_API_KEY 为同一个长随机值
docker compose up --build -d
```

Compose 会按顺序执行：

1. 启动 PostgreSQL 并等待健康检查；
2. 一次性运行 `prisma migrate deploy`；
3. migration 成功后启动非 root 的 Next.js 容器；
4. 使用 `/api/ready` 验证数据库 readiness。

常用命令：

```bash
docker compose ps
docker compose logs -f migrate app
curl http://localhost:3000/api/health
curl http://localhost:3000/api/ready
docker compose down
```

数据库默认值兼容早期 Compose volume：

```dotenv
POSTGRES_DB=humanapi
POSTGRES_USER=user
POSTGRES_PASSWORD=password
```

生产环境必须通过 secret 管理覆盖这些默认值，并在反向代理处终止 HTTPS。

## 手动部署

```bash
npm ci
cp .env.example .env
npx prisma migrate deploy
API_KEY='your-secret' DATABASE_URL='postgresql://...' npm run build
API_KEY='your-secret' DATABASE_URL='postgresql://...' npm start
```

应用端点：

- `GET /api/health`：进程存活，不检查数据库；
- `GET /api/ready`：执行 `SELECT 1`，数据库不可用时返回 503；
- 其余 REST/MCP 路由：需要 Bearer 或 `x-api-key`。

## 从 v1.1 或更早版本升级

旧版本没有 Prisma migration 历史。先备份数据库，并确认现有结构与 `prisma/migrations/20260830184500_initial/migration.sql` 等价，再执行一次 baseline：

```bash
npx prisma migrate resolve --applied 20260830184500_initial
npx prisma migrate deploy
```

不要在未经比对的生产数据库上直接标记 migration。有结构差异时，应先在数据库副本上生成、审查并测试专用升级 migration。

旧 Compose volume 默认账号为 `user/password`；v1.2.0 默认继续兼容该账号。通过环境变量修改账号不会自动修改已初始化 volume 内的 PostgreSQL 角色。

## MCP Server

```bash
npm run mcp:build
HUMANAPI_API_URL='https://your-host/api/mcp' \
HUMANAPI_API_KEY='与服务端 API_KEY 相同' \
node mcp-server/dist/index.js
```

GitHub Release 会附带 `humanapi-mcp-server-<version>.tgz`。npm Registry 包尚未发布。

## 发布前验证

```bash
API_KEY='release-check-key' DATABASE_URL='postgresql://...' npm run check
npm pack --workspace @humanapi/mcp-server --dry-run
docker build -t humanapi:2.0.0 .
```

## 生产安全清单

- 使用高熵 API Key，并定期轮换；
- API Key 只放在服务端/MCP 环境，不进入浏览器 bundle；
- 使用 HTTPS、网络隔离、数据库备份和集中日志；
- 在多租户上线前实现最终用户身份、资源所有权授权和审计；
- 在真实支付上线前实现签名 webhook、幂等事件和独立支付账本；
- 为多副本部署将进程内限流换成共享存储（Redis 等），并安排独立安全评估。
