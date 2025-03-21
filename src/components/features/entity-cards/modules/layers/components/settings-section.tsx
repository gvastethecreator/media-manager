'use client';

import type React from 'react';

interface SettingsSectionProps {
	title: string;
	description?: string;
	children: React.ReactNode;
}

/**
 * 🔧 Componente para secciones de configuración
 * Proporciona una estructura consistente para secciones en paneles de configuración
 */
export function SettingsSection({ title, description, children }: SettingsSectionProps) {
	return (
		<div className="space-y-3 pb-4">
			<div className="space-y-1">
				<h4 className="text-sm font-medium">{title}</h4>
				{description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
			</div>
			<div className="pt-1">{children}</div>
		</div>
	);
}

export default SettingsSection;