export class Cache<K, V> {
  private map: Map<K, V> = new Map();
  private keys: (K | undefined)[];
  private keysIndex: number = 0;

  public constructor(size: number = 100) {
    this.keys = Array.from(new Array(size));
  }

  public reset(): void {
    this.map.clear();
    this.keys.fill(undefined);
  }

  public getValue(key: K, calculateIfAbsent: (key: K) => V): V {
    let result = this.map.get(key);
    if (result === undefined) {
      result = calculateIfAbsent(key);

      const oldestKey = this.keys[this.keysIndex];
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
      }

      this.keys[this.keysIndex] = key;
      this.keysIndex = (this.keysIndex + 1) % this.keys.length;
      this.map.set(key, result);
    }

    return result;
  }
}
