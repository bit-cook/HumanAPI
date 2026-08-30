export const DEFAULT_HUMANAPI_API_URL = 'http://localhost:3000/api/mcp'
export const DEFAULT_REQUEST_TIMEOUT_MS = 15_000

export type FetchImplementation = (
  input: string,
  init: RequestInit
) => Promise<Response>

export interface HumanApiClientOptions {
  apiUrl?: string
  apiKey?: string
  timeoutMs?: number
  fetchImplementation?: FetchImplementation
}

export class HumanApiRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly responseBody?: unknown
  ) {
    super(message)
    this.name = 'HumanApiRequestError'
  }
}

function parseResponseBody(text: string): unknown {
  if (!text) return null

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

function getApiErrorMessage(body: unknown): string | undefined {
  if (
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    typeof body.error === 'string'
  ) {
    return body.error
  }
  return undefined
}

/** Call the HumanAPI HTTP bridge with timeout and normalized errors. */
export async function callHumanApi(
  tool: string,
  toolArguments: Record<string, unknown>,
  options: HumanApiClientOptions = {}
): Promise<unknown> {
  const apiUrl = options.apiUrl ?? process.env.HUMANAPI_API_URL ?? DEFAULT_HUMANAPI_API_URL
  const apiKey = options.apiKey ?? process.env.HUMANAPI_API_KEY
  const timeoutMs = options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS
  const fetchImplementation = options.fetchImplementation ?? fetch

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new HumanApiRequestError('Request timeout must be a positive number')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetchImplementation(apiUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({ tool, arguments: toolArguments }),
      signal: controller.signal,
    })
    const body = parseResponseBody(await response.text())

    if (!response.ok) {
      const apiMessage = getApiErrorMessage(body)
      throw new HumanApiRequestError(
        apiMessage
          ? `HumanAPI request failed (${response.status}): ${apiMessage}`
          : `HumanAPI request failed with HTTP ${response.status}`,
        response.status,
        body
      )
    }

    return body
  } catch (error) {
    if (error instanceof HumanApiRequestError) throw error
    if (controller.signal.aborted) {
      throw new HumanApiRequestError(`HumanAPI request timed out after ${timeoutMs}ms`)
    }

    const message = error instanceof Error ? error.message : 'Unknown network error'
    throw new HumanApiRequestError(`Unable to reach HumanAPI: ${message}`)
  } finally {
    clearTimeout(timeout)
  }
}
