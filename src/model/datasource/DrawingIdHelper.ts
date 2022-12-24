import { toRaw } from 'vue';
import { isString } from '@/misc/strict-type-checks';
import type DataSource from '@/model/datasource/DataSource';

export default class DrawingIdHelper {
  private maxValueForPrefix: Map<string, number> = new Map<string, number>();

  constructor(dataSource: DataSource) {
    this.init(dataSource);
  }

  private init(dataSource: DataSource): void {
    const rawDS = toRaw(dataSource);
    for (const [descriptor] of rawDS) {
      if (!isString(descriptor.ref)) {
        continue;
      }

      const { options } = descriptor;
      const regex = new RegExp(`${options.type}(\\d+)`, 'i');
      const matches = descriptor.ref.match(regex);

      if (matches == null || matches.length > 2) {
        throw new Error(`Unsupported DataSourceEntry Id template, use 'options.type' +
        Number but for type: ${options.type} found id: ${descriptor.ref}`);
      }

      const current: number = this.maxValueForPrefix.get(options.type) || -1;
      this.maxValueForPrefix.set(options.type, Math.max(current, Number.parseInt(matches[1], 10)));
    }
  }

  public getNewId(type: string): string {
    const currentMaxValue: number = (this.maxValueForPrefix.get(type) || -1) + 1;
    this.maxValueForPrefix.set(type, currentMaxValue);

    return type + currentMaxValue;
  }
}
