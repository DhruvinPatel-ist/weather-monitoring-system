import axios, { AxiosError } from "axios";

const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
};

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let retries = 0;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      retries++;

      if (retries > config.maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.initialDelayMs * Math.pow(2, retries - 1),
        config.maxDelayMs
      );

      // Only retry on network errors or 5xx server errors
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (
          !axiosError.response || // Network error
          axiosError.response.status >= 500 || // Server error
          axiosError.code === "ERR_NETWORK" || // Network error
          axiosError.code === "ERR_INSUFFICIENT_RESOURCES" // Resource error
        ) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }

      throw error;
    }
  }
}
