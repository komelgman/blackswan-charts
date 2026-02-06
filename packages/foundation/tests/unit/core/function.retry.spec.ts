import { expect, test, vi } from 'vitest';
import { retry, RetryError } from 'blackswan-foundation';

test('retry resolves after transient failures', async () => {
  vi.useFakeTimers();
  let attempts = 0;

  const promise = retry(
    { retries: 3, factor: 2, minTimeout: 10, maxTimeout: 50 },
    async () => {
      attempts += 1;
      if (attempts < 3) {
        throw new Error('fail');
      }
      return 'ok';
    },
  );

  await vi.runAllTimersAsync();
  await expect(promise).resolves.toBe('ok');
  expect(attempts).toBe(3);

  vi.useRealTimers();
});

test('retry throws RetryError and preserves original error', async () => {
  vi.useFakeTimers();
  const err = new Error('boom');

  const promise = retry(
    { retries: 2, factor: 2, minTimeout: 10, maxTimeout: 50 },
    async () => {
      throw err;
    },
  );

  const rejection = expect(promise).rejects.toBeInstanceOf(RetryError);
  await vi.runAllTimersAsync();
  await rejection;

  await expect(promise).rejects.toMatchObject({ originalError: err });

  vi.useRealTimers();
});
