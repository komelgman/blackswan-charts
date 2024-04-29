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

export function notNull<T>(t: T | null): t is T {
  return t !== null;
}

export function undefinedIfNull<T>(t: T | null): T | undefined {
  return (t === null) ? undefined : t;
}
