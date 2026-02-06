import { expect, test } from 'vitest';
import { IdBuilder } from 'blackswan-foundation';

test('IdBuilder generates lowercase ids and increments', () => {
  const builder = new IdBuilder();
  expect(builder.getNewId('Pane')).toBe('pane0');
  expect(builder.getNewId('pane')).toBe('pane1');
});

test('IdBuilder update and reset', () => {
  const builder = new IdBuilder();
  builder.update('Pane', 10);
  expect(builder.getNewId('Pane')).toBe('pane11');
  builder.reset();
  expect(builder.getNewId('Pane')).toBe('pane0');
});
