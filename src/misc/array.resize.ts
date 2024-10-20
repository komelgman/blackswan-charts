// eslint-disable-next-line import/prefer-default-export
export function resize<T>(array: T[], newSize: number): T[] {
  if (array.length === newSize) {
    return array;
  }

  const deltaSize = array.length - newSize;
  if (deltaSize > 0) {
    return array.splice(0, 0, ...Array(deltaSize).fill(undefined));
  }

  return array.splice(0, deltaSize);
}
