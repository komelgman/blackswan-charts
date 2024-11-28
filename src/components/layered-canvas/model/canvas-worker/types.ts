import type { HasType } from '@/model/type-defs/optional';
import type { CanvasWorker } from './CanvasWorker';

export enum WorkerCommandType {
  INIT = 'INIT',
  RENDER = 'RENDER',
  INVALIDATE = 'INVALIDATE',
}

export enum WorkerResponseType {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface WorkerMessage<T extends string = any, P = any> extends HasType<T> {
  payload: P;
}

export interface WorkerResponse<P = any, T = any> {
  message: WorkerMessage<WorkerResponseType, P>
  transfer: T;
}

export interface WorkerCommand<P = any, T = any> {
  message: WorkerMessage<WorkerCommandType, P>
  transfer: T;
}

export declare type MessageProcessor<WorkerState> = (
  worker: CanvasWorker<WorkerState>,
  message: WorkerMessage
) => WorkerResponse | undefined;

export declare type InitMessage = WorkerMessage<WorkerCommandType.INIT, { canvas: OffscreenCanvas }>;

export interface CanvasWorkerState {
  ctx: OffscreenCanvasRenderingContext2D;
}

export const initCommandProcessor: MessageProcessor<CanvasWorkerState> = (worker, message: InitMessage): WorkerResponse => {
  worker.state = { ctx: message.payload.canvas.getContext('2d') as OffscreenCanvasRenderingContext2D };

  return { message: { type: WorkerResponseType.SUCCESS } } as WorkerResponse;
};
