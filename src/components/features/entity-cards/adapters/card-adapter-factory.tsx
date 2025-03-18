'use client';

import type { FunctionComponent } from 'react';
import * as React from 'react';
import { useMemo } from 'react';
import type { CardOptions } from '../types/unified-card-types';

/**
 * Tipo base para las propiedades de un adaptador de tarjeta
 */
export interface BaseCardAdapterProps {
	options?: Partial<CardOptions>;
	onClick?: () => void;
	showVisualConfig?: boolean;
	onVisualConfigClick?: () => void;
	enableExplode?: boolean;
	isExploded?: boolean;
	activeLayer?: string | null;
	onExplodedChange?: (isExploded: boolean) => void;
	onActiveLayerChange?: (layerId: string | null) => void;
	className?: string;
}

/**
 * Crea una función adaptadora para un tipo específico de entidad
 * @param CardLayout El componente de layout a utilizar
 * @param entityKey El nombre del prop para la entidad (ej: "folder", "album")
 * @returns Una función de componente adaptador
 */
export function createCardAdapter<
	T,
	P extends BaseCardAdapterProps & { [K in EntityKey]: T },
	EntityKey extends string,
>(CardLayout: FunctionComponent<P>, entityKey: EntityKey) {
	// Define el tipo para las propiedades del adaptador
	type AdapterProps = BaseCardAdapterProps & { [K in EntityKey]: T };

	// Devuelve un componente adaptador que pasa todas las propiedades al layout
	return function CardAdapter(props: AdapterProps) {
		// Crear un objeto de propiedades para pasar al CardLayout
		const layoutProps = useMemo(() => {
			return { ...props } as unknown as P;
		}, [props]);

		// Renderizar el componente con las propiedades
		return React.createElement(CardLayout, layoutProps);
	};
}

/**
 * Crea una función adaptadora para un layout que tiene una interfaz de props distinta
 * @param CardLayout El componente de layout a utilizar
 * @param entityKey El nombre del prop para la entidad (ej: "folder", "album")
 * @param propsMapper Función que transforma las propiedades del adaptador a las propiedades del layout
 * @returns Una función de componente adaptador
 */
export function createCustomCardAdapter<T, P extends object, EntityKey extends string>(
	CardLayout: React.ComponentType<P>,
	entityKey: EntityKey,
	propsMapper: (props: BaseCardAdapterProps & { [K in EntityKey]: T }) => P
) {
	// Define el tipo para las propiedades del adaptador
	type AdapterProps = BaseCardAdapterProps & { [K in EntityKey]: T };

	// Devuelve un componente adaptador que transforma las propiedades según el mapper
	return function CustomCardAdapter(props: AdapterProps) {
		// Transformar propiedades usando el mapper y memoizar el resultado
		const layoutProps = useMemo(() => {
			return propsMapper(props);
		}, [props, propsMapper]);

		// Renderizar el componente con las propiedades transformadas
		return React.createElement(CardLayout as React.ComponentType<P>, layoutProps);
	};
}

/**
 * NOTA: Para crear adaptadores personalizados, se recomienda crear un componente específico
 * que haga la transformación de propiedades directamente, en lugar de usar una función factory.
 *
 * Ejemplo:
 *
 * ```tsx
 * function CustomAlbumAdapter(props: BaseCardAdapterProps & { album: Album }) {
 *   const transformedProps = useMemo(() => {
 *     // Transformar props aquí
 *     return {
 *       // Propiedades transformadas
 *     };
 *   }, [props]);
 *
 *   return <AlbumCardLayout {...transformedProps} />;
 * }
 * ```
 */
