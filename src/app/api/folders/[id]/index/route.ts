import { indexFolder } from '@/app/actions/folders';
import { logger } from '@/lib/logger/logger';
import { type NextRequest, NextResponse } from 'next/server';

const routeLogger = logger.withContext('FolderIndexRoute');

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
	try {
		routeLogger.info('🔄 POST /api/folders/[id]/index', params);
		const result = await indexFolder(params.id);
		return NextResponse.json(result);
	} catch (error) {
		routeLogger.error('❌ Error en POST /api/folders/[id]/index:', error);
		return NextResponse.json({ error: 'Error al indexar la carpeta' }, { status: 500 });
	}
}
