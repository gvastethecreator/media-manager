import React from 'react';

interface DetailsPanelProps {
	className?: string;
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({ className = '' }) => {
	return (
		<div className={`details-panel bg-background border-l p-4 ${className}`}>
			<div className="space-y-4">
				<h2 className="text-lg font-semibold text-foreground">Panel de Detalles</h2>
				<div className="text-sm text-muted-foreground">
					<p>Aquí se mostrará información detallada de los elementos seleccionados.</p>
				</div>
				<div className="border rounded-lg p-3 bg-muted/50">
					<p className="text-sm text-muted-foreground">🚧 Panel en construcción...</p>
				</div>
			</div>
		</div>
	);
};

// Alias para compatibilidad
export const DetailsPanelV2 = DetailsPanel;

export default DetailsPanel;
