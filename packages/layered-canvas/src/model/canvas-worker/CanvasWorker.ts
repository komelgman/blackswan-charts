import type { MessageHandler, WorkerRequestType, WorkerMessage } from './types';

export class CanvasWorker<WorkerState> {
  private handlers: Map<WorkerRequestType, MessageHandler<WorkerState>>;

  public state: WorkerState | undefined;

  public constructor(supportedCommands: Map<WorkerRequestType, MessageHandler<WorkerState>>) {
    this.handlers = supportedCommands;

    self.onmessage = this.handleMessage.bind(this);
  }

  private handleMessage(event: MessageEvent<WorkerMessage>) {
    const { type } = event.data;
    const hanler = this.handlers.get(type);

    if (hanler) {
      const response = hanler(this, event.data);

      if (response) {
        self.postMessage(response.message, response.transfer);
      }
    }
  }
}
