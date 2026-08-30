# Security Policy

> **v1.2.0 当前边界**：仓库提供服务级 API Key、Zod 验证和 Prisma 事务，但尚无最终用户身份、资源级授权、限流、支付处理器、S3 上传或合规认证。下文提到的 JWT、Stripe 与 S3 控制属于路线图。

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.2.x   | :white_check_mark: |
| < 1.2   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please send an email to security@humanapi.com.

### Security Bug Reports

**Please DO NOT:**
- Open a public GitHub issue
- Disclose the vulnerability publicly
- Share exploit code

**Please DO:**
- Email security@humanapi.com
- Include detailed description
- Include reproduction steps
- Suggest a fix (if possible)

### Response Time

We aim to respond within 48 hours to all security reports.

### Disclosure Process

1. **Initial Report** - You report the vulnerability
2. **Acknowledgment** - We acknowledge receipt within 48 hours
3. **Investigation** - We investigate the issue
4. **Resolution** - We fix the vulnerability
5. **Verification** - You verify the fix
6. **Public Disclosure** - We publish security advisory

## Security Best Practices

### For Users

- Keep API keys secure
- Use environment variables for secrets
- Enable HTTPS in production
- Regularly update dependencies
- Review code before deployment

### For Developers

- Never commit secrets
- Use .env.example for configuration
- Implement rate limiting
- Validate all user inputs
- Use parameterized queries (Prisma handles this)

### API Keys

- Never share API keys
- Rotate keys regularly
- Use different keys for different environments
- Monitor usage for suspicious activity

## Security Features

### Authentication
- JWT-based authentication
- Secure password hashing (bcrypt)
- Token expiration
- Refresh token mechanism

### API Security
- Rate limiting
- CORS protection
- Input validation (Zod)
- SQL injection prevention (Prisma)
- XSS protection (React)

### Data Protection
- HTTPS enforcement
- Sensitive data encryption
- Secure file upload (S3)
- GDPR compliance

### Payment Security
- Stripe Connect (PCI compliant)
- Secure payment processing
- Webhook signature verification

## Dependencies

We regularly update dependencies to address security vulnerabilities. Use:

```bash
npm audit
npm audit fix
```

## Third-Party Services

### Stripe
- PCI DSS Level 1 certified
- SOC 2 Type II certified
- ISO 27001 certified

### AWS S3
- Encryption at rest
- Encryption in transit
- Access controls

### PostgreSQL
- Row-level security
- SSL/TLS encryption
- Role-based access control

---

Thank you for helping keep HumanAPI secure! 🛡️
