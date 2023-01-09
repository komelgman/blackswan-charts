/* eslint-disable @typescript-eslint/no-explicit-any */
import { reactive } from 'vue';

export interface HasPostConstruct {
  postConstruct: () => void;
}

type Constructor<T> = new (...args: any[]) => T;

export default function Reactive<T extends Record<string, any>>(ConstructorFunction: Constructor<T>): Constructor<T> {
  // eslint-disable-next-line func-names
  const newConstructor = function (...args: any[]): T {
    // eslint-disable-next-line func-names
    const Proxy = function (): T {
      const result: T = (reactive(new ConstructorFunction(...args)) as any) as T;

      if ((result as any as HasPostConstruct).postConstruct !== undefined) {
        result.postConstruct.apply(result);
      }

      return result;
    } as any as { new(): T };

    Proxy.prototype = ConstructorFunction.prototype;
    return new Proxy();
  } as any as Constructor<T>;

  newConstructor.prototype = ConstructorFunction.prototype;

  return newConstructor;
}
