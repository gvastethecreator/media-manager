'use client';

/**
 * VERSIÓN SIMPLIFICADA DEL WRAPPER
 *
 * Esta versión actúa como punto de compatibilidad para vistas existentes,
 * delegando la funcionalidad al EntityCardAdapter básico.
 */

import { EntityCardAdapter } from './entity-card-adapter';

export interface EntityCardWrapperProps {
	entityType: string;
	entityId?: string;
	title?: string;
	description?: string;
	image?: string;
	options?: any;
	className?: string;
	children?: React.ReactNode;
	onClick?: () => void;
	entity?: any;
}

/**
 * Componente wrapper simplificado para mantener compatibilidad con el código existente
 */
export function EntityCardWrapper(props: EntityCardWrapperProps) {
	// Extraer propiedades
	const {
		entityType,
		entityId,
		title,
		description,
		image,
		options,
		className,
		onClick,
		entity,
	} = props;

	// Preparar la entidad para el adaptador
	const adaptedEntity = entity || {
		id: entityId || 'unknown',
		name: title || 'Sin título',
		description: description || '',
		featuredImage: image,
	};

	// En esta versión simplificada, siempre usamos el adaptador básico
	return (
		<EntityCardAdapter
			entityType={entityType}
			entity={adaptedEntity}
			options={options}
			className={className}
			onClick={onClick}
		/>
	);
}
