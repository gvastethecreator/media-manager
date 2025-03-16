import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { deepMerge } from './utils/object-utils';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Re-exportar deepMerge desde object-utils
export { deepMerge };
