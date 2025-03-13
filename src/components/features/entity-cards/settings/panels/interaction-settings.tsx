import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { CardOptions } from '@/types/card';

interface InteractionSettingsProps {
	options: CardOptions;
	onChange: (options: CardOptions) => void;
	disabled?: boolean;
}

export function InteractionSettings({ options, onChange, disabled = false }: InteractionSettingsProps) {
	return (
		<div className="space-y-4">
			<CardHeader className="pb-3">
				<CardTitle className="text-[11px] font-medium">Interacción</CardTitle>
				<CardDescription className="text-[10px] text-muted-foreground">
					Configura el comportamiento y las acciones de la tarjeta
				</CardDescription>
			</CardHeader>

			<div className="space-y-4">
				<div className="space-y-2">
					<h3 className="text-[10px] font-medium">Acciones</h3>
					<div className="space-y-2">
						<Label htmlFor="clickAction" className="text-[10px] font-medium">
							Acción al Click
						</Label>
						{/* Aquí irá el componente para seleccionar acción click */}
					</div>
					<div className="space-y-2">
						<Label htmlFor="hoverAction" className="text-[10px] font-medium">
							Acción al Hover
						</Label>
						{/* Aquí irá el componente para seleccionar acción hover */}
					</div>
				</div>

				<div className="space-y-2">
					<h3 className="text-[10px] font-medium">Comportamiento</h3>
					<div className="space-y-2">
						<Label htmlFor="dragEnabled" className="text-[10px] font-medium">
							Permitir Arrastrar
						</Label>
						{/* Aquí irá el componente para activar/desactivar arrastre */}
					</div>
					<div className="space-y-2">
						<Label htmlFor="resizeEnabled" className="text-[10px] font-medium">
							Permitir Redimensionar
						</Label>
						{/* Aquí irá el componente para activar/desactivar redimensionamiento */}
					</div>
				</div>
			</div>
		</div>
	);
}
