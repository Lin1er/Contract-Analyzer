// Error handling utilities for ClearContract

export type ErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'SERVER_ERROR'
  | 'RATE_LIMIT'
  | 'INVALID_FILE'
  | 'FILE_TOO_LARGE'
  | 'EXTRACTION_FAILED'
  | 'ANALYSIS_FAILED'
  | 'TEXT_TOO_SHORT'
  | 'API_KEY_ERROR'
  | 'SAFETY_FILTER'
  | 'UNKNOWN_ERROR';

export interface AppError {
  code: ErrorCode;
  message: string;
  retryable: boolean;
  statusCode?: number;
}

// Map HTTP status codes and error messages to AppError
export function parseError(error: unknown, statusCode?: number): AppError {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      code: 'NETWORK_ERROR',
      message: 'networkError',
      retryable: true,
    };
  }

  // Timeout errors
  if (error instanceof DOMException && error.name === 'AbortError') {
    return {
      code: 'TIMEOUT_ERROR',
      message: 'timeoutError',
      retryable: true,
    };
  }

  const errorMessage = error instanceof Error ? error.message : String(error);

  // API key errors
  if (errorMessage.includes('API_KEY') || errorMessage.includes('api key')) {
    return {
      code: 'API_KEY_ERROR',
      message: 'apiKeyError',
      retryable: false,
      statusCode: 500,
    };
  }

  // Rate limit errors
  if (errorMessage.includes('RATE_LIMIT') || errorMessage.includes('quota') || statusCode === 429) {
    return {
      code: 'RATE_LIMIT',
      message: 'rateLimitError',
      retryable: true,
      statusCode: 429,
    };
  }

  // Safety filter errors
  if (errorMessage.includes('SAFETY')) {
    return {
      code: 'SAFETY_FILTER',
      message: 'safetyFilterError',
      retryable: false,
      statusCode: 400,
    };
  }

  // Based on status code
  if (statusCode) {
    if (statusCode >= 500) {
      return {
        code: 'SERVER_ERROR',
        message: 'serverError',
        retryable: true,
        statusCode,
      };
    }
    if (statusCode === 429) {
      return {
        code: 'RATE_LIMIT',
        message: 'rateLimitError',
        retryable: true,
        statusCode,
      };
    }
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: errorMessage || 'unknownError',
    retryable: false,
    statusCode,
  };
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // in ms
  maxDelay: number; // in ms
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

// Exponential backoff delay calculation
function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelay);
}

// Generic retry wrapper for async functions
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  onRetry?: (attempt: number, error: AppError) => void
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: AppError | null = null;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = parseError(error);

      // Don't retry if error is not retryable
      if (!lastError.retryable || attempt === finalConfig.maxRetries) {
        throw lastError;
      }

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // Wait before retrying
      const delay = calculateDelay(attempt, finalConfig);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError || { code: 'UNKNOWN_ERROR', message: 'Unknown error', retryable: false };
}

// Fetch with timeout and abort controller
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 60000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}
