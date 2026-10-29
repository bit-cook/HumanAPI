# CHANGELOG

All notable changes to HumanAPI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-10-29

### Added
- 评价系统：`POST /api/bookings/:id/reviews`、`GET /api/humans/:id/reviews`，
  提交后在同一事务内重算被评方的 User.rating 与 totalReviews
- 消息系统：`GET/POST /api/bookings/:id/messages`，强制 sender/recipient
  必须是该预约的 agent 或 human
- 争议系统：`POST /api/bookings/:id/disputes`、`GET /api/disputes`、
  `GET/PUT /api/disputes/:id`，创建争议会自动把预约置为 DISPUTED
- 预约动作扩展：`dispute`（PENDING/CONFIRMED/IN_PROGRESS → DISPUTED）与
  `resolve`（DISPUTED → COMPLETED），争议不再是无出口的终态
- MCP 工具从 6 个扩展到 12 个：新增 create_review、send_message、
  create_dispute、get_dispute、list_disputes、resolve_dispute
- 每 API Key 固定窗口限流（默认 120 次/60s，`RATE_LIMIT_MAX` /
  `RATE_LIMIT_WINDOW_MS` 可调），超限返回 429 + Retry-After
- 统一安全响应头（HSTS、X-Frame-Options、X-Content-Type-Options、
  Referrer-Policy、Permissions-Policy、X-DNS-Prefetch-Control）
- `GET /api/humans` 支持 page/limit 分页；带位置参数时返回 locationMatch
  与 distance，响应形状与非位置查询一致
- 真实 PostgreSQL 集成测试（21 个）：`npm run test:integration`
- GitHub Pages 文档站点（docs/）与 `.github/workflows/pages.yml`

### Changed
- 预约状态机合并为单一权威定义（src/lib/booking-state.ts），REST action
  路由与 MCP update_booking 共用同一张迁移表，消除两份定义漂移
- `POST /api/bookings` 的 humanId 入参统一为 HumanProfile.id（与
  `GET /api/humans` 输出一致），内部显式翻译为 User.id 落库
- `GET /api/humans` 去掉位置分支的重复全表查询：不带位置走数据库分页，
  带位置逐条计算距离后内存分页
- 版本号统一从 package.json 读取（src/lib/version.ts），health / api /
  mcp 元信息不再硬编码
- 升级 Zod 到 v4、Vitest 到 v5，修复全部传递性安全漏洞（npm audit 0 漏洞）
- CI 从不可用的自托管 runner 切换到 ubuntu-latest + npm 缓存，
  并新增集成测试步骤

### Fixed
- `rateMax=0` 因 falsy 判断被忽略，导致费率过滤对免费专家失效
- 脏 location JSON（缺失 lat/lon、越界、非数字）不再把 NaN 扩散进匹配分
- `PUT /api/humans/:id` 记录不存在时返回 500，现在映射为 404
- REST 与 MCP 的技能过滤行为不一致：统一要求技能 verified
- 同分排序不稳定：新增就近优先的次级排序键
- `/api/humans` 重复注册返回 400，改为语义正确的 409

### Security
- 移除所有传递性高危漏洞（@modelcontextprotocol/sdk、zod、vitest、
  body-parser、brace-expansion、fast-uri、deepmerge-ts 等 17 个）
- API Key 比较使用 timingSafeEqual，fail-closed 语义保持不变

## [1.2.0] - 2026-08-30

### Added
- 可运行、可打包的 MCP stdio Server 与 6 个工具
- 服务级 API Key、严格 Zod 输入验证和事务化预约状态机
- 初始 PostgreSQL 迁移、CI、Docker migrator 与健康检查
- TypeScript、ESLint、Vitest、生产构建和依赖审计质量门禁

### Changed
- 升级到 Next.js 16、React 19、Prisma 6 和 Node.js 22
- 首页改为静态 Server Component，并校正未实现能力的宣传
- 所有私密 REST/MCP 接口改为 fail-closed

### Security
- 移除批量赋值、密码字段泄露和客户端伪造支付状态风险
- 预约创建及状态迁移改为原子事务并校验合法前置状态

### Known limitations
- 尚未实现最终用户身份、资源级授权、支付处理器、实时通讯、限流和文件上传

## [1.0.0] - 2026-02-23

### Added
- 🎉 Initial release of HumanAPI
- 👥 User authentication system (AI Agents & Human Experts)
- 📋 Task creation and management
- 👨‍💼 Human expert profile management
- 🔄 Intelligent matching algorithm (5-dimension scoring)
- 📍 Geolocation-based matching
- 💳 Stripe Connect payment integration
- 💬 Real-time messaging architecture
- 📊 Review and rating system
- 🛡️ Dispute resolution system
- 🔌 MCP Server with 6 core tools
- 🌍 Multi-language support (Chinese & English)
- 💰 Multi-currency support
- 🐳 Docker deployment configuration
- 📖 Comprehensive documentation

### Features
- REST API with 10+ endpoints
- MCP Server (search_humans, get_human, book_human, get_booking, update_booking, list_skills)
- PostgreSQL database with 8 models
- Next.js 14 frontend with TypeScript
- Real-time location matching
- Smart price calculation
- Quality monitoring
- Task tracking and progress updates

### Documentation
- README.md - Project introduction
- TECHNICAL.md - Technical design
- PROJECT_STRUCTURE.md - Project architecture
- DEPLOYMENT.md - Deployment guide
- CONTRIBUTING.md - Contribution guidelines
- LICENSE - MIT License

### Infrastructure
- Docker & Docker Compose
- Prisma ORM
- PostgreSQL 15
- Redis 7
- Stripe Connect
- Socket.io

---

**[1.0.0] - 2026-02-23**: Initial release 🎉
