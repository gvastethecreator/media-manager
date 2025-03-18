import { apiLogger } from '@/lib/server/api-logger';
import { NextRequest, NextResponse } from 'next/server';

// Crear un logger específico para esta ruta API
const routeLogger = apiLogger.createRouteLogger('LoggerTest');

/**
 * Manejador GET para probar el sistema de logging
 */
export async function GET(request: NextRequest) {
	// Registrar la solicitud entrante
	const requestInfo = routeLogger.logRequest(request);

	try {
		// Simular algún procesamiento
		routeLogger.logger.info(
			'Procesando solicitud GET de prueba',
			{
				query: Object.fromEntries(new URL(request.url).searchParams.entries()),
			},
			requestInfo.requestId
		);

		// Simular una operación asíncrona
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Crear respuesta
		const response = NextResponse.json({
			success: true,
			message: 'Prueba de logger exitosa',
			timestamp: new Date().toISOString(),
			requestId: requestInfo.requestId,
		});

		// Registrar la respuesta
		routeLogger.logResponse(response, requestInfo);

		return response;
	} catch (error) {
		// Registrar el error
		routeLogger.logError(error as Error, requestInfo);

		// Devolver respuesta de error
		const errorResponse = NextResponse.json(
			{
				success: false,
				message: 'Error en la prueba del logger',
				error: (error as Error).message,
			},
			{ status: 500 }
		);

		routeLogger.logResponse(errorResponse, requestInfo);

		return errorResponse;
	}
}

/**
 * Manejador POST para probar el sistema de logging con cuerpo de solicitud
 */
export async function POST(request: NextRequest) {
	// Registrar la solicitud entrante
	const requestInfo = routeLogger.logRequest(request);

	try {
		// Obtener el cuerpo de la solicitud
		const body = await request.json();

		// Registrar información sobre el procesamiento
		routeLogger.logger.info(
			'Procesando solicitud POST de prueba',
			{
				bodySize: JSON.stringify(body).length,
			},
			requestInfo.requestId
		);

		// Simular una operación asíncrona
		await new Promise((resolve) => setTimeout(resolve, 200));

		// Crear respuesta
		const response = NextResponse.json({
			success: true,
			message: 'Datos recibidos correctamente',
			receivedData: body,
			timestamp: new Date().toISOString(),
			requestId: requestInfo.requestId,
		});

		// Registrar la respuesta
		routeLogger.logResponse(response, requestInfo);

		return response;
	} catch (error) {
		// Registrar el error
		routeLogger.logError(error as Error, requestInfo);

		// Devolver respuesta de error
		const errorResponse = NextResponse.json(
			{
				success: false,
				message: 'Error al procesar la solicitud',
				error: (error as Error).message,
			},
			{ status: 400 }
		);

		routeLogger.logResponse(errorResponse, requestInfo);

		return errorResponse;
	}
}
