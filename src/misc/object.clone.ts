export interface Cloneable<T> {
  clone(): T;
}

export function clone<T>(object: T): T {
  const source = object as any;
  if ((source as Cloneable<T>).clone !== undefined) {
    return (source as Cloneable<T>).clone();
  }

  if (!source || typeof source !== 'object') {
    return source;
  }

  const cloned: any = Array.isArray(source) ? new Array(source.length) : {};
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
