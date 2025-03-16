import { reindexFolder } from '@/app/actions/folders/folder-indexing.actions';
import { serverLogger } from '@/lib/logger/server-logger';
import { type NextRequest, NextResponse } from 'next/server';

const routeLogger = serverLogger.withContext('FolderReindexRoute');

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
	try {
		routeLogger.info('🔄 POST /api/folders/[id]/reindex', params);
		const result = await reindexFolder(params.id);
		return NextResponse.json(result);
	} catch (error) {
		routeLogger.error('❌ Error en POST /api/folders/[id]/reindex:', error);
		return new NextResponse(
			JSON.stringify({
				error: 'Error reindexando carpeta',
				message: error instanceof Error ? error.message : String(error),
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);
	}
}
