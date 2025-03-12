"use client";

import { DemoCard } from "@/components/features/entity-cards/base/demo-card";

export default function CardDemoPage() {
	return (
		<div className="container mx-auto py-10 px-4">
			<header className="mb-8 text-center">
				<h1 className="text-4xl font-bold mb-4">Demostración de BaseCard</h1>
				<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
					Esta demostración muestra las capacidades visuales de nuestro
					componente BaseCard. Utiliza efectos 3D, holográficos y de iluminación
					para crear una experiencia visual impactante.
				</p>
			</header>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
				<div className="flex flex-col items-center gap-6">
					<DemoCard showExplodeButton />
					<div className="text-center">
						<p className="text-sm text-muted-foreground">
							Haz clic en la tarjeta para más información o usa los botones para
							los distintos modos
						</p>
					</div>
				</div>

				<div className="bg-card p-6 rounded-lg border shadow">
					<h2 className="text-2xl font-semibold mb-4">
						Cómo funciona BaseCard
					</h2>

					<div className="space-y-4">
						<div>
							<h3 className="text-lg font-medium">Efectos visuales</h3>
							<p className="text-muted-foreground">
								BaseCard incorpora varios efectos visuales que pueden activarse
								o desactivarse:
							</p>
							<ul className="list-disc ml-6 mt-2 space-y-1 text-sm">
								<li>
									<strong>Efecto 3D:</strong> Rotación basada en la posición del
									cursor
								</li>
								<li>
									<strong>Efecto holográfico:</strong> Gradientes reactivos que
									cambian con el movimiento
								</li>
								<li>
									<strong>Líneas de escaneo:</strong> Efecto de monitor CRT
								</li>
								<li>
									<strong>Halo de luz:</strong> Reflejo que sigue al cursor con
									un desfase
								</li>
								<li>
									<strong>Bordes animados:</strong> Bordes que reaccionan al
									movimiento
								</li>
								<li>
									<strong>Efecto de brillo:</strong> Aura suave alrededor de la
									tarjeta
								</li>
								<li>
									<strong>Textura de grano:</strong> Ruido sutil para dar
									profundidad
								</li>
							</ul>
						</div>

						<div>
							<h3 className="text-lg font-medium">Vista explosionada 3D</h3>
							<p className="text-muted-foreground">
								El modo de vista explosionada permite separar las diferentes
								capas de efectos visuales en el espacio 3D para estudiar cómo
								están construidas. Este efecto está inspirado en ilustraciones
								técnicas que muestran las diferentes partes de un objeto.
							</p>
							<p className="text-muted-foreground mt-2">
								Para activarla, haz clic en el botón <strong>Explotar</strong>{" "}
								en la esquina superior derecha. En este modo puedes:
							</p>
							<ul className="list-disc ml-6 mt-2 space-y-1 text-sm">
								<li>Ver cada capa por separado</li>
								<li>Hacer hover sobre cada capa en el panel lateral</li>
								<li>Ajustar la rotación y separación de las capas</li>
								<li>Entender cómo se construyen los efectos visuales</li>
							</ul>
						</div>

						<div>
							<h3 className="text-lg font-medium">
								Configuración personalizada
							</h3>
							<p className="text-muted-foreground">
								Todos los efectos son configurables y pueden activarse o
								desactivarse según las necesidades de diseño. Utiliza el botón
								de configuración para ajustar estos parámetros en tiempo real.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
