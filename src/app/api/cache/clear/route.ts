import { clearMetadataCache } from '@/app/actions/metadata';
import { metadataCache } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';

const routeLogger = logger.withContext('CacheAPI');

export async function POST() {
	try {
		routeLogger.info('🧹 Limpiando caché');
		await clearMetadataCache();

		routeLogger.info('✅ Caché limpiada correctamente');
		return NextResponse.json({ success: true, message: 'Caché limpiada correctamente' });
	} catch (error) {
		routeLogger.error('❌ Error al limpiar caché:', error);
		return new NextResponse(
			JSON.stringify({
				error: 'Error al limpiar caché',
				message: error instanceof Error ? error.message : 'Error desconocido',
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
