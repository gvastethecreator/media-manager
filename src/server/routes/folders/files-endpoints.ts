import { eq } from 'drizzle-orm';
import type { RequestHandler, Router } from 'express';
import { db } from '@/lib/drizzle';
import { folders } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { isValidFolderId } from '@/lib/utils/folder-id-generator';

const logger = serverLogger.withContext('FoldersFiles');

export function registerFolderFilesEndpoints(router: Router) {
	// GET /:folderId/files
	const listHandler: RequestHandler = async (req, res) => {
		try {
			const { folderId } = req.params;
			const {
				includeSubfolders = 'false',
				limit = '150',
				offset = '0',
				search,
				sortBy = 'name',
				sortOrder = 'asc',
				fileTypes,
			} = req.query as Record<string, string | undefined>;

			if (!isValidFolderId(folderId)) {
				res.status(400).json({ error: 'Invalid folder ID' });
				return;
			}

			const [folder] = await db.select().from(folders).where(eq(folders.id, folderId)).limit(1);
			if (!folder) {
				res.status(404).json({ error: 'Folder not found' });
				return;
			}

			const { getFolderFiles } = await import('@/services/folder-files');

			const parsedLimit = Math.min(Math.max(1, Number.parseInt(limit || '150', 10) || 150), 500);
			const parsedOffset = Math.max(0, Number.parseInt(offset || '0', 10) || 0);
			const parsedFileTypes = fileTypes
				? fileTypes.split(',').filter((type) => ['image', 'video', 'audio', 'document', 'json', '3d'].includes(type))
				: ['image', 'video', 'audio', 'document', 'json', '3d'];

			logger.info('Getting folder files with pagination', {
				folderId,
				includeSubfolders: includeSubfolders === 'true',
				limit: parsedLimit,
				offset: parsedOffset,
				search,
				sortBy,
				sortOrder,
				fileTypes: parsedFileTypes,
			});

			const result = await getFolderFiles({
				folderId,
				includeSubfolders: includeSubfolders === 'true',
				limit: parsedLimit,
				offset: parsedOffset,
				search,
				sortBy: sortBy as any,
				sortOrder: (sortOrder as 'asc' | 'desc') || 'asc',
				fileTypes: parsedFileTypes as any,
			});

			res.set('X-Total-Count', result.total.toString());
			res.set('X-Has-More', result.hasMore.toString());
			res.set('X-Query-Time', result.performance.queryTime.toString());

			res.json({
				success: true,
				data: result.files,
				pagination: result.pagination,
				total: result.total,
				hasMore: result.hasMore,
				performance: result.performance,
				folder: { id: folder.id, name: folder.name, path: folder.path },
			});
			return;
		} catch (error) {
			logger.error('Error in folder files endpoint:', error);
			res.status(500).json({
				error: 'Failed to get folder files',
				message: error instanceof Error ? error.message : 'Unknown error',
			});
			return;
		}
	};
	router.get('/:folderId/files', listHandler);

	// GET /:folderId/stream
	const streamHandler: RequestHandler = async (req, res) => {
		try {
			const { folderId } = req.params;
			const {
				includeSubfolders = 'false',
				search,
				fileTypes,
				batchSize = '200',
				delayMs = '10',
			} = req.query as Record<string, string | undefined>;

			if (!isValidFolderId(folderId)) {
				res.status(400).json({ error: 'Invalid folder ID' });
				return;
			}

			const [folder] = await db.select().from(folders).where(eq(folders.id, folderId)).limit(1);
			if (!folder) {
				res.status(404).json({ error: 'Folder not found' });
				return;
			}

			res.writeHead(200, {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': 'Cache-Control',
			});

			logger.info('Starting folder files streaming', {
				folderId,
				includeSubfolders: includeSubfolders === 'true',
				search,
				fileTypes,
				batchSize: Number.parseInt(batchSize, 10),
			});

			const { streamFolderFiles } = await import('@/services/folder-files/folder-files-stream.service');

			const parsedFileTypes = fileTypes
				? fileTypes.split(',').filter((type) => ['image', 'video', 'audio', 'document', 'json', '3d'].includes(type))
				: ['image', 'video', 'audio', 'document', 'json', '3d'];

			const streamGenerator = streamFolderFiles({
				folderId,
				includeSubfolders: includeSubfolders === 'true',
				search,
				fileTypes: parsedFileTypes as any,
				batchSize: Math.min(Math.max(50, Number.parseInt(batchSize, 10) || 200), 500),
				delayMs: Math.max(0, Number.parseInt(delayMs, 10) || 10),
			});

			for await (const chunk of streamGenerator) {
				if (res.destroyed) {
					logger.info('Client disconnected from streaming');
					break;
				}
				res.write(`data: ${JSON.stringify(chunk)}\n\n`);
				if (res.flushHeaders) res.flushHeaders();
			}

			res.write('event: close\ndata: Stream completed\n\n');
			res.end();
			return;
		} catch (error) {
			logger.error('Error in folder streaming endpoint:', error);
			if (!res.destroyed) {
				res.write(
					`data: ${JSON.stringify({ type: 'error', error: error instanceof Error ? error.message : 'Unknown streaming error' })}\n\n`
				);
				res.end();
			}
			return;
		}
	};
	router.get('/:folderId/stream', streamHandler);

	// GET /:folderId/files/stats
	const statsHandler: RequestHandler = async (req, res) => {
		try {
			const { folderId } = req.params;
			const { includeSubfolders = 'false' } = req.query as Record<string, string | undefined>;

			if (!isValidFolderId(folderId)) {
				res.status(400).json({ error: 'Invalid folder ID' });
				return;
			}

			const [folder] = await db.select().from(folders).where(eq(folders.id, folderId)).limit(1);
			if (!folder) {
				res.status(404).json({ error: 'Folder not found' });
				return;
			}

			const { getFolderFileStats } = await import('@/services/folder-files');
			const stats = await getFolderFileStats(folderId, includeSubfolders === 'true');

			res.json({
				success: true,
				data: stats,
				folder: { id: folder.id, name: folder.name, path: folder.path },
			});
			return;
		} catch (error) {
			logger.error('Error in folder stats endpoint:', error);
			res.status(500).json({
				error: 'Failed to get folder stats',
				message: error instanceof Error ? error.message : 'Unknown error',
			});
			return;
		}
	};
	router.get('/:folderId/files/stats', statsHandler);
}
