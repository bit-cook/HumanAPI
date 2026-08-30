# CHANGELOG

All notable changes to HumanAPI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
