import { type NextRequest, NextResponse } from 'next/server';
import { reindexFolder } from '@/app/actions/folders';
import { serverLogger } from '@/lib/logger/server-logger';

const reindexLogger = serverLogger.withContext('ReindexAPI');

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const result = await reindexFolder(params.id);
		return NextResponse.json(result);
	} catch (error) {
		reindexLogger.error('Error en reindexación:', error);
		return NextResponse.json({ error: 'REINDEX_FAILED' }, { status: 500 });
	}
}
