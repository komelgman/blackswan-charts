export declare type DataBindingChangeEventListener = (dataBinding: DataBinding) => void;

export default class DataBinding<T extends object = object> {
  public readonly name: string;
  public readonly type: string;
  public readonly data: T;

  private readonly listeners: DataBindingChangeEventListener[] = [];
  constructor(name: string, type: string, data: T) {
    this.name = name;
    this.type = type;
    this.data = data;
  }

  public addChangeEventListener(listener: DataBindingChangeEventListener): void {
    this.listeners.push(listener);
  }

  public removeChangeEventListener(listener: DataBindingChangeEventListener): void {
    const index: number = this.listeners.indexOf(listener);
    if (index < 0) {
      console.warn('Oops. Event listener wasn\'t found');
      return;
    }

    this.listeners.splice(index, 1);
  }

  public processData(dataProcessor: (data: T) => boolean) : void {
    if (dataProcessor(this.data)) {
      for (const listener of this.listeners) {
        listener(this);
      }
    }
  }
}
