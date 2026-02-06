export declare type EntityId = string;
export class IdBuilder {
  private readonly currentValueForPrefix: Map<string, number> = new Map<string, number>();

  public update(prefix: string, pretender: number): void {
    const loweredPrefix = prefix.toLowerCase();
    const max = Math.max(this.getCurrentValue(loweredPrefix), pretender);

    this.currentValueForPrefix.set(loweredPrefix, max);
  }

  public reset(): void {
    this.currentValueForPrefix.clear();
  }

  public getNewId(prefix: string): EntityId {
    const loweredPrefix = prefix.toLowerCase();
    const current = this.getCurrentValue(loweredPrefix) + 1;
    this.currentValueForPrefix.set(loweredPrefix, current);

    return `${loweredPrefix}${current}`;
  }

  private getCurrentValue(loweredPrefix: string): number {
    return this.currentValueForPrefix.has(loweredPrefix) ? this.currentValueForPrefix.get(loweredPrefix) as number : -1;
  }
}
