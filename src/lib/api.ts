import { ApiResponse, HumanProfile, SearchHumansParams } from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || 'API request failed')
  }
  return data
}

async function get<T>(endpoint: string): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  return handleResponse<T>(response)
}

async function post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return handleResponse<T>(response)
}

async function put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return handleResponse<T>(response)
}

async function del<T>(endpoint: string): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  return handleResponse<T>(response)
}

// 人类专家 API
export const humansApi = {
  list: (params?: SearchHumansParams) => {
    const searchParams = new URLSearchParams()
    if (params?.skills) searchParams.set('skills', params.skills.join(','))
    if (params?.location) {
      searchParams.set('lat', params.location.lat.toString())
      searchParams.set('lon', params.location.lon.toString())
    }
    if (params?.maxDistance) searchParams.set('maxDistance', params.maxDistance.toString())
    if (params?.rateMin) searchParams.set('rateMin', params.rateMin.toString())
    if (params?.rateMax) searchParams.set('rateMax', params.rateMax.toString())
    if (params?.ratingMin) searchParams.set('ratingMin', params.ratingMin.toString())
    if (params?.availableNow !== undefined) searchParams.set('availableNow', params.availableNow.toString())

    return get<HumanProfile[]>(`/humans?${searchParams}`)
  },

  get: (id: string) => get<HumanProfile>(`/humans/${id}`),

  create: (data: Partial<HumanProfile>) => post<HumanProfile>('/humans', data),

  update: (id: string, data: Partial<HumanProfile>) => put<HumanProfile>(`/humans/${id}`, data),
}

// 任务 API
export const tasksApi = {
  list: (params?: { status?: string; agentId?: string; humanId?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.agentId) searchParams.set('agentId', params.agentId)
    if (params?.humanId) searchParams.set('humanId', params.humanId)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    return get(`/tasks?${searchParams}`)
  },

  get: (id: string) => get(`/tasks/${id}`),

  create: (data: any) => post('/tasks', data),

  update: (id: string, data: any) => put(`/tasks/${id}`, data),

  delete: (id: string) => del(`/tasks/${id}`),
}

// 预订 API
export const bookingsApi = {
  list: (params?: { agentId?: string; humanId?: string; status?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.agentId) searchParams.set('agentId', params.agentId)
    if (params?.humanId) searchParams.set('humanId', params.humanId)
    if (params?.status) searchParams.set('status', params.status)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    return get(`/bookings?${searchParams}`)
  },

  get: (id: string) => get(`/bookings/${id}`),

  create: (data: any) => post('/bookings', data),

  update: (id: string, data: any) => put(`/bookings/${id}`, data),

  confirm: (id: string) => post(`/bookings/${id}/confirm`),

  start: (id: string) => post(`/bookings/${id}/start`),

  complete: (id: string, data: { completionProof?: string; actualDuration?: number }) => post(`/bookings/${id}/complete`, data),

  cancel: (id: string) => post(`/bookings/${id}/cancel`),
}

// MCP API
export const mcpApi = {
  searchHumans: (params: any) => post('/mcp/search_humans', params),

  getHuman: (id: string) => post('/mcp/get_human', { id }),

  bookHuman: (params: any) => post('/mcp/book_human', params),

  getBooking: (id: string) => post('/mcp/get_booking', { id }),

  updateBooking: (params: any) => post('/mcp/update_booking', params),

  listSkills: () => post('/mcp/list_skills', {}),

  getServerInfo: () => get('/mcp'),
}