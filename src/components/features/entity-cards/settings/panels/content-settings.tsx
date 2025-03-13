import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { CardOptions } from '@/types/card';

interface ContentSettingsProps {
	options: CardOptions;
	onChange: (options: CardOptions) => void;
	disabled?: boolean;
}

export function ContentSettings({ options, onChange, disabled = false }: ContentSettingsProps) {
	return (
		<div className="space-y-4">
			<CardHeader className="pb-3">
				<CardTitle className="text-[11px] font-medium">Contenido</CardTitle>
				<CardDescription className="text-[10px] text-muted-foreground">
					Configura el contenido y la información mostrada en la tarjeta
				</CardDescription>
			</CardHeader>

			<div className="space-y-4">
				<div className="space-y-2">
					<h3 className="text-[10px] font-medium">Campos</h3>
					<div className="space-y-2">
						<Label htmlFor="fields" className="text-[10px] font-medium">
							Campos a Mostrar
						</Label>
						{/* Aquí irá el componente para seleccionar campos */}
					</div>
				</div>

				<div className="space-y-2">
					<h3 className="text-[10px] font-medium">Orden</h3>
					<div className="space-y-2">
						<Label htmlFor="order" className="text-[10px] font-medium">
							Orden de Campos
						</Label>
						{/* Aquí irá el componente para ordenar campos */}
					</div>
				</div>
			</div>
		</div>
	);
}
