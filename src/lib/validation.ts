import { BookingStatus, TaskStatus } from '@prisma/client'
import { z } from 'zod'

export interface ValidationIssue {
  field: string
  message: string
}

export type ValidationResult<T> =
  | { success: true; data: T }
  | {
      success: false
      error: string
      details: ValidationIssue[]
    }

const idSchema = (field: string) =>
  z
    .string({
      required_error: `${field} is required`,
      invalid_type_error: `${field} must be a string`,
    })
    .trim()
    .min(1, `${field} is required`)
    .max(191, `${field} is too long`)

const queryNumber = (field: string, schema: z.ZodNumber) =>
  z.preprocess(
    (value) =>
      typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : value,
    schema.refine(Number.isFinite, `${field} must be a finite number`)
  )

const finiteNumber = (field: string) =>
  z
    .number({
      required_error: `${field} is required`,
      invalid_type_error: `${field} must be a number`,
    })
    .finite(`${field} must be a finite number`)

const pageSchema = queryNumber(
  'page',
  z
    .number({ invalid_type_error: 'page must be an integer' })
    .int('page must be an integer')
    .safe('page must be a safe integer')
)
  .transform((page) => Math.max(1, page))
  .default(1)

const limitSchema = queryNumber(
  'limit',
  z
    .number({ invalid_type_error: 'limit must be an integer' })
    .int('limit must be an integer')
    .safe('limit must be a safe integer')
)
  .transform((limit) => Math.min(100, Math.max(1, limit)))
  .default(20)

const paginationShape = {
  page: pageSchema,
  limit: limitSchema,
}

const optionalQueryId = (field: string) => idSchema(field).optional()

const taskStatusValues = Object.values(TaskStatus).join(', ')
const bookingStatusValues = Object.values(BookingStatus).join(', ')

export const tasksQuerySchema = z.object({
  status: z
    .nativeEnum(TaskStatus, {
      errorMap: () => ({
        message: `status must be one of: ${taskStatusValues}`,
      }),
    })
    .optional(),
  agentId: optionalQueryId('agentId'),
  humanId: optionalQueryId('humanId'),
  ...paginationShape,
})

export const bookingsQuerySchema = z.object({
  status: z
    .nativeEnum(BookingStatus, {
      errorMap: () => ({
        message: `status must be one of: ${bookingStatusValues}`,
      }),
    })
    .optional(),
  agentId: optionalQueryId('agentId'),
  humanId: optionalQueryId('humanId'),
  ...paginationShape,
})

const latitudeQuerySchema = queryNumber(
  'lat',
  z
    .number({ invalid_type_error: 'lat must be a number' })
    .min(-90, 'lat must be between -90 and 90')
    .max(90, 'lat must be between -90 and 90')
)

const longitudeQuerySchema = queryNumber(
  'lon',
  z
    .number({ invalid_type_error: 'lon must be a number' })
    .min(-180, 'lon must be between -180 and 180')
    .max(180, 'lon must be between -180 and 180')
)

export const humansQuerySchema = z
  .object({
    skills: z
      .string()
      .trim()
      .min(1, 'skills must include at least one skill')
      .transform((skills) =>
        skills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean)
      )
      .refine((skills) => skills.length > 0, {
        message: 'skills must include at least one skill',
      })
      .optional(),
    lat: latitudeQuerySchema.optional(),
    lon: longitudeQuerySchema.optional(),
    maxDistance: queryNumber(
      'maxDistance',
      z
        .number({ invalid_type_error: 'maxDistance must be a number' })
        .positive('maxDistance must be greater than 0')
    ).default(10_000),
    rateMin: queryNumber(
      'rateMin',
      z
        .number({ invalid_type_error: 'rateMin must be a number' })
        .nonnegative('rateMin must be at least 0')
    ).default(0),
    rateMax: queryNumber(
      'rateMax',
      z
        .number({ invalid_type_error: 'rateMax must be a number' })
        .nonnegative('rateMax must be at least 0')
    ).default(999_999),
    ratingMin: queryNumber(
      'ratingMin',
      z
        .number({ invalid_type_error: 'ratingMin must be a number' })
        .min(0, 'ratingMin must be between 0 and 5')
        .max(5, 'ratingMin must be between 0 and 5')
    ).default(0),
    availableNow: z
      .enum(['true', 'false'], {
        errorMap: () => ({
          message: 'availableNow must be either true or false',
        }),
      })
      .transform((value) => value === 'true')
      .default('true'),
  })
  .superRefine((query, context) => {
    if ((query.lat === undefined) !== (query.lon === undefined)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: query.lat === undefined ? ['lat'] : ['lon'],
        message: 'lat and lon must be provided together',
      })
    }

    if (query.rateMin > query.rateMax) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rateMax'],
        message: 'rateMax must be greater than or equal to rateMin',
      })
    }
  })

const optionalLocationText = (field: string) =>
  z
    .string({ invalid_type_error: `${field} must be a string` })
    .trim()
    .min(1, `${field} cannot be empty`)
    .max(500, `${field} is too long`)
    .optional()

export const locationSchema = z
  .object({
    lat: finiteNumber('location.lat')
      .min(-90, 'location.lat must be between -90 and 90')
      .max(90, 'location.lat must be between -90 and 90'),
    lon: finiteNumber('location.lon')
      .min(-180, 'location.lon must be between -180 and 180')
      .max(180, 'location.lon must be between -180 and 180'),
    address: optionalLocationText('location.address'),
    city: optionalLocationText('location.city'),
    country: optionalLocationText('location.country'),
  })
  .strict()

const humanSkillInputSchema = z
  .object({
    name: z
      .string({
        required_error: 'skills[].name is required',
        invalid_type_error: 'skills[].name must be a string',
      })
      .trim()
      .min(1, 'skills[].name cannot be empty')
      .max(100, 'skills[].name is too long'),
    verified: z.boolean().optional(),
  })
  .strict()

const storedHumanSkillSchema = humanSkillInputSchema.extend({
  verified: z.boolean(),
})

const taskSkillSchema = z
  .string({ invalid_type_error: 'skills must contain only strings' })
  .trim()
  .min(1, 'skills cannot contain empty values')
  .max(100, 'skill names cannot exceed 100 characters')

const currencySchema = z
  .string({ invalid_type_error: 'currency must be a string' })
  .trim()
  .min(1, 'currency cannot be empty')
  .max(10, 'currency cannot exceed 10 characters')
  .default('CNY')

const scheduledTimeSchema = z
  .string({
    required_error: 'scheduledTime is required',
    invalid_type_error: 'scheduledTime must be an ISO 8601 string',
  })
  .datetime({
    offset: true,
    message: 'scheduledTime must be a valid ISO 8601 date-time',
  })
  .transform((value) => new Date(value))

const estimatedDurationSchema = finiteNumber('estimatedDuration')
  .int('estimatedDuration must be an integer')
  .positive('estimatedDuration must be greater than 0')

const paymentAmountSchema = finiteNumber('paymentAmount').positive(
  'paymentAmount must be greater than 0'
)

export const createHumanSchema = z
  .object({
    userId: idSchema('userId'),
    bio: z
      .string({ invalid_type_error: 'bio must be a string' })
      .trim()
      .max(5_000, 'bio cannot exceed 5000 characters')
      .nullable()
      .optional(),
    location: locationSchema,
    skills: z
      .array(humanSkillInputSchema, {
        required_error: 'skills is required',
        invalid_type_error: 'skills must be an array',
      })
      .max(100, 'skills cannot contain more than 100 entries')
      .transform((skills) => skills.map(({ name }) => ({ name, verified: false }))),
    hourlyRate: finiteNumber('hourlyRate').nonnegative(
      'hourlyRate must be at least 0'
    ),
    currency: currencySchema,
  })
  .strict()

export const createTaskSchema = z
  .object({
    agentId: idSchema('agentId'),
    title: z
      .string({
        required_error: 'title is required',
        invalid_type_error: 'title must be a string',
      })
      .trim()
      .min(1, 'title is required')
      .max(200, 'title cannot exceed 200 characters'),
    description: z
      .string({
        required_error: 'description is required',
        invalid_type_error: 'description must be a string',
      })
      .trim()
      .min(1, 'description is required')
      .max(20_000, 'description cannot exceed 20000 characters'),
    skills: z
      .array(taskSkillSchema, {
        required_error: 'skills is required',
        invalid_type_error: 'skills must be an array',
      })
      .max(100, 'skills cannot contain more than 100 entries'),
    location: locationSchema,
    scheduledTime: scheduledTimeSchema.nullable().optional(),
    estimatedDuration: estimatedDurationSchema,
    paymentAmount: paymentAmountSchema,
    currency: currencySchema,
    priority: finiteNumber('priority')
      .int('priority must be an integer')
      .min(1, 'priority must be between 1 and 10')
      .max(10, 'priority must be between 1 and 10')
      .default(5),
  })
  .strict()

export const createBookingSchema = z
  .object({
    taskId: idSchema('taskId'),
    humanId: idSchema('humanId'),
    scheduledTime: scheduledTimeSchema,
    estimatedDuration: estimatedDurationSchema,
  })
  .strict()

export const updateTaskSchema = createTaskSchema
  .omit({ agentId: true })
  .partial()
  .strict()

export const updateHumanSchema = createHumanSchema
  .omit({ userId: true })
  .partial()
  .strict()

export const updateBookingSchema = z
  .object({
    scheduledTime: scheduledTimeSchema.optional(),
    estimatedDuration: estimatedDurationSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required')

/**
 * Prisma JSON fields are untrusted at runtime. Invalid entries are ignored
 * instead of being cast to an assumed shape and crashing collection filters.
 */
export function parseSkillJson(
  value: unknown
): z.infer<typeof storedHumanSkillSchema>[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((entry) => {
    const parsed = storedHumanSkillSchema.safeParse(entry)
    return parsed.success ? [parsed.data] : []
  })
}

export function parseSearchParams<TSchema extends z.ZodTypeAny>(
  searchParams: URLSearchParams,
  schema: TSchema
): ValidationResult<z.output<TSchema>> {
  const parsed = schema.safeParse(Object.fromEntries(searchParams.entries()))

  if (!parsed.success) {
    return {
      success: false,
      error: 'Invalid query parameters',
      details: formatValidationIssues(parsed.error),
    }
  }

  return { success: true, data: parsed.data }
}

export async function parseJsonBody<TSchema extends z.ZodTypeAny>(
  request: { json(): Promise<unknown> },
  schema: TSchema
): Promise<ValidationResult<z.output<TSchema>>> {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return {
      success: false,
      error: 'Request body must be valid JSON',
      details: [
        {
          field: 'body',
          message: 'Request body must be valid JSON',
        },
      ],
    }
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Invalid request body',
      details: formatValidationIssues(parsed.error),
    }
  }

  return { success: true, data: parsed.data }
}

export function formatValidationIssues(error: z.ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join('.') : 'body',
    message: issue.message,
  }))
}
