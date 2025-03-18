import type { PrismaClient } from '@prisma/client';

declare global {
	let prisma: PrismaClient | undefined;
	interface Window {
		electron?: {
			openPath: (path: string) => void;
			downloadFile: (path: string) => void;
			copyFileToClipboard: (path: string) => void;
			deleteFile: (path: string) => void;
		};
	}
}
