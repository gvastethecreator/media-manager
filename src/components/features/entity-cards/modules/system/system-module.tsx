'use client';

import { deepMerge } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { SystemPanel } from './system-panel';
import { DEFAULT_SYSTEM_CONFIG, SystemConfig, SystemModuleProps } from './types';
import { SystemProvider } from './use-system';

/**
 * 🧩 Módulo de sistema para Entity Cards
 *
 * Este módulo proporciona configuraciones para sistemas de rareza, texturas y categorías
 * que pueden ser aplicados a las tarjetas de entidad.
 */
export function SystemModule({ config: initialConfig = {}, onChange, entityType }: SystemModuleProps) {
	const [config, setConfig] = useState<SystemConfig>(
		() => deepMerge(DEFAULT_SYSTEM_CONFIG, initialConfig) as SystemConfig
	);

	// Actualizar la configuración cuando cambian las props
	useEffect(() => {
		setConfig((prevConfig) => deepMerge(prevConfig, initialConfig) as SystemConfig);
	}, [initialConfig]);

	// Manejar cambios en la configuración
	const handleConfigChange = (newConfig: SystemConfig) => {
		setConfig(newConfig);
		onChange?.(newConfig);
	};

	return (
		<SystemProvider initialConfig={config}>
			<div className="space-y-4">
				<SystemPanel config={config} onChange={handleConfigChange} entityType={entityType} />
			</div>
		</SystemProvider>
	);
}

/**
 * 🧩 Módulo de sistema para Entity Cards (versión standalone)
 *
 * Esta versión del módulo puede ser usada fuera del contexto de Entity Cards.
 */
export function StandaloneSystemModule({ config: initialConfig = {}, onChange, entityType }: SystemModuleProps) {
	return <SystemModule config={initialConfig} onChange={onChange} entityType={entityType} />;
}
