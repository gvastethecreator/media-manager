/**
 * @file Funciones de serialización para la entidad Wildcard.
 * @module transformers/wildcard/serializers
 * @description Contiene funciones para manejar la serialización de campos complejos (JSON) de la entidad Wildcard.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { TransformerError } from '@/utils/transformers/errors';

const logger = serverLogger.withContext('WildcardSerializers');

/**
 * 🃏 Parsea el campo `children` de un Wildcard, que se almacena como un string JSON.
 * @param childrenJson El string JSON que representa los hijos del wildcard.
 * @returns Un array de objetos (los hijos deserializados) o un array vacío si el input es nulo o inválido.
 * @throws {TransformerError} Si el string JSON es malformado.
 */
export function deserializeWildcardChildren(childrenJson: string | null | undefined): unknown[] {
	if (!childrenJson || childrenJson === '[]') {
		return [];
	}

	try {
		const parsed = JSON.parse(childrenJson);
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		logger.error('Error deserializando los hijos del wildcard.', { error, childrenJson });
		throw new TransformerError('El formato de los hijos del wildcard es inválido.');
	}
}

/**
 * 🃏 Serializa el campo `children` de un Wildcard a un string JSON para almacenarlo en la base de datos.
 * @param children El array de hijos del wildcard a serializar.
 * @returns Un string JSON que representa a los hijos.
 * @throws {TransformerError} Si la serialización a JSON falla.
 */
export function serializeWildcardChildren(children: unknown[] | undefined): string {
	if (!children || children.length === 0) {
		return '[]';
	}

	try {
		return JSON.stringify(children);
	} catch (error) {
		logger.error('Error serializando los hijos del wildcard.', { error, children });
		throw new TransformerError('No se pudieron serializar los hijos del wildcard.');
	}
}
