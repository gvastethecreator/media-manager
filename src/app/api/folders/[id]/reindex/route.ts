import { reindexFolder } from '@/app/actions/folder.actions';
import { logger } from '@/lib/logger';
import { type NextRequest, NextResponse } from 'next/server';

const routeLogger = logger.withContext('FolderReindexRoute');

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
	try {
		routeLogger.info('🔄 POST /api/folders/[id]/reindex', params);
		const result = await reindexFolder(params.id);
		return NextResponse.json(result);
	} catch (error) {
		routeLogger.error('❌ Error en POST /api/folders/[id]/reindex:', error);
		return NextResponse.json({ error: 'Error al reindexar la carpeta' }, { status: 500 });
	}
}
