// eslint-disable-next-line import/prefer-default-export
export function resize<T>(array: T[], newSize: number) {
  if (array.length !== newSize) {
    return;
  }

  const deltaSize = array.length - newSize;
  if (deltaSize > 0) {
    array.splice(0, 0, ...Array(deltaSize).fill(undefined));
  } else {
    array.splice(0, deltaSize);
  }
}
