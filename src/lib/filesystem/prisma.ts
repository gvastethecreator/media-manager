/**
 * @file Cliente Prisma para operaciones de filesystem
 * @module lib/filesystem/prisma
 */

import { PrismaClient } from '@prisma/client';

// Cliente Prisma singleton para filesystem
let prismaFilesystem: PrismaClient;

declare global {
	var __prisma_filesystem: PrismaClient | undefined;
}

if (process.env.NODE_ENV === 'production') {
	prismaFilesystem = new PrismaClient();
} else {
	if (!global.__prisma_filesystem) {
		global.__prisma_filesystem = new PrismaClient({
			log: ['query', 'error', 'warn'],
		});
	}
	prismaFilesystem = global.__prisma_filesystem;
}

export { prismaFilesystem };
export default prismaFilesystem;
