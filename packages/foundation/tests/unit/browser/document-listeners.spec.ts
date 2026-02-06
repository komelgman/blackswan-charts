// @vitest-environment jsdom
import { expect, test, vi } from 'vitest';
import { onDocument, onceDocument } from 'blackswan-foundation';

test('onDocument registers and removes listener', () => {
  const handler = vi.fn();
  const remover = onDocument('click', handler);

  document.documentElement.dispatchEvent(new MouseEvent('click'));
  expect(handler).toHaveBeenCalledTimes(1);

  remover();
  document.documentElement.dispatchEvent(new MouseEvent('click'));
  expect(handler).toHaveBeenCalledTimes(1);
});

test('onceDocument removes listener when callback returns true', () => {
  const handler = vi.fn(() => true);
  onceDocument('click', handler);

  document.documentElement.dispatchEvent(new MouseEvent('click'));
  document.documentElement.dispatchEvent(new MouseEvent('click'));

  expect(handler).toHaveBeenCalledTimes(1);
});

test('onceDocument keeps listener when callback returns false', () => {
  let count = 0;
  const handler = vi.fn(() => {
    count += 1;
    return count > 1;
  });

  onceDocument('click', handler);

  document.documentElement.dispatchEvent(new MouseEvent('click'));
  document.documentElement.dispatchEvent(new MouseEvent('click'));
  document.documentElement.dispatchEvent(new MouseEvent('click'));

  expect(handler).toHaveBeenCalledTimes(2);
});
