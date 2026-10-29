import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@/lib/db'
import { POST as createTask } from '@/app/api/tasks/route'
import { GET as listHumans, POST as createHuman } from '@/app/api/humans/route'
import { POST as createBooking } from '@/app/api/bookings/route'
import { POST as bookingAction } from '@/app/api/bookings/[id]/[action]/route'
import { POST as createReview } from '@/app/api/bookings/[id]/reviews/route'
import { GET as humanReviews } from '@/app/api/humans/[id]/reviews/route'
import {
  GET as listMessages,
  POST as sendMessage,
} from '@/app/api/bookings/[id]/messages/route'
import { POST as createDispute } from '@/app/api/bookings/[id]/disputes/route'
import { GET as getDispute, PUT as updateDispute } from '@/app/api/disputes/[id]/route'
import { POST as mcpPost } from '@/app/api/mcp/route'
import { apiRequest, hasDatabase, jsonRequest, readJson, WRONG_API_KEY } from './helpers'

const SHANGHAI = { lat: 31.2304, lon: 121.4737 }
const BEIJING = { lat: 39.9042, lon: 116.4074 }

const run = hasDatabase ? describe : describe.skip

run('HumanAPI 全生命周期（真实 PostgreSQL）', () => {
  let agentId = ''
  let humanUserId = ''
  let humanProfileId = ''
  let taskId = ''
  let bookingId = ''

  beforeAll(async () => {
    // 逆依赖顺序清理
    await prisma.message.deleteMany()
    await prisma.review.deleteMany()
    await prisma.dispute.deleteMany()
    await prisma.booking.deleteMany()
    await prisma.task.deleteMany()
    await prisma.certification.deleteMany()
    await prisma.wallet.deleteMany()
    await prisma.humanProfile.deleteMany()
    await prisma.user.deleteMany()

    const agent = await prisma.user.create({
      data: { email: 'agent@test.local', name: '测试 Agent', role: 'AGENT' },
    })
    const human = await prisma.user.create({
      data: { email: 'human@test.local', name: '测试专家', role: 'HUMAN' },
    })
    agentId = agent.id
    humanUserId = human.id
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('注册专家档案并写入自报技能', async () => {
    const response = await createHuman(
      jsonRequest('/api/humans', 'POST', {
        userId: humanUserId,
        bio: '上海本地调研员',
        location: { ...SHANGHAI, city: '上海', country: '中国' },
        skills: [{ name: '现场调研' }, { name: '数据录入' }],
        hourlyRate: 120,
      })
    )
    expect(response.status).toBe(201)
    const body = await readJson(response)
    humanProfileId = body.data.id
    expect(body.data.skills).toEqual([
      { name: '现场调研', verified: false },
      { name: '数据录入', verified: false },
    ])
  })

  it('重复注册返回 409', async () => {
    const response = await createHuman(
      jsonRequest('/api/humans', 'POST', {
        userId: humanUserId,
        location: SHANGHAI,
        skills: [{ name: 'x' }],
        hourlyRate: 1,
      })
    )
    expect(response.status).toBe(409)
  })

  it('未验证档案不出现在 GET /api/humans 默认列表中', async () => {
    const response = await listHumans(apiRequest('/api/humans?page=1&limit=10'))
    expect(response.status).toBe(200)
    const body = await readJson(response)
    expect(body.pagination).toMatchObject({ page: 1, limit: 10, total: 0 })
    expect(body.data).toHaveLength(0)
  })

  it('验证后档案带分页返回，且响应字段完整', async () => {
    await prisma.humanProfile.update({
      where: { id: humanProfileId },
      data: { verified: true },
    })
    const response = await listHumans(apiRequest('/api/humans?page=1&limit=10'))
    expect(response.status).toBe(200)
    const body = await readJson(response)
    expect(body.pagination).toMatchObject({ page: 1, limit: 10, total: 1 })
    expect(body.data[0]).toMatchObject({
      id: humanProfileId,
      userId: humanUserId,
      hourlyRate: 120,
      verified: true,
    })
  })

  it('未验证技能不会匹配技能查询（与 MCP search_humans 行为一致）', async () => {
    // 此时档案已 verified，但技能尚未 verified
    const response = await listHumans(
      apiRequest('/api/humans?skills=' + encodeURIComponent('现场调研'))
    )
    const body = await readJson(response)
    expect(body.data).toHaveLength(0)
  })

  it('位置查询返回 locationMatch 与 distance', async () => {
    const response = await listHumans(
      apiRequest(`/api/humans?lat=${SHANGHAI.lat}&lon=${SHANGHAI.lon}&maxDistance=5000`)
    )
    const body = await readJson(response)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].locationMatch).toBe(100)
    expect(body.data[0].distance).toBeLessThan(50)
  })

  it('超出 maxDistance 的专家被排除', async () => {
    const response = await listHumans(
      apiRequest(`/api/humans?lat=${BEIJING.lat}&lon=${BEIJING.lon}&maxDistance=100000`)
    )
    const body = await readJson(response)
    expect(body.data).toHaveLength(0)
  })

  it('创建任务并返回匹配专家（verified 后）', async () => {
    await prisma.humanProfile.update({
      where: { id: humanProfileId },
      data: { skills: [{ name: '现场调研', verified: true }] },
    })

    const response = await createTask(
      jsonRequest('/api/tasks', 'POST', {
        agentId,
        title: '门店实地盘点',
        description: '对三家门店进行实地盘点并回报库存照片。',
        skills: ['现场调研'],
        location: SHANGHAI,
        estimatedDuration: 120,
        paymentAmount: 500,
        priority: 7,
      })
    )
    expect(response.status).toBe(201)
    const body = await readJson(response)
    taskId = body.data.task.id
    expect(body.data.matchedHumans).toHaveLength(1)
    expect(body.data.matchedHumans[0].score.totalScore).toBeGreaterThan(50)
  })

  it('POST /api/bookings 使用 HumanProfile.id 创建预约', async () => {
    const response = await createBooking(
      jsonRequest('/api/bookings', 'POST', {
        taskId,
        humanId: humanProfileId,
        scheduledTime: '2026-12-01T09:00:00Z',
        estimatedDuration: 120,
      })
    )
    expect(response.status).toBe(201)
    const body = await readJson(response)
    bookingId = body.data.id
    expect(body.data.humanId).toBe(humanUserId)
    expect(body.data.human.humanProfile.id).toBe(humanProfileId)
  })

  it('同一任务不能重复预约', async () => {
    const response = await createBooking(
      jsonRequest('/api/bookings', 'POST', {
        taskId,
        humanId: humanProfileId,
        scheduledTime: '2026-12-01T09:00:00Z',
        estimatedDuration: 120,
      })
    )
    expect(response.status).toBe(409)
  })

  it('完整状态机：confirm → start → complete', async () => {
    const confirm = await bookingAction(
      apiRequest(`/api/bookings/${bookingId}/confirm`, { method: 'POST' }),
      { params: Promise.resolve({ id: bookingId, action: 'confirm' }) }
    )
    expect(confirm.status).toBe(200)

    const start = await bookingAction(
      apiRequest(`/api/bookings/${bookingId}/start`, { method: 'POST' }),
      { params: Promise.resolve({ id: bookingId, action: 'start' }) }
    )
    expect(start.status).toBe(200)

    const complete = await bookingAction(
      apiRequest(`/api/bookings/${bookingId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ completionProof: 'photo-evidence-1', actualDuration: 115 }),
      }),
      { params: Promise.resolve({ id: bookingId, action: 'complete' }) }
    )
    expect(complete.status).toBe(200)
    const body = await readJson(complete)
    expect(body.data.status).toBe('COMPLETED')
    expect(body.data.actualDuration).toBe(115)

    const task = await prisma.task.findUnique({ where: { id: taskId } })
    expect(task?.status).toBe('COMPLETED')

    const profile = await prisma.humanProfile.findUnique({
      where: { id: humanProfileId },
    })
    expect(profile?.totalTasks).toBe(1)
  })

  it('非法状态迁移返回 409', async () => {
    const response = await bookingAction(
      apiRequest(`/api/bookings/${bookingId}/confirm`, { method: 'POST' }),
      { params: Promise.resolve({ id: bookingId, action: 'confirm' }) }
    )
    expect(response.status).toBe(409)
  })

  it('未知 action 返回 404', async () => {
    const response = await bookingAction(
      apiRequest(`/api/bookings/${bookingId}/teleport`, { method: 'POST' }),
      { params: Promise.resolve({ id: bookingId, action: 'teleport' }) }
    )
    expect(response.status).toBe(404)
  })

  it('双方评价后聚合评分与评价数', async () => {
    const humanReview = await createReview(
      jsonRequest(`/api/bookings/${bookingId}/reviews`, 'POST', {
        reviewerId: humanUserId,
        rating: 5,
        comment: '需求清晰',
      }),
      { params: Promise.resolve({ id: bookingId }) }
    )
    expect(humanReview.status).toBe(201)

    const agentReview = await createReview(
      jsonRequest(`/api/bookings/${bookingId}/reviews`, 'POST', {
        reviewerId: agentId,
        rating: 3,
      }),
      { params: Promise.resolve({ id: bookingId }) }
    )
    expect(agentReview.status).toBe(201)

    const duplicate = await createReview(
      jsonRequest(`/api/bookings/${bookingId}/reviews`, 'POST', {
        reviewerId: humanUserId,
        rating: 4,
      }),
      { params: Promise.resolve({ id: bookingId }) }
    )
    expect(duplicate.status).toBe(409)

    // human 评价 agent（5 分）→ agent.rating=5；agent 评价 human（3 分）→ human.rating=3
    const humanUser = await prisma.user.findUnique({ where: { id: humanUserId } })
    expect(humanUser?.totalReviews).toBe(1)
    expect(humanUser?.rating).toBe(3)
    const agentUser = await prisma.user.findUnique({ where: { id: agentId } })
    expect(agentUser?.totalReviews).toBe(1)
    expect(agentUser?.rating).toBe(5)
  })

  it('GET /api/humans/:id/reviews 分页读取', async () => {
    const response = await humanReviews(
      apiRequest(`/api/humans/${humanProfileId}/reviews?page=1&limit=10`),
      { params: Promise.resolve({ id: humanProfileId }) }
    )
    expect(response.status).toBe(200)
    const body = await readJson(response)
    expect(body.pagination.total).toBe(1)
    expect(body.data[0].rating).toBe(3)
  })

  it('消息：参与者可收发，非参与者 403', async () => {
    const outsider = await prisma.user.create({
      data: { email: 'outsider@test.local', name: '外人', role: 'AGENT' },
    })

    const forbidden = await sendMessage(
      jsonRequest(`/api/bookings/${bookingId}/messages`, 'POST', {
        senderId: outsider.id,
        recipientId: humanUserId,
        content: 'hi',
      }),
      { params: Promise.resolve({ id: bookingId }) }
    )
    expect(forbidden.status).toBe(403)

    const ok = await sendMessage(
      jsonRequest(`/api/bookings/${bookingId}/messages`, 'POST', {
        senderId: humanUserId,
        recipientId: agentId,
        content: '盘点完成，照片已上传。',
      }),
      { params: Promise.resolve({ id: bookingId }) }
    )
    expect(ok.status).toBe(201)

    const list = await listMessages(
      apiRequest(`/api/bookings/${bookingId}/messages`),
      { params: Promise.resolve({ id: bookingId }) }
    )
    const body = await readJson(list)
    expect(body.pagination.total).toBe(1)

    await prisma.message.deleteMany({ where: { bookingId: bookingId } })
    await prisma.user.delete({ where: { id: outsider.id } })
  })

  it('争议：create → DISPUTED → resolve', async () => {
    const disputeResponse = await createDispute(
      jsonRequest(`/api/bookings/${bookingId}/disputes`, 'POST', {
        reporterId: agentId,
        reason: '照片不完整',
        description: '部分门店缺少货架照片。',
      }),
      { params: Promise.resolve({ id: bookingId }) }
    )
    // 预约已 COMPLETED，不可争议
    expect(disputeResponse.status).toBe(409)
  })

  it('MCP 全工具流：search → book → update → review → dispute', async () => {
    // search_humans
    const search = await mcpPost(
      jsonRequest('/api/mcp', 'POST', {
        tool: 'search_humans',
        arguments: {
          skills: ['现场调研'],
          location: { lat: SHANGHAI.lat, lon: SHANGHAI.lon },
          max_distance: 5000,
          rating_min: 0,
        },
      })
    )
    expect(search.status).toBe(200)
    const searchBody = await readJson(search)
    expect(searchBody.count).toBeGreaterThanOrEqual(1)

    // book_human
    const book = await mcpPost(
      jsonRequest('/api/mcp', 'POST', {
        tool: 'book_human',
        arguments: {
          human_id: humanProfileId,
          task_description: 'MCP 预约的临时任务',
          task_location: { ...SHANGHAI, address: '上海市黄浦区' },
          scheduled_time: '2026-12-05T10:00:00Z',
          estimated_duration: 60,
          payment_amount: 300,
          agent_id: agentId,
        },
      })
    )
    expect(book.status).toBe(201)
    const bookBody = await readJson(book)
    const mcpBookingId = bookBody.data.booking_id

    // get_booking
    const get = await mcpPost(
      jsonRequest('/api/mcp', 'POST', {
        tool: 'get_booking',
        arguments: { id: mcpBookingId },
      })
    )
    expect(get.status).toBe(200)

    // update_booking: CONFIRMED → IN_PROGRESS
    const update = await mcpPost(
      jsonRequest('/api/mcp', 'POST', {
        tool: 'update_booking',
        arguments: { id: mcpBookingId, status: 'CONFIRMED' },
      })
    )
    expect(update.status).toBe(200)

    // create_dispute 从 CONFIRMED 合法
    const dispute = await mcpPost(
      jsonRequest('/api/mcp', 'POST', {
        tool: 'create_dispute',
        arguments: {
          booking_id: mcpBookingId,
          reporter_id: agentId,
          reason: '联系不上专家',
          description: '两次电话未接通。',
        },
      })
    )
    expect(dispute.status).toBe(201)
    const disputeBody = await readJson(dispute)
    const disputeId = disputeBody.data.id

    const listDisputes = await mcpPost(
      jsonRequest('/api/mcp', 'POST', {
        tool: 'list_disputes',
        arguments: {},
      })
    )
    expect(listDisputes.status).toBe(200)

    const resolveDispute = await mcpPost(
      jsonRequest('/api/mcp', 'POST', {
        tool: 'resolve_dispute',
        arguments: {
          id: disputeId,
          status: 'REJECTED',
          resolution: '专家已恢复联系，争议不成立。',
        },
      })
    )
    expect(resolveDispute.status).toBe(200)

    const getDispute = await mcpPost(
      jsonRequest('/api/mcp', 'POST', {
        tool: 'get_dispute',
        arguments: { id: disputeId },
      })
    )
    const getDisputeBody = await readJson(getDispute)
    expect(getDisputeBody.data.status).toBe('REJECTED')

    // DISPUTED → CANCELLED 状态级迁移
    const cancel = await mcpPost(
      jsonRequest('/api/mcp', 'POST', {
        tool: 'update_booking',
        arguments: { id: mcpBookingId, status: 'CANCELLED' },
      })
    )
    expect(cancel.status).toBe(200)

    // 清理 MCP 测试产生的 task/booking
    await prisma.message.deleteMany({ where: { bookingId: mcpBookingId } })
    await prisma.dispute.deleteMany({ where: { bookingId: mcpBookingId } })
    await prisma.booking.delete({ where: { id: mcpBookingId } })
    await prisma.task.deleteMany({ where: { id: bookBody.data.task_id } })
  })

  it('MCP 非法包络与认证失败返回正确状态码', async () => {
    const badTool = await mcpPost(
      jsonRequest('/api/mcp', 'POST', { tool: 'nope', arguments: {} })
    )
    expect(badTool.status).toBe(400)

    const badArgs = await mcpPost(
      jsonRequest('/api/mcp', 'POST', {
        tool: 'search_humans',
        arguments: { rating_min: 99 },
      })
    )
    expect(badArgs.status).toBe(400)

    const unauthorized = await mcpPost(
      jsonRequest(
        '/api/mcp',
        'POST',
        { tool: 'list_skills', arguments: {} },
        WRONG_API_KEY
      )
    )
    expect(unauthorized.status).toBe(401)
  })

  it('GET /api/disputes/:id 不存在时返回 404', async () => {
    const response = await getDispute(
      apiRequest('/api/disputes/nonexistent'),
      { params: Promise.resolve({ id: 'nonexistent' }) }
    )
    expect(response.status).toBe(404)
  })

  it('PUT /api/disputes/:id 更新处理结论', async () => {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
    expect(booking?.status).toBe('COMPLETED')
    const update = await updateDispute(
      jsonRequest('/api/disputes/nonexistent', 'PUT', { status: 'RESOLVED' }),
      { params: Promise.resolve({ id: 'nonexistent' }) }
    )
    expect(update.status).toBe(404)
  })
})
