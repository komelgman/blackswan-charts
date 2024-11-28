import type { MessageProcessor, WorkerCommandType, WorkerMessage } from '@/components/layered-canvas/model/canvas-worker/types';

export class CanvasWorker<WorkerState> {
  private processors: Map<WorkerCommandType, MessageProcessor<WorkerState>>;

  public state: WorkerState | undefined;

  public constructor(supportedCommands: Map<WorkerCommandType, MessageProcessor<WorkerState>>) {
    this.processors = supportedCommands;

    self.onmessage = this.handleMessage.bind(this);
  }

  private handleMessage(event: MessageEvent<WorkerMessage>) {
    const { type } = event.data;
    const processor = this.processors.get(type);

    if (processor) {
      const response = processor(this, event.data);

      if (response) {
        self.postMessage(response.message, response.transfer);
      }
    }
  }
}
