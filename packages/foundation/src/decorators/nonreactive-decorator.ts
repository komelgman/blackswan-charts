import { markRaw } from 'vue';

type Constructor<T> = new (...args: any[]) => T;

export default function NonReactive<T extends Record<string, any>>(ConstructorFunction: Constructor<T>): Constructor<T> {
  const newConstructor = function (...args: any[]): T {
    const ClassProxy = function (): T {
      const result: T = new ConstructorFunction(...args) satisfies T;

      markRaw(result);

      return result;
    } as any as new() => T;

    ClassProxy.prototype = ConstructorFunction.prototype;
    return new ClassProxy();
  } as any as Constructor<T>;

  newConstructor.prototype = ConstructorFunction.prototype;

  return newConstructor;
}
