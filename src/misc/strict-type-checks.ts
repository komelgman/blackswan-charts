/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Represents a type `T` where every property is optional.
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends readonly (infer X)[]
      ? readonly DeepPartial<X>[]
      : DeepPartial<T[P]>
};

export interface Cloneable<T> {
  clone(): T
}

export function merge(dst: Record<string, any>, ...sources: Record<string, any>[]): Record<string, any> {
  // eslint-disable-next-line no-restricted-syntax
  for (const src of sources) {
    // eslint-disable-next-line no-restricted-syntax
    for (const i in src) {
      if (src[i] === undefined) {
        continue;
      }

      if (typeof src[i] !== 'object' || dst[i] === undefined) {
        dst[i] = src[i];
      } else {
        merge(dst[i], src[i]);
      }
    }
  }

  return dst;
}

export function isNumber(value: unknown): value is number {
  return (typeof value === 'number') && (isFinite(value));
}

export function isInteger(value: unknown): boolean {
  return (typeof value === 'number') && ((value % 1) === 0);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function clone<T>(object: T): T {
  const source = object as any;
  if ((source as Cloneable<T>).clone !== undefined) {
    return (source as Cloneable<T>).clone();
  }

  if (!source || typeof source !== 'object') {
    return source;
  }

  const cloned: any = Array.isArray(source) ? [] : {};
  // eslint-disable-next-line no-restricted-syntax
  for (const property in source) {
    // eslint-disable-next-line no-prototype-builtins
    if (source.hasOwnProperty(property)) {
      const propertyValue = source[property];
      if (propertyValue && typeof propertyValue === 'object') {
        cloned[property] = clone(propertyValue);
      } else {
        cloned[property] = propertyValue;
      }
    }
  }

  return cloned;
}

export function notNull<T>(t: T | null): t is T {
  return t !== null;
}

export function undefinedIfNull<T>(t: T | null): T | undefined {
  return (t === null) ? undefined : t;
}
