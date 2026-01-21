 

declare type Item = [Record<string, any>, Record<string, any>, Record<string, any>, string];

const PROP_IS_NOT_SET = null;

export function merge(dst: Record<string, any>, ...sources: Record<string, any>[]): [result: Record<string, any>, diff: Record<string, any>] {
  const { hasOwnProperty } = Object.prototype;
  const items: Item[] = [];
  const unmerge: Record<string, any> = {};

  for (const src of sources) {
    if (Array.isArray(dst) && Array.isArray(src) && dst.length !== src.length) {
      throw new Error('Illegal Argument: can merge tuples with same length only');
    }

    for (const prop in src) {
      if (hasOwnProperty.call(src, prop)) {
        items.push([dst, unmerge, src, prop]);
      }
    }
  }

  while (items.length > 0) {
    const [dstObj, oldObj, srcObj, property] = items.shift() as Item;
    const srcPropValue: any = srcObj[property];
    const dstPropValue: any = dstObj[property];

    const srcHasOwnProp = hasOwnProperty.call(srcObj, property);
    const dstHasOwnProp = hasOwnProperty.call(dstObj, property);
    const isScalar = srcPropValue?.constructor !== Object || dstPropValue?.constructor !== Object;

    if (isScalar) {
      if (srcPropValue === dstPropValue && dstHasOwnProp && srcHasOwnProp) {
        continue;
      }

      if (oldObj && !hasOwnProperty.call(oldObj, property)
        && (dstHasOwnProp || srcPropValue !== PROP_IS_NOT_SET)) {
        oldObj[property] = dstHasOwnProp ? dstPropValue : PROP_IS_NOT_SET;
      }

      if (srcObj?.constructor === Object && srcPropValue === PROP_IS_NOT_SET && srcHasOwnProp) {
        delete dstObj[property];
      } else {
        dstObj[property] = srcPropValue;
      }
    } else {
      if (oldObj && !hasOwnProperty.call(oldObj, property)) {
        oldObj[property] = dstHasOwnProp ? { __deleteIfEmpty: true } : PROP_IS_NOT_SET;
      }

      for (const prop in srcPropValue) {
        if (oldObj && hasOwnProperty.call(srcPropValue, prop)) {
          items.push([dstPropValue, oldObj[property], srcPropValue, prop]);
        }
      }
    }
  }

  return [dst, removeEmptyObjects(unmerge)];
}

function removeEmptyObjects(obj: any): any {
  const { hasOwnProperty } = Object.prototype;
  for (const key in obj) {
    if (hasOwnProperty.call(obj, key)) {
      const keyValue = obj[key];
      const deleteIfEmpty = keyValue && keyValue.__deleteIfEmpty;
      if (deleteIfEmpty) {
        delete obj[key].__deleteIfEmpty;
      }

      if (typeof obj[key] === 'object' && obj[key] !== null) {
        obj[key] = removeEmptyObjects(obj[key]);
      }

      if (deleteIfEmpty && typeof obj[key] === 'object' && obj[key] !== null && Object.keys(obj[key]).length === 0) {
        delete obj[key];
      }
    }
  }

  return obj;
}
