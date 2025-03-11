import type { PrismaClient } from '@prisma/client';

declare global {
	// eslint-disable-next-line no-var
	var prisma: PrismaClient | undefined;

	interface Window {
		electron?: {
			openPath: (path: string) => void;
			downloadFile: (path: string) => void;
			copyFileToClipboard: (path: string) => void;
			deleteFile: (path: string) => void;
		};
	}
}
