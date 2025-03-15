'use client';

import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import * as React from 'react';

/**
 * Tipo para errores de tarjeta
 */
export interface CardError {
	code: string;
	message: string;
	details?: string;
	stack?: string;
}

/**
 * Opciones para el manejador de errores
 */
export interface ErrorHandlerOptions {
	onError?: (error: CardError) => void;
	logErrors?: boolean;
}

/**
 * Crea un manejador de errores para componentes de tarjeta
 */
export function createErrorHandler(options: ErrorHandlerOptions = {}) {
	const { onError, logErrors = true } = options;

	/**
	 * Maneja un error y lo procesa según las opciones
	 */
	const handleError = (error: unknown): CardError => {
		// Convertir el error a un formato estándar
		const cardError: CardError = {
			code: 'UNKNOWN_ERROR',
			message: 'Ha ocurrido un error desconocido',
		};

		if (error instanceof Error) {
			cardError.code = error.name || 'ERROR';
			cardError.message = error.message;
			cardError.stack = error.stack;
		} else if (typeof error === 'string') {
			cardError.message = error;
		} else if (error && typeof error === 'object') {
			// Intentar extraer información del objeto de error
			const errorObj = error as Record<string, unknown>;
			cardError.code = (errorObj.code || errorObj.name || 'ERROR') as string;
			cardError.message = (errorObj.message || 'Error desconocido') as string;
			cardError.details = errorObj.details as string;
		}

		// Registrar el error si está habilitado
		if (logErrors) {
			console.error('Error en EntityCard:', cardError);
		}

		// Notificar el error si hay un callback
		if (onError) {
			onError(cardError);
		}

		return cardError;
	};

	return {
		handleError,
	};
}

/**
 * Componente para mostrar errores de tarjeta
 */
export function CardErrorDisplay({
	error,
	onRetry,
	className,
}: {
	error: CardError;
	onRetry?: () => void;
	className?: string;
}) {
	return (
		<div
			className={`flex flex-col items-center justify-center p-4 border border-destructive/50 rounded-md bg-destructive/10 text-destructive-foreground ${className}`}
		>
			<AlertCircle className="h-8 w-8 mb-2" />
			<h3 className="text-lg font-semibold mb-1">{error.code}</h3>
			<p className="text-sm text-center mb-3">{error.message}</p>
			{error.details && <p className="text-xs text-center mb-3 opacity-80">{error.details}</p>}
			{onRetry && (
				<Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
					<RefreshCw className="h-4 w-4 mr-2" />
					Reintentar
				</Button>
			)}
		</div>
	);
}
