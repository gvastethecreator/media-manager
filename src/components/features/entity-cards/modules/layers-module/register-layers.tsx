'use client';

/**
 * ⚠️ ARCHIVO ADAPTADOR - SISTEMA LEGADO
 *
 * Este archivo es un adaptador para mantener la compatibilidad con código que importa
 * desde esta ubicación. Todas las funcionalidades son re-exportadas desde la implementación principal.
 *
 * Por favor, actualiza las importaciones para usar directamente:
 * `@/components/features/entity-cards/layers/register-all-layers`
 * o `@/components/features/entity-cards/layers/register-layers`
 */

// Importar desde la implementación principal
import { RegisterLayers as MainRegisterLayers } from '../../layers/register-layers';
import type { LayerImplementation } from '../../layers/types';

// Re-exportar con los mismos nombres para mantener compatibilidad
export { RegisterAllLayers, RegisterLayersByEntityType } from '../../layers/register-all-layers';
export { RegisterLayers } from '../../layers/register-layers';

// Función para registrar capas personalizadas - mantenida por compatibilidad
export function RegisterCustomLayers({
	layers,
	clearExisting = true
}: {
	layers: LayerImplementation[];
	clearExisting?: boolean;
}) {
	// Simplemente delegamos a RegisterLayers
	return <MainRegisterLayers additionalLayers={Object.fromEntries(layers.map(l => [l.type, l]))} />;
}
