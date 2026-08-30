# HumanAPI MCP Server

独立的 MCP Server 包，供 AI Agent 集成使用。

## 安装

v1.2.0 的 npm Registry 包尚未发布。可从 GitHub Release 下载 `humanapi-mcp-server-1.2.0.tgz`，或克隆仓库后运行：

```bash
npm ci
npm run mcp:build
```

## 配置

在 MCP 客户端配置中添加：

```json
{
  "mcpServers": {
    "humanapi": {
      "command": "node",
      "args": ["/absolute/path/to/HumanAPI/mcp-server/dist/index.js"],
      "env": {
        "HUMANAPI_API_URL": "http://localhost:3000/api/mcp",
        "HUMANAPI_API_KEY": "your-api-key"
      }
    }
  }
}
```

## 可用工具

### search_humans
搜索可用的人类专家

**参数：**
- `skills?: string[]` - 技能标签数组
- `location?: { lat: number, lon: number }` - 地理位置坐标
- `max_distance?: number` - 最大距离（米），默认 10000
- `rate_min?: number` - 最低费率
- `rate_max?: number` - 最高费率
- `rating_min?: number` - 最低评分（0-5）
- `available_now?: boolean` - 仅显示当前可用

**返回：**
```json
{
  "success": true,
  "data": [
    {
      "id": "xxx",
      "name": "张三",
      "avatar": "https://...",
      "rating": 4.8,
      "totalReviews": 120,
      "skills": ["开会", "签名"],
      "hourlyRate": 50,
      "currency": "CNY",
      "available": true,
      "location": { "lat": 31.2304, "lon": 121.4737, "city": "上海" }
    }
  ],
  "count": 10
}
```

### get_human
获取人类专家详细信息

**参数：**
- `id: string` - 专家ID

**返回：**
```json
{
  "success": true,
  "data": {
    "id": "xxx",
    "name": "张三",
    "avatar": "https://...",
    "rating": 4.8,
    "totalReviews": 120,
    "bio": "专业商务服务...",
    "skills": [...],
    "hourlyRate": 50,
    "currency": "CNY",
    "available": true,
    "verified": true,
    "totalTasks": 456,
    "successRate": 99.1,
    "location": {...},
    "certifications": [...]
  }
}
```

### book_human
预订人类专家

**参数：**
- `human_id: string` - 专家ID
- `task_description: string` - 任务描述
- `task_location: { lat: number, lon: number, address?: string }` - 任务地点
- `scheduled_time: string` - 预约时间（ISO 8601）
- `estimated_duration: number` - 预计时长（分钟）
- `payment_amount: number` - 支付金额
- `payment_method?: string` - 支付方式
- `agent_id: string` - Agent 用户 ID

**返回：**
```json
{
  "success": true,
  "data": {
    "booking_id": "xxx",
    "task_id": "xxx",
    "human_id": "xxx",
    "agent_id": "xxx",
    "scheduled_time": "2026-02-24T10:00:00Z",
    "estimated_duration": 60,
    "payment_amount": 50,
    "currency": "CNY",
    "status": "PENDING",
    "human_name": "张三"
  }
}
```

### get_booking
获取预订状态

**参数：**
- `id: string` - 预订ID

**返回：**
```json
{
  "success": true,
  "data": {
    "id": "xxx",
    "task_id": "xxx",
    "status": "IN_PROGRESS",
    "payment_status": "PENDING",
    "scheduled_time": "2026-02-24T10:00:00Z",
    "estimated_duration": 60,
    "actual_duration": null,
    "payment_amount": 50,
    "currency": "CNY",
    "agent_name": "AI Agent",
    "human_name": "张三",
    "completion_proof": null,
    "started_at": "2026-02-24T10:00:00Z",
    "completed_at": null,
    "created_at": "2026-02-23T14:00:00Z"
  }
}
```

### update_booking
更新预订状态

**参数：**
- `id: string` - 预订ID
- `status: string` - 新状态（CONFIRMED/IN_PROGRESS/COMPLETED/CANCELLED）
- `proof?: string` - 完成证明（完成任务时提供）

**返回：**
```json
{
  "success": true,
  "data": {
    "id": "xxx",
    "status": "COMPLETED",
    "updated_at": "2026-02-24T11:00:00Z"
  }
}
```

### list_skills
列出所有可用技能

**参数：**
无

**返回：**
```json
{
  "success": true,
  "data": {
    "categories": [...],
    "skills": [
      {
        "id": "xxx",
        "name": "开会",
        "name_en": "In-Person Meetings",
        "name_zh": "开会",
        "category": "商务服务",
        "category_en": "Business Services",
        "category_zh": "商务服务",
        "description": "代表您出席现场会议..."
      }
    ],
    "total": 50
  }
}
```

## 使用示例

### 搜索附近的专家

```json
{
  "tool": "search_humans",
  "arguments": {
    "skills": ["开会", "签名"],
    "location": {
      "lat": 31.2304,
      "lon": 121.4737
    },
    "max_distance": 5000,
    "rating_min": 4.5
  }
}
```

### 预订专家

```json
{
  "tool": "book_human",
  "arguments": {
    "human_id": "xxx",
    "task_description": "需要有人代替我在上海分公司出席季度总结会议",
    "task_location": {
      "lat": 31.2304,
      "lon": 121.4737,
      "address": "上海市浦东新区世纪大道100号"
    },
    "scheduled_time": "2026-02-24T14:00:00Z",
    "estimated_duration": 120,
    "payment_amount": 100
  }
}
```

### 更新任务状态

```json
{
  "tool": "update_booking",
  "arguments": {
    "id": "xxx",
    "status": "COMPLETED",
    "proof": "会议已参加完毕，会议纪要已上传至公司系统"
  }
}
```

## 环境变量

- `HUMANAPI_API_URL` - API 端点 URL（默认 `http://localhost:3000/api/mcp`）
- `HUMANAPI_API_KEY` - API 密钥（必填，必须与服务端 `API_KEY` 相同）

## 错误处理

所有工具都返回标准响应格式：

**成功：**
```json
{
  "success": true,
  "data": {...}
}
```

**失败：**
```json
{
  "success": false,
  "error": "错误描述"
}
```

## 支持

如有问题，请联系：support@humanapi.com

---

**HumanAPI MCP Server v1.2.0**
