export interface User {
  id: string
  email: string
  phone?: string
  name: string
  avatar?: string
  role: 'AGENT' | 'HUMAN' | 'ADMIN'
  verified: boolean
  rating: number
  totalReviews: number
  createdAt: Date
  updatedAt: Date
}

export interface HumanProfile {
  id: string
  userId: string
  bio?: string
  location: {
    lat: number
    lon: number
    city?: string
    country?: string
    address?: string
  }
  skills: Skill[]
  hourlyRate: number
  currency: string
  available: boolean
  verified: boolean
  totalTasks: number
  successRate: number
  createdAt: Date
  updatedAt: Date
  user?: User
  wallets?: Wallet[]
  certifications?: Certification[]
}

export interface Skill {
  name: string
  verified: boolean
}

export interface Wallet {
  id: string
  type: 'STRIPE_CONNECT' | 'CRYPTO'
  address: string
  network?: string
  confirmed: boolean
}

export interface Certification {
  id: string
  name: string
  issuer?: string
  documentUrl?: string
  verified: boolean
  verifiedAt?: Date
}

export interface Task {
  id: string
  agentId: string
  humanId?: string
  title: string
  description: string
  skills: string[]
  location: {
    lat: number
    lon: number
    address?: string
  }
  scheduledTime?: Date
  estimatedDuration: number
  paymentAmount: number
  currency: string
  status: 'DRAFT' | 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  priority: number
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  agent?: User
  human?: User
  booking?: Booking
}

export interface Booking {
  id: string
  taskId: string
  agentId: string
  humanId: string
  scheduledTime: Date
  estimatedDuration: number
  actualDuration?: number
  paymentAmount: number
  paymentStatus: 'PENDING' | 'PROCESSING' | 'PAID' | 'REJECTED' | 'REFUNDED' | 'PARTIALLY_REFUNDED'
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED'
  completionProof?: string
  agentRating?: number
  humanRating?: number
  stripePaymentIntentId?: string
  createdAt: Date
  updatedAt: Date
  startedAt?: Date
  completedAt?: Date
  task?: Task
  agent?: User
  human?: User
  messages?: Message[]
  reviews?: Review[]
}

export interface Message {
  id: string
  bookingId: string
  senderId: string
  recipientId: string
  content: string
  attachments?: string[]
  read: boolean
  createdAt: Date
  sender?: User
  recipient?: User
}

export interface Review {
  id: string
  bookingId: string
  reviewerId: string
  revieweeId: string
  rating: number
  comment?: string
  createdAt: Date
  reviewer?: User
  reviewee?: User
}

export interface Dispute {
  id: string
  bookingId: string
  reporterId: string
  reason: string
  description: string
  evidence?: string[]
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'REJECTED'
  aiResolution?: string
  humanResolution?: string
  resolvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface MatchScore {
  skillMatch: number
  locationMatch: number
  ratingMatch: number
  availabilityMatch: number
  priceMatch: number
  totalScore: number
}

export interface SearchHumansParams {
  skills?: string[]
  location?: {
    lat: number
    lon: number
  }
  maxDistance?: number
  rateMin?: number
  rateMax?: number
  ratingMin?: number
  availableNow?: boolean
}

export interface CreateTaskParams {
  agentId: string
  title: string
  description: string
  skills: string[]
  location: {
    lat: number
    lon: number
    address?: string
  }
  scheduledTime?: string
  estimatedDuration: number
  paymentAmount: number
  currency?: string
  priority?: number
}