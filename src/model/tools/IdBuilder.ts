export declare type EntityId = string;
export default class IdBuilder {
  private readonly currentValueForPrefix: Map<string, number> = new Map<string, number>();
  public update(prefix: string, pretender: number): void {
    const loweredPrefix = prefix.toLowerCase();
    const max = Math.max(this.currentValueForPrefix.get(loweredPrefix) || -1, pretender);

    this.currentValueForPrefix.set(loweredPrefix, max);
  }

  public getNewId(prefix: string): EntityId {
    const loweredPrefix = prefix.toLowerCase();
    const current = (this.currentValueForPrefix.get(loweredPrefix) || -1) + 1;
    this.currentValueForPrefix.set(loweredPrefix, current);

    return `${loweredPrefix}${current}`;
  }
}
