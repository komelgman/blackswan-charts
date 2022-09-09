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
  clone(): T;
}

// todo: add test for merge
declare type Item = [Record<string, any>, Record<string, any>, Record<string, any>, string];

export function merge(dst: Record<string, any>, ...sources: Record<string, any>[]): [Record<string, any>, Record<string, any>] {
  const items: Item[] = [];
  const unmerge: Record<string, any> = {};

  for (const src of sources) {
    // eslint-disable-next-line guard-for-in
    for (const i in src) {
      items.push([dst, unmerge, src, i]);
    }
  }

  while (items.length > 0) {
    const [dstObj, oldObj, srcObj, property] = items.shift() as Item;
    if (Array.isArray(srcObj[property]) || srcObj[property] === null || typeof srcObj[property] !== 'object' || dstObj[property] === undefined) {
      if (oldObj !== undefined && dstObj[property] !== srcObj[property]) {
        oldObj[property] = dstObj[property] === undefined ? null : dstObj[property];
      }

      dstObj[property] = srcObj[property] === null ? undefined : srcObj[property];
    } else {
      oldObj[property] = dstObj[property] === undefined ? null : {};

      // eslint-disable-next-line guard-for-in
      for (const i in srcObj[property]) {
        items.push([dstObj[property], oldObj[property], srcObj[property], i]);
      }
    }
  }

  return [dst, unmerge];
}

export function isEmpty(obj: Record<string, unknown> | undefined): boolean {
  if (obj === undefined) {
    return true;
  }

  const items: [Record<string, unknown>, string][] = [];
  // eslint-disable-next-line guard-for-in
  for (const i in obj) {
    items.push([obj, i]);
  }

  while (items.length > 0) {
    const [testedObject, property] = items.shift() as [Record<string, unknown>, string];
    const propertyValue = testedObject[property] as Record<string, unknown>;
    if (Array.isArray(propertyValue) || typeof propertyValue !== 'object' || propertyValue === null) {
      return false;
    }

    // eslint-disable-next-line guard-for-in
    for (const i in propertyValue) {
      items.push([propertyValue, i]);
    }
  }

  return true;
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
