'use server';

import { actionLogger } from '@/lib/server/action-logger';

// Crear un logger específico para estas acciones
const testActionLogger = actionLogger.createActionLogger('TestActions');

/**
 * Acción de ejemplo que simula un procesamiento exitoso
 */
export const successAction = testActionLogger.wrapAction(async (data: any) => {
	// Simular algún procesamiento
	await new Promise((resolve) => setTimeout(resolve, 300));

	// Devolver un resultado exitoso
	return {
		success: true,
		message: 'Acción completada con éxito',
		processedData: {
			...data,
			timestamp: new Date().toISOString(),
		},
	};
});

/**
 * Acción de ejemplo que simula un error
 */
export const errorAction = testActionLogger.wrapAction(async (shouldFail: boolean = true) => {
	// Simular algún procesamiento
	await new Promise((resolve) => setTimeout(resolve, 200));

	// Simular un error si shouldFail es true
	if (shouldFail) {
		throw new Error('Error simulado en la acción del servidor');
	}

	// Devolver un resultado exitoso si no hay error
	return {
		success: true,
		message: 'La acción no falló como se esperaba',
	};
});

/**
 * Acción de ejemplo que realiza operaciones con datos sensibles
 */
export const sensitiveDataAction = testActionLogger.wrapAction(
	async (userData: { username: string; email: string; password: string }) => {
		// Simular algún procesamiento
		await new Promise((resolve) => setTimeout(resolve, 250));

		// Devolver un resultado que incluye datos sensibles (que serán redactados en los logs)
		return {
			success: true,
			message: 'Usuario procesado correctamente',
			user: {
				username: userData.username,
				email: userData.email,
				token: 'jwt-token-super-secreto-123456',
			},
		};
	}
);
