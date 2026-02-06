export function deepEqual(obj1: any, obj2: any): boolean {
  // Check for identity
  if (obj1 === obj2) {
    return true;
  }

  // Check for null and undefined
  if (obj1 == null || obj2 == null) {
    return obj1 === obj2;
  }

  // Check types
  const type1 = typeof obj1;
  const type2 = typeof obj2;
  if (type1 !== type2) {
    return false;
  }

  // Handle primitive types
  if (type1 !== 'object') {
    return obj1 === obj2;
  }

  // Handle arrays
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) {
      return false;
    }
    for (let i = 0; i < obj1.length; i++) {
      if (!deepEqual(obj1[i], obj2[i])) {
        return false;
      }
    }
    return true;
  }

  // Handle Date objects
  if (obj1 instanceof Date && obj2 instanceof Date) {
    return obj1.getTime() === obj2.getTime();
  }

  // Handle RegExp objects
  if (obj1 instanceof RegExp && obj2 instanceof RegExp) {
    return obj1.toString() === obj2.toString();
  }

  // Handle plain objects
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  // Filter out keys with undefined values
  const filteredKeys1 = keys1.filter((key) => obj1[key] !== undefined);
  const filteredKeys2 = keys2.filter((key) => obj2[key] !== undefined);

  // Compare the number of non-undefined properties
  if (filteredKeys1.length !== filteredKeys2.length) {
    return false;
  }

  // Compare each property recursively
  for (const key of filteredKeys1) {
    if (
      !Object.prototype.hasOwnProperty.call(obj2, key)
      || !deepEqual(obj1[key], obj2[key])
    ) {
      return false;
    }
  }

  return true;
}
