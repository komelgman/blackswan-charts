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

    if (srcPropValue?.constructor !== Object || dstPropValue?.constructor !== Object) {
      const srcHasOwnProp = hasOwnProperty.call(srcObj, property);
      const dstHasOwnProp = hasOwnProperty.call(dstObj, property);

      if (srcPropValue === dstPropValue && dstHasOwnProp && srcHasOwnProp) {
        continue;
      }

      if (oldObj !== undefined && !hasOwnProperty.call(oldObj, property)
        && (dstHasOwnProp || srcPropValue !== PROP_IS_NOT_SET)) {
        oldObj[property] = dstHasOwnProp ? dstPropValue : PROP_IS_NOT_SET;
      }

      if (srcObj?.constructor === Object && srcPropValue === PROP_IS_NOT_SET && srcHasOwnProp) {
        delete dstObj[property];
      } else {
        dstObj[property] = srcPropValue;
      }
    } else {
      if (!hasOwnProperty.call(oldObj, property)) {
        oldObj[property] = {};
      }

      for (const prop in srcPropValue) {
        if (hasOwnProperty.call(srcPropValue, prop)) {
          items.push([dstPropValue, oldObj[property], srcPropValue, prop]);
        }
      }
    }
  }

  return [dst, unmerge];
}
