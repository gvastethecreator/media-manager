import { deepMerge } from '@/lib/utils';
import type { EffectsConfig } from '../modules/effects/types';

/**
 * Tipo para los callbacks de suscripción
 */
type SubscriptionCallback = () => void;

/**
 * Interfaz para el estado del almacén de efectos
 */
export interface EffectsStoreState {
	enabledModules: Set<string>;
	effects: Partial<EffectsConfig>;
}

/**
 * Creador del almacén centralizado para la configuración de efectos
 *
 * Este store permite:
 * - Activar/desactivar módulos específicos
 * - Gestionar configuraciones de efectos
 * - Proporcionar un punto único de acceso para el estado de debug
 * - Suscribirse a cambios en el estado
 */
export const createEffectsStore = () => {
	// Estado inicial
	const state: EffectsStoreState = {
		enabledModules: new Set<string>(),
		effects: {},
	};

	// Lista de suscriptores
	const subscribers = new Set<SubscriptionCallback>();

	// Función para notificar a los suscriptores
	const notifySubscribers = () => {
		const subscribersArray = Array.from(subscribers);
		for (const callback of subscribersArray) {
			callback();
		}
	};

	// Getters para acceder al estado
	const getState = () => state;
	const isModuleEnabled = (name: string) => state.enabledModules.has(name);
	const getEffects = () => state.effects;

	// Setters para modificar el estado
	const enableModule = (name: string) => {
		state.enabledModules.add(name);
		notifySubscribers();
		return state;
	};

	const disableModule = (name: string) => {
		state.enabledModules.delete(name);
		notifySubscribers();
		return state;
	};

	const toggleModule = (name: string) => {
		if (isModuleEnabled(name)) {
			disableModule(name);
		} else {
			enableModule(name);
		}
		return state;
	};

	const updateEffects = (config: Partial<EffectsConfig>) => {
		state.effects = deepMerge(state.effects, config) as Partial<EffectsConfig>;
		notifySubscribers();
		return state;
	};

	const resetEffects = () => {
		state.effects = {};
		notifySubscribers();
		return state;
	};

	const resetModules = () => {
		state.enabledModules.clear();
		notifySubscribers();
		return state;
	};

	// Sistema de suscripción
	const subscribe = (callback: SubscriptionCallback) => {
		subscribers.add(callback);
		return () => {
			subscribers.delete(callback);
		};
	};

	// Retornar API pública
	return {
		getState,
		isModuleEnabled,
		getEffects,
		enableModule,
		disableModule,
		toggleModule,
		updateEffects,
		resetEffects,
		resetModules,
		subscribe,
	};
};

/**
 * Instancia global del almacén de efectos
 */
export const effectsStore = createEffectsStore();

/**
 * Módulos disponibles
 */
export const EFFECT_MODULES = {
	VISUAL: 'visual',
	ADVANCED: 'advanced',
};
