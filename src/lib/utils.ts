import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind class names, resolving any conflicts.
 *
 * @param inputs - An array of class names to merge.
 * @returns A string of merged and optimized class names.
 */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}

export { formatFileSize } from './utils/format.utils';
// Re-exportes clave para compatibilidad con import '@/lib/utils'
export { createDefaultEntityStats } from './utils/stats';
