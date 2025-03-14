'use client';

import { useEffect } from 'react';
import { useLayerPlugin } from './layer-plugin-system';

/**
 * Componente que registra las capas disponibles en el sistema de plugins
 * Este componente se monta una vez y registra todas las capas disponibles
 */
export function RegisterLayers() {
	const { registerLayer } = useLayerPlugin();

	useEffect(() => {
		// Este efecto se ejecuta una vez al montar el componente
		// Aquí registramos las capas disponibles

		// Ejemplo de una capa minimal para que compile
		const minimalLayer = {
			type: 'minimal',
			defaultConfig: {
				enabled: true,
				layerIndex: 0,
			},
			component: () => null, // Componente vacío
		};

		// Registrar capa minimal
		registerLayer(minimalLayer);

		// Limpieza al desmontar
		return () => {
			// No es necesario limpiar en este caso
		};
	}, [registerLayer]);

	// Este componente no renderiza nada visible
	return null;
}
