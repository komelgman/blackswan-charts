// todo: check that, looks like unused
export function resizeInPlace<T>(array: T[], newSize: number) {
  if (array.length === newSize) {
    return;
  }

  const deltaSize = array.length - newSize;
  if (deltaSize < 0) {
    array.splice(array.length, 0, ...Array(-deltaSize).fill(undefined));
  } else {
    array.splice(array.length - deltaSize, deltaSize);
  }
}
