import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { CardOptions } from '@/types/card';

interface PreviewSettingsProps {
	options: CardOptions;
	onChange: (options: CardOptions) => void;
	disabled?: boolean;
}

export function PreviewSettings({ options, onChange, disabled = false }: PreviewSettingsProps) {
	return (
		<div className="space-y-4">
			<CardHeader className="pb-3">
				<CardTitle className="text-[11px] font-medium">Vista Previa</CardTitle>
				<CardDescription className="text-[10px] text-muted-foreground">
					Configura la visualización de la tarjeta en modo vista previa
				</CardDescription>
			</CardHeader>

			<div className="space-y-4">
				<div className="space-y-2">
					<h3 className="text-[10px] font-medium">Tamaño</h3>
					<div className="space-y-2">
						<Label htmlFor="size" className="text-[10px] font-medium">
							Tamaño de Vista Previa
						</Label>
						{/* Aquí irá el componente para seleccionar tamaño */}
					</div>
				</div>

				<div className="space-y-2">
					<h3 className="text-[10px] font-medium">Opciones</h3>
					<div className="space-y-2">
						<Label htmlFor="showControls" className="text-[10px] font-medium">
							Mostrar Controles
						</Label>
						{/* Aquí irá el componente para mostrar/ocultar controles */}
					</div>
					<div className="space-y-2">
						<Label htmlFor="showInfo" className="text-[10px] font-medium">
							Mostrar Información
						</Label>
						{/* Aquí irá el componente para mostrar/ocultar información */}
					</div>
				</div>
			</div>
		</div>
	);
}
