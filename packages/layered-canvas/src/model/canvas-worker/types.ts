import type { HasType } from '@blackswan/foundation';
import type { CanvasWorker } from './CanvasWorker';

export enum WorkerRequestType {
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

export interface WorkerRequest<P = any, T = any> {
  message: WorkerMessage<WorkerRequestType, P>
  transfer: T;
}

export declare type MessageHandler<WorkerState> = (
  worker: CanvasWorker<WorkerState>,
  message: WorkerMessage
) => WorkerResponse | undefined;

export declare type InitMessage = WorkerMessage<WorkerRequestType.INIT, { canvas: OffscreenCanvas }>;

export interface CanvasWorkerState {
  ctx: OffscreenCanvasRenderingContext2D;
}

export const initMessageHandler: MessageHandler<CanvasWorkerState> = (worker, message: InitMessage): WorkerResponse => {
  worker.state = { ctx: message.payload.canvas.getContext('2d') as OffscreenCanvasRenderingContext2D };

  return { message: { type: WorkerResponseType.SUCCESS, payload: { requestType: message.type } } } as WorkerResponse;
};
