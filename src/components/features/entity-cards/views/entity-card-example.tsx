'use client';

import { useEffect, useState } from 'react';
import { EntityCard } from '../entity-card';
import type { CardOptions } from '../types/card-settings-types';

/**
 * Componente de ejemplo que muestra cómo usar EntityCard
 * con todos los módulos migrados
 */
export function EntityCardExample() {
	// Estado para las opciones de la tarjeta
	const [cardOptions, setCardOptions] = useState<CardOptions>({
		// Configuración inicial con los valores para cada módulo
		designSystem: {
			preset: 'modern',
			cornerStyle: 'rounded',
			cornerRadius: 12,
			shadowStyle: 'soft',
			elevation: 2,
			backgroundColor: '#ffffff',
			textColor: '#333333',
			accentColor: '#3b82f6',
			borderStyle: 'solid',
			borderWidth: 1,
			borderColor: '#e5e7eb',
			glassEffect: true,
		},
		animation: {
			preset: 'smooth',
			hoverEffect: 'scale',
			transition: 'ease',
			duration: 300,
			enableParallax: true,
			enableRotation: true,
		},
		backside: {
			enabled: true,
			layoutType: 'standard',
			colorMode: 'inherit',
			opacity: 0.95,
			blurBackground: true,
			blurAmount: 10,
			showAttributes: true,
			showDescription: true,
			showStats: true,
			flipAnimation: 'rotate',
			flipDuration: 600,
		},
		layers: {
			// Configuración de capas
			items: [
				{ id: 'base', type: 'base', enabled: true, order: 0 },
				{ id: 'filters', type: 'filters', enabled: true, order: 1 },
				{ id: 'effects', type: 'effects', enabled: true, order: 2 },
			],
		},
	});

	// Función para actualizar las opciones
	const handleOptionsChange = (newOptions: CardOptions) => {
		setCardOptions(newOptions);
	};

	return (
		<div className="w-full max-w-md mx-auto my-8 p-4">
			<h2 className="text-2xl font-bold mb-4 text-center">Tarjeta de Entidad con Módulos</h2>

			<div className="w-full aspect-[3/4] mb-8">
				<EntityCard
					id="example-card"
					title="Tarjeta de Ejemplo"
					description="Esta tarjeta utiliza todos los módulos migrados para demostrar la arquitectura modular."
					image="/example-image.jpg"
					backsideContent={
						<div className="p-4">
							<h3 className="text-xl font-bold mb-2">Detalles Adicionales</h3>
							<p>Esta es la cara posterior de la tarjeta que utiliza el módulo BacksideLayer.</p>
							<ul className="list-disc pl-5 mt-3">
								<li>Atributo 1: Valor 1</li>
								<li>Atributo 2: Valor 2</li>
								<li>Atributo 3: Valor 3</li>
							</ul>
						</div>
					}
					options={cardOptions}
					onOptionsChange={handleOptionsChange}
					enableBackside={true}
					enableDesign={true}
					enableAnimation={true}
					enableLayers={true}
					enablePerformance={true}
					enableEffects={true}
				/>
			</div>

			<div className="text-center text-sm text-gray-600">
				<p>Haz clic en la tarjeta para ver la cara posterior.</p>
				<p className="mt-2">
					Todos los módulos están activados: Diseño, Animación, Capas, Backside, Performance, Efectos
				</p>
			</div>
		</div>
	);
}
