import { reactive, watch } from 'vue';

export declare type DataProviderChangeEventListener = (dataProvider: DataProvider) => void;

export default class DataProvider<T extends object = object> {
  public readonly name: string;
  public readonly type: string;
  public readonly data: T;

  private readonly listeners: DataProviderChangeEventListener[] = [];
  constructor(name: string, type: string, data: T) {
    this.name = name;
    this.type = type;
    this.data = reactive<T>(data) as T;

    watch(this.data, () => {
      for (const listener of this.listeners) {
        listener(this);
      }
    });
  }

  public addOnChangeListener(listener: DataProviderChangeEventListener): void {
    this.listeners.push(listener);
  }

  public removeOnChangeListener(listener: DataProviderChangeEventListener): void {
    const index: number = this.listeners.indexOf(listener);
    if (index < 0) {
      console.warn('Oops. Event listener was\'t found');
      return;
    }

    this.listeners.splice(index, 1);
  }

  public clearListeners(): void {
    this.listeners.splice(0, this.listeners.length);
  }
}
