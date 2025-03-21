'use client';

import type * as React from 'react';
import { RegisterLayers } from './register-layers';

/**
 * 🔌 Componente que registra todas las capas del sistema
 * Este componente es un punto central para registrar todas las capas disponibles
 * en el sistema, independientemente del tipo de entidad.
 */
export function RegisterAllLayers(): React.ReactElement | null {
	return <RegisterLayers />;
}

/**
 * 🔌 Registra capas específicas para un tipo de entidad
 * Este componente permite registrar solo las capas relevantes para un tipo de entidad específico.
 */
export function RegisterLayersByEntityType({
	entityType,
}: {
	entityType: string;
}): React.ReactElement | null {
	// En una implementación futura, aquí se pueden registrar
	// solo las capas específicas para ciertos tipos de entidad
	return <RegisterLayers />;
}