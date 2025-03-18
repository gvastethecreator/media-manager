import { serverLogger } from '../logger/server-logger';

// Interfaz para las opciones del logger de acciones
interface ActionLoggerOptions {
	showParams?: boolean;
	showResult?: boolean;
	sensitiveParamFields?: string[];
	sensitiveResultFields?: string[];
}

// Opciones predeterminadas
const defaultOptions: ActionLoggerOptions = {
	showParams: true,
	showResult: true,
	sensitiveParamFields: ['password', 'token', 'secret', 'key'],
	sensitiveResultFields: ['password', 'token', 'secret', 'key'],
};

/**
 * Logger específico para Server Actions con funciones mejoradas
 */
export const actionLogger = {
	/**
	 * Crea un logger para una acción específica
	 * @param actionName Nombre de la acción del servidor
	 * @param options Opciones de configuración
	 */
	createActionLogger: (actionName: string, customOptions: Partial<ActionLoggerOptions> = {}) => {
		const options = { ...defaultOptions, ...customOptions };
		const logger = serverLogger.withContext(`Action:${actionName}`);

		// Función para filtrar campos sensibles
		const filterSensitiveData = (obj: any, sensitiveFields: string[]): any => {
			if (!obj || typeof obj !== 'object') return obj;

			if (Array.isArray(obj)) {
				return obj.map((item) => filterSensitiveData(item, sensitiveFields));
			}

			const result = { ...obj };
			for (const key of Object.keys(result)) {
				if (sensitiveFields.includes(key.toLowerCase())) {
					result[key] = '[REDACTED]';
				} else if (typeof result[key] === 'object' && result[key] !== null) {
					result[key] = filterSensitiveData(result[key], sensitiveFields);
				}
			}
			return result;
		};

		return {
			/**
			 * Envuelve una función de acción del servidor con logging
			 * @param actionFn Función de acción del servidor a envolver
			 * @returns Función envuelta con logging
			 */
			wrapAction: <T extends (...args: any[]) => Promise<any>>(actionFn: T): T => {
				const wrappedAction = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
					const actionId = `action_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
					const startTime = Date.now();

					// Registrar inicio de la acción
					if (options.showParams) {
						const filteredParams = filterSensitiveData(args, options.sensitiveParamFields || []);
						logger.info(
							`Iniciando acción ${actionName}`,
							{
								params: filteredParams,
								actionId,
							},
							actionId
						);
					} else {
						logger.info(`Iniciando acción ${actionName}`, { actionId }, actionId);
					}

					try {
						// Ejecutar la acción original
						const result = await actionFn(...args);
						const executionTime = Date.now() - startTime;

						// Registrar éxito
						if (options.showResult) {
							const filteredResult = filterSensitiveData(result, options.sensitiveResultFields || []);
							logger.success(
								`Acción ${actionName} completada en ${executionTime}ms`,
								{
									result: filteredResult,
									executionTime: `${executionTime}ms`,
									actionId,
								},
								actionId
							);
						} else {
							logger.success(
								`Acción ${actionName} completada en ${executionTime}ms`,
								{
									executionTime: `${executionTime}ms`,
									actionId,
								},
								actionId
							);
						}

						return result;
					} catch (error) {
						const executionTime = Date.now() - startTime;

						// Registrar error
						logger.error(
							`Error en acción ${actionName}: ${(error as Error).message}`,
							{
								error: {
									name: (error as Error).name,
									message: (error as Error).message,
									stack: (error as Error).stack,
								},
								executionTime: `${executionTime}ms`,
								actionId,
							},
							actionId
						);

						// Re-lanzar el error para que pueda ser manejado por el llamador
						throw error;
					}
				};

				return wrappedAction as T;
			},

			// Exponer el logger base para otras operaciones
			logger,
		};
	},
};
