export * from './types';
export * from './client';
export * from './server';

// Re-exportar las instancias singleton para facilitar el uso
import { watcherClient } from './client';
import { watcherServer } from './server';

export { watcherClient, watcherServer };