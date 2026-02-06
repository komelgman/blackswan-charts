import { expect, test } from 'vitest';
import { PostConstruct } from '@blackswan/foundation';

test('PostConstruct calls postConstruct after instantiation', () => {
  class Foo {
    public called = 0;
    public postConstruct(): void {
      this.called += 1;
    }
  }

  const Decorated = PostConstruct(Foo);
  const instance = new Decorated();

  expect(instance.called).toBe(1);
});

test('PostConstruct is no-op when postConstruct is missing', () => {
  class Bar {
    public value = 1;
  }

  const Decorated = PostConstruct(Bar);
  const instance = new Decorated();

  expect(instance.value).toBe(1);
});
