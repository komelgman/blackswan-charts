/* eslint-disable no-await-in-loop */
export interface RetryOptions {
  retries: number;
  factor: number;
  minTimeout: number;
  maxTimeout: number;
}

export class RetryError extends Error {
  constructor(message: string, public originalError: Error) {
    super(message);
    this.name = 'RetryError';
  }
}

export async function retry<T>(options: RetryOptions, fn: () => Promise<T>): Promise<T> {
  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt < options.retries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      attempt++;

      if (attempt >= options.retries) {
        break;
      }

      const delay = Math.min(
        options.minTimeout * options.factor ** attempt,
        options.maxTimeout,
      );

      await new Promise((resolve) => { setTimeout(resolve, delay); });
    }
  }

  throw new RetryError(
    `Failed after ${options.retries} attempts`,
    lastError as Error,
  );
}
