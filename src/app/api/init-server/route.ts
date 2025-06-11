import { serverLogger } from '@/lib/logger/server-logger';
import { initServer } from '@/app/actions/system';
import { NextResponse } from 'next/server';

// Logger específico para esta ruta
const logger = serverLogger.withContext('InitServerRoute');

// Función para verificar si el servidor ya está inicializado
async function isServerInitialized(): Promise<boolean> {
	// Aquí iría la lógica para verificar si el servidor ya está inicializado
	// Por ahora, retornamos false como ejemplo
	return false;
}

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
		// Verificar si el servidor ya está inicializado
		const isServerAlreadyInitialized = await isServerInitialized();

                if (!isServerAlreadyInitialized) {
                        logger.info('Inicializando servidor desde ruta de API');

                        // Inicializar servidor mediante la Server Action
                        await initServer();

			return NextResponse.json({
				success: true,
				message: 'Servidor inicializado correctamente',
				timestamp: new Date().toISOString(),
			});
		}

		logger.info('Servidor ya inicializado, omitiendo inicialización');

		// Devolver una respuesta indicando que el servidor ya está inicializado
		return NextResponse.json({
			success: true,
			message: 'Server already initialized',
			timestamp: new Date().toISOString(),
		});
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
