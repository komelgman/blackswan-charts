 
import type { HasPostConstruct } from '../types/optional';

type Constructor<T> = new (...args: any[]) => T;

export default function PostConstruct<T extends Record<string, any>>(ConstructorFunction: Constructor<T>): Constructor<T> {
   
  const newConstructor = function (...args: any[]): T {
     
    const ClassProxy = function (): T {
      const result: T = new ConstructorFunction(...args) satisfies T;

      if ((result as any as HasPostConstruct).postConstruct !== undefined) {
        result.postConstruct.apply(result);
      }

      return result;
    } as any as new() => T;

    ClassProxy.prototype = ConstructorFunction.prototype;
    return new ClassProxy();
  } as any as Constructor<T>;

  newConstructor.prototype = ConstructorFunction.prototype;

  return newConstructor;
}
