'use client';

/**
 * 🔄 Sistema unificado de registro de capas
 *
 * Este componente proporciona una manera consistente de registrar capas
 * independientemente de si provienen del sistema de implementaciones o componentes.
 * Actúa como un puente entre ambos sistemas asegurando que las propiedades
 * se transforman correctamente.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LayerComponent } from './layer-plugin-system';
import { useLayerPlugin } from './layer-plugin-system';
import type { LayerImplementation, LayerRenderProps } from './types';

// Importamos solo las capas básicas y comprobadas
import { borderLayerImplementation } from './border/border-layer-implementation';
import { chromaticAberrationLayerImplementation } from './chromatic-aberration';
import { filterLayerImplementation } from './filters';
import { glowLayerImplementation } from './glow/glow-layer-implementation';
import { holographicLayerImplementation } from './holographic/holographic-layer-implementation';
import { scanlinesLayerImplementation } from './scanlines';
import { textureLayerImplementation } from './textures';

// Lista de capas verificadas y testeadas
const VERIFIED_LAYERS: Record<string, LayerImplementation> = {
	border: borderLayerImplementation,
	glow: glowLayerImplementation,
	scanlines: scanlinesLayerImplementation,
	texture: textureLayerImplementation,
	'chromatic-aberration': chromaticAberrationLayerImplementation,
	'holographic': holographicLayerImplementation,
	'filter': filterLayerImplementation
};

/**
 * Transforma una implementación de capa en un componente de capa compatible
 * con el sistema de plugin.
 */
export function transformLayerImplementationToComponent(
	implementation: LayerImplementation,
	debugMode = false
): LayerComponent | null {
	// Validación exhaustiva de la implementación
	if (!implementation) {
		console.error('❌ Implementación de capa nula o indefinida');
		return null;
	}

	if (!implementation.type) {
		console.error('❌ Implementación de capa sin tipo definido');
		return null;
	}

	if (typeof implementation.render !== 'function') {
		console.error(`❌ Implementación de capa ${implementation.type} sin función render válida`);
		return null;
	}

	try {
		// Crear el componente adaptado que recibirá las props del sistema de plugins
		const Component = (props: any) => {
			try {
				// Adaptar props al formato esperado por la implementación
				const renderProps: LayerRenderProps = {
					config: props.config || {},
					isHovered: props.isHovered,
					isExploded: props.isExploded,
					isActive: props.activeLayer === implementation.type,
					mousePosition: props.mousePosition,
					entityType: props.entityType || 'default',
					entityId: props.entityId,
					context: props.context
				};

				// Llamar a la función render de la implementación
				return implementation.render(renderProps);
			} catch (error) {
				console.error(`❌ Error al renderizar componente de capa ${implementation.type}:`, error);
				return null;
			}
		};

		// Añadir nombre explícito para facilitar depuración
		Component.displayName = `${implementation.type.charAt(0).toUpperCase() + implementation.type.slice(1)}Layer`;

		// Crear componente de configuración si existe
		const SettingsComponent = implementation.Settings
			? (props: any) => {
				try {
					return implementation.Settings ?
						<implementation.Settings
							config={props.config || {}}
							onChange={props.onConfigUpdate}
							entityType={props.entityType || 'default'}
							entityId={props.entityId}
						/>
						: null;
				} catch (error) {
					console.error(`❌ Error al renderizar configuración de capa ${implementation.type}:`, error);
					return null;
				}
			}
			: undefined;

		// También asignar nombre al componente de configuración
		if (SettingsComponent) {
			SettingsComponent.displayName = `${implementation.type.charAt(0).toUpperCase() + implementation.type.slice(1)}Settings`;
		}

		// Validar configuración por defecto
		const defaultConfig = implementation.defaultConfig || {
			enabled: true,
			layerIndex: 0,
			type: implementation.type
		};

		// Ensamblar y retornar el componente de capa
		const result: LayerComponent = {
			type: implementation.type,
			Component,
			defaultConfig,
			SettingsComponent
		};

		// Verificar el resultado final
		if (!result.Component) {
			throw new Error(`La transformación no generó un componente válido para ${implementation.type}`);
		}

		if (debugMode) {
			console.log(`✅ Transformación exitosa de capa ${implementation.type}`);
		}

		return result;
	} catch (error) {
		console.error(`❌ Error al transformar capa ${implementation.type}:`, error);
		return null;
	}
}

/**
 * Componente de registro unificado de capas
 */
export function UnifiedLayerRegistration({
	additionalLayers = {},
	entityType,
	debug = false
}: {
	additionalLayers?: Record<string, LayerImplementation>;
	entityType?: string;
	debug?: boolean;
}) {
	const { registerLayer, clearLayers } = useLayerPlugin();
	const [registrationStatus, setRegistrationStatus] = useState<{
		success: string[];
		failed: string[];
	}>({
		success: [],
		failed: []
	});

	// Función segura para registrar una capa
	const registerSafely = useCallback((implementation: LayerImplementation, name: string) => {
		try {
			// Transformar implementación a componente
			const component = transformLayerImplementationToComponent(implementation, debug);

			if (!component) {
				throw new Error(`Transformación fallida para capa ${name}`);
			}

			// Registrar el componente
			registerLayer(component);

			if (debug) {
				console.log(`✅ Capa registrada exitosamente: ${name}`);
			}

			setRegistrationStatus(prev => ({
				success: [...prev.success, name],
				failed: prev.failed
			}));

			return true;
		} catch (error) {
			console.error(`❌ Error al registrar capa ${name}:`, error);

			setRegistrationStatus(prev => ({
				success: prev.success,
				failed: [...prev.failed, name]
			}));

			return false;
		}
	}, [registerLayer, debug]);

	// Efecto para registrar todas las capas
	// Memoizamos las dependencias explícitamente para evitar rerenderizados innecesarios
	const dependencyKey = useMemo(() => {
		const additionalLayersKeys = Object.keys(additionalLayers || {}).sort().join(',');
		return `${entityType || 'default'}-${additionalLayersKeys}-${debug ? 'debug' : 'normal'}`;
	}, [entityType, additionalLayers, debug]);

	useEffect(() => {
		if (debug) {
			console.log('🔍 Iniciando registro unificado de capas...');
		}

		// Limpiar capas existentes si es posible
		if (typeof clearLayers === 'function') {
			clearLayers();
			if (debug) console.log('🧹 Capas existentes limpiadas');
		} else {
			console.warn('⚠️ clearLayers no está disponible, omitiendo limpieza');
		}

		// Registrar las capas verificadas
		for (const [name, implementation] of Object.entries(VERIFIED_LAYERS)) {
			// Si se especificó un tipo de entidad, verificar compatibilidad
			if (entityType && implementation.compatibleEntityTypes &&
				!implementation.compatibleEntityTypes.includes(entityType) &&
				!implementation.compatibleEntityTypes.includes('default')) {
				if (debug) {
					console.log(`ℹ️ Capa ${name} no compatible con entidad ${entityType}, omitiendo`);
				}
				continue;
			}

			registerSafely(implementation, name);
		}

		// Registrar capas adicionales
		if (additionalLayers) {
			for (const [name, implementation] of Object.entries(additionalLayers)) {
				registerSafely(implementation, name);
			}
		}

		// Función de limpieza
		return () => {
			if (typeof clearLayers === 'function') {
				clearLayers();
				if (debug) console.log('🧹 Limpiando registro de capas al desmontar');
			}
		};
	}, [dependencyKey, registerSafely, clearLayers]);

	// Si está en modo debug, mostrar estadísticas
	if (debug) {
		return (
			<div className="layer-registration-debug hidden">
				<div>Capas registradas exitosamente: {registrationStatus.success.length}</div>
				<div>Capas fallidas: {registrationStatus.failed.length}</div>
			</div>
		);
	}

	// Normalmente no renderizamos nada visible
	return null;
}

/**
 * Componente de registro simplificado para usar en componentes de alto nivel
 */
export function RegisterAllLayers({
	additionalLayers,
	debug = false
}: {
	additionalLayers?: Record<string, LayerImplementation>;
	debug?: boolean;
}) {
	return (
		<UnifiedLayerRegistration
			additionalLayers={additionalLayers}
			debug={debug}
		/>
	);
}

/**
 * Componente de registro para un tipo de entidad específico
 */
export function RegisterLayersForEntity({
	entityType,
	additionalLayers,
	debug = false
}: {
	entityType: string;
	additionalLayers?: Record<string, LayerImplementation>;
	debug?: boolean;
}) {
	return (
		<UnifiedLayerRegistration
			entityType={entityType}
			additionalLayers={additionalLayers}
			debug={debug}
		/>
	);
}