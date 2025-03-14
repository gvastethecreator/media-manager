import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export function AnimationSettings() {
	return (
		<div className="space-y-4">
			<CardHeader>
				<CardTitle>Animación</CardTitle>
				<CardDescription>Configura las animaciones y transiciones de las tarjetas</CardDescription>
			</CardHeader>

			<div className="space-y-4">
				<div className="space-y-2">
					<h3 className="text-[10px] font-medium">Efectos</h3>
					<div className="space-y-2">
						<Label htmlFor="hoverEffect" className="text-[10px] font-medium">
							Efecto al Hover
						</Label>
						{/* Aquí irá el componente para seleccionar efecto hover */}
					</div>
					<div className="space-y-2">
						<Label htmlFor="clickEffect" className="text-[10px] font-medium">
							Efecto al Click
						</Label>
						{/* Aquí irá el componente para seleccionar efecto click */}
					</div>
				</div>

				<div className="space-y-2">
					<h3 className="text-[10px] font-medium">Transiciones</h3>
					<div className="space-y-2">
						<Label htmlFor="transitionDuration" className="text-[10px] font-medium">
							Duración de Transición
						</Label>
						{/* Aquí irá el componente para seleccionar duración */}
					</div>
					<div className="space-y-2">
						<Label htmlFor="transitionTiming" className="text-[10px] font-medium">
							Timing de Transición
						</Label>
						{/* Aquí irá el componente para seleccionar timing */}
					</div>
				</div>
			</div>
		</div>
	);
}
