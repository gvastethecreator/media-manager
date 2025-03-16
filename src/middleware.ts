import { NextRequest, NextResponse } from 'next/server';
import { serverLogger } from './lib/logger/server-logger';
import { appMonitor } from './lib/server/app-monitor';

// Logger específico para el middleware
const middlewareLogger = serverLogger.withContext('Middleware');

// Contador para generar IDs de solicitud únicos
let requestCounter = 0;

/**
 * Middleware principal de Next.js
 *
 * Este middleware intercepta todas las solicitudes entrantes y:
 * 1. Genera un ID único para cada solicitud
 * 2. Registra información sobre la solicitud
 * 3. Mide el tiempo de respuesta
 * 4. Actualiza las estadísticas de la aplicación
 */
export async function middleware(request: NextRequest) {
	// Verificar si la ruta debe ser excluida
	const url = request.nextUrl.pathname;

	// Excluir archivos estáticos y recursos
	if (url.startsWith('/_next/') || url === '/favicon.ico' || url.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)) {
		return NextResponse.next();
	}

	// Generar ID único para la solicitud
	const requestId = `req_${Date.now()}_${++requestCounter}`;

	// Registrar inicio de la solicitud
	const startTime = performance.now();

	// Incrementar contador de solicitudes pendientes
	appMonitor.trackPendingRequest(1);

	// Registrar información de la solicitud
	middlewareLogger.http(`${request.method} ${url}`, {
		requestId,
		userAgent: request.headers.get('user-agent') || 'unknown',
		referer: request.headers.get('referer') || 'direct',
		ip: request.ip || 'unknown',
	});

	try {
		// Continuar con la solicitud
		const response = NextResponse.next();

		// Añadir encabezado con el ID de solicitud
		response.headers.set('X-Request-ID', requestId);

		// Calcular tiempo de respuesta
		const responseTime = performance.now() - startTime;

		// Registrar finalización exitosa
		middlewareLogger.http(`${request.method} ${url} - Completado`, {
			requestId,
			responseTime: `${responseTime.toFixed(2)}ms`,
			status: 200, // Asumimos 200 ya que no podemos acceder al código real aquí
		});

		// Actualizar estadísticas
		appMonitor.trackRequest(200, responseTime);

		// Decrementar contador de solicitudes pendientes
		appMonitor.trackPendingRequest(-1);

		return response;
	} catch (error) {
		// Calcular tiempo hasta el error
		const errorTime = performance.now() - startTime;

		// Registrar error
		middlewareLogger.error(`${request.method} ${url} - Error`, {
			requestId,
			error: error instanceof Error ? error.message : String(error),
			responseTime: `${errorTime.toFixed(2)}ms`,
		});

		// Actualizar estadísticas
		appMonitor.trackRequest(500, errorTime);
		appMonitor.trackError(error instanceof Error ? error : new Error(String(error)), 'middleware');

		// Decrementar contador de solicitudes pendientes
		appMonitor.trackPendingRequest(-1);

		// Continuar con la solicitud a pesar del error
		return NextResponse.next();
	}
}

// Configurar rutas para aplicar el middleware
export const config = {
	// Aplicar el middleware a todas las rutas
	matcher: '/:path*',
};
