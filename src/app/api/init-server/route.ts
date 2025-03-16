import { serverLogger } from '@/lib/logger/server-logger';
import initializeServer from '@/lib/server/init-server';
import { NextResponse } from 'next/server';

// Logger específico para esta ruta
const logger = serverLogger.withContext('InitServerRoute');

// Variable para controlar si ya se ha inicializado
let isInitialized = false;

/**
 * Ruta de API para inicializar el servidor
 *
 * Esta ruta se llama automáticamente cuando la aplicación se inicia
 * y se encarga de inicializar todos los componentes del servidor.
 *
 * Se puede llamar manualmente para reiniciar los servicios del servidor.
 */
export async function GET() {
	try {
		if (!isInitialized) {
			logger.info('Inicializando servidor desde ruta de API');

			// Inicializar servidor
			initializeServer();

			// Marcar como inicializado
			isInitialized = true;

			return NextResponse.json({
				success: true,
				message: 'Servidor inicializado correctamente',
				timestamp: new Date().toISOString(),
			});
		} else {
			logger.info('Servidor ya inicializado, omitiendo inicialización');

			return NextResponse.json({
				success: true,
				message: 'Servidor ya estaba inicializado',
				timestamp: new Date().toISOString(),
			});
		}
	} catch (error) {
		logger.error('Error al inicializar el servidor', {
			error: error instanceof Error ? error.message : String(error),
		});

		return NextResponse.json(
			{
				success: false,
				message: 'Error al inicializar el servidor',
				error: error instanceof Error ? error.message : String(error),
				timestamp: new Date().toISOString(),
			},
			{ status: 500 }
		);
	}
}
