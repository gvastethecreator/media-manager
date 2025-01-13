import { EventEmitter } from 'events';
import { logger } from '@/lib/logger';

export interface ProcessStatus {
  status?: string;
  current?: number;
  total?: number;
  progress?: number;
  currentFile?: string;
  timestamp?: number;
  entityId?: string;
}

export interface ErrorResponse {
  message: string;
  details?: string;
  code?: string;
  timestamp?: number;
}

export enum BASE_EVENTS {
  PROGRESS = 'progress',
  ERROR = 'error',
  COMPLETE = 'complete',
  STATS = 'stats'
}

export interface ProcessCallbacks {
  onProgress?: (status: ProcessStatus) => void;
  onError?: (error: ErrorResponse) => void;
  onComplete?: (data: any) => void;
  onStats?: (stats: any) => void;
}

export abstract class BaseEventService extends EventEmitter {
  protected logger;
  protected isProcessing: boolean = false;

  constructor(context: string) {
    super();
    this.logger = logger.withContext(context);
    this.setMaxListeners(50);
  }

  // Event handlers
  onProgress(callback: (status: ProcessStatus) => void): void {
    this.on(BASE_EVENTS.PROGRESS, callback);
  }

  offProgress(callback: (status: ProcessStatus) => void): void {
    this.off(BASE_EVENTS.PROGRESS, callback);
  }

  onError(callback: (error: ErrorResponse) => void): void {
    this.on(BASE_EVENTS.ERROR, callback);
  }

  offError(callback: (error: ErrorResponse) => void): void {
    this.off(BASE_EVENTS.ERROR, callback);
  }

  onComplete(callback: (data: any) => void): void {
    this.on(BASE_EVENTS.COMPLETE, callback);
  }

  offComplete(callback: (data: any) => void): void {
    this.off(BASE_EVENTS.COMPLETE, callback);
  }

  onStats(callback: (stats: any) => void): void {
    this.on(BASE_EVENTS.STATS, callback);
  }

  offStats(callback: (stats: any) => void): void {
    this.off(BASE_EVENTS.STATS, callback);
  }

  protected setupEventHandlers(callbacks?: ProcessCallbacks) {
    return {
      [BASE_EVENTS.PROGRESS]: (data: any) => {
        this.emit(BASE_EVENTS.PROGRESS, data);
        callbacks?.onProgress?.(data);
      },
      [BASE_EVENTS.ERROR]: (error: any) => {
        this.emit(BASE_EVENTS.ERROR, error);
        callbacks?.onError?.(error);
      },
      [BASE_EVENTS.COMPLETE]: (data: any) => {
        this.emit(BASE_EVENTS.COMPLETE, data);
        callbacks?.onComplete?.(data);
      },
      [BASE_EVENTS.STATS]: (stats: any) => {
        this.emit(BASE_EVENTS.STATS, stats);
        callbacks?.onStats?.(stats);
      }
    };
  }

  protected createErrorResponse(error: unknown, message: string): ErrorResponse {
    return {
      message: error instanceof Error ? error.message : message,
      details: error instanceof Error ? error.stack : String(error),
      timestamp: Date.now()
    };
  }
}