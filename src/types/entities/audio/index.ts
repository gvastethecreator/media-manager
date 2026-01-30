// Re-export all audio types
export * from './base';
export * from './types';

// Import types for aliases
import type { AudioCreateInput, AudioWithStats } from './base';

// Aliases for compatibility
export type Audio = AudioWithStats;
export type AudioFormData = AudioCreateInput;
export type AudioUIInput = AudioCreateInput;
