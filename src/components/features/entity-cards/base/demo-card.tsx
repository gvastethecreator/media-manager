"use client";

import { BaseCard } from "@/components/features/entity-cards/base/base-card";
import { VisualizationConfig } from "@/components/features/entity-cards/base/visualization-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Calendar,
	Code,
	Code2,
	Layers,
	LayoutDashboard,
	Mail,
	Monitor,
	Palette,
	Settings2,
	Star,
	User,
} from "lucide-react";
import React from "react";

// Opciones predeterminadas para la demostración
const DEFAULT_OPTIONS = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlines: true,
	enableLightHalo: true,
	enableAnimatedBorder: true,
	enableGlowEffect: true,
	enableGrainEffect: true,
	hoverLiftHeight: 15,
	maxRotation: 15,
	primaryColor: "var(--color-primary)",
	secondaryColor: "var(--color-secondary)",
};

// Capas para la vista explosionada
const EXPLODE_LAYERS = [
	{
		id: "content",
		label: "Contenido",
		icon: <div className="w-3 h-3 bg-primary rounded-sm" />,
	},
	{
		id: "border",
		label: "Borde",
		icon: <div className="w-3 h-3 border border-primary rounded-sm" />,
	},
	{
		id: "grain",
		label: "Textura",
		icon: <div className="w-3 h-3 bg-slate-400 opacity-50 rounded-sm" />,
	},
	{
		id: "halo",
		label: "Halo",
		icon: <div className="w-3 h-3 bg-blue-300 rounded-full opacity-60" />,
	},
	{
		id: "scanlines",
		label: "Líneas",
		icon: (
			<div className="w-3 h-3 bg-slate-200 flex flex-col justify-between">
				<div className="h-[1px] bg-slate-400" />
				<div className="h-[1px] bg-slate-400" />
			</div>
		),
	},
	{
		id: "holographic",
		label: "Holo",
		icon: (
			<div className="w-3 h-3 bg-gradient-to-tr from-purple-400 to-blue-300 opacity-60" />
		),
	},
];

interface DemoCardProps {
	showExplodeButton?: boolean;
}

export function DemoCard({ showExplodeButton = false }: DemoCardProps) {
	// Estado para el modal de configuración
	const [configOpen, setConfigOpen] = React.useState(false);

	// Estado para las opciones de la tarjeta
	const [cardOptions, setCardOptions] = React.useState({ ...DEFAULT_OPTIONS });

	return (
		<>
			<BaseCard
				options={cardOptions}
				className="w-full max-w-md aspect-square"
				showVisualizationConfig={true}
				onVisualizationConfigClick={() => setConfigOpen(true)}
				enableExplode={showExplodeButton}
				explodeLayers={EXPLODE_LAYERS}
				onClick={() => {
					alert("¡Tarjeta clickeada!");
				}}
			>
				<div className="h-full flex flex-col p-4">
					{/* Encabezado de la tarjeta */}
					<div className="flex items-center gap-3 mb-4">
						<div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
							<Code2 className="w-6 h-6 text-primary" />
						</div>
						<div>
							<h2 className="text-xl font-semibold">Componente BaseCard</h2>
							<p className="text-xs text-muted-foreground">
								Demostración interactiva
							</p>
						</div>
					</div>

					{/* Contenido principal */}
					<div className="bg-muted/50 rounded-lg p-4 flex-1 space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<p className="text-sm font-medium">Características</p>
								<div className="space-y-1">
									<Badge
										variant="outline"
										className="flex w-full gap-1.5 justify-start px-2 py-1"
									>
										<Layers size={13} /> <span>Capas visuales</span>
									</Badge>
									<Badge
										variant="outline"
										className="flex w-full gap-1.5 justify-start px-2 py-1"
									>
										<Monitor size={13} /> <span>Efectos holográficos</span>
									</Badge>
									<Badge
										variant="outline"
										className="flex w-full gap-1.5 justify-start px-2 py-1"
									>
										<Palette size={13} /> <span>Personalizable</span>
									</Badge>
								</div>
							</div>

							<div className="space-y-2">
								<p className="text-sm font-medium">Tecnologías</p>
								<div className="space-y-1">
									<Badge
										variant="outline"
										className="flex w-full gap-1.5 justify-start px-2 py-1"
									>
										<LayoutDashboard size={13} /> <span>React 19</span>
									</Badge>
									<Badge
										variant="outline"
										className="flex w-full gap-1.5 justify-start px-2 py-1"
									>
										<Code size={13} /> <span>TailwindCSS</span>
									</Badge>
									<Badge
										variant="outline"
										className="flex w-full gap-1.5 justify-start px-2 py-1"
									>
										<Star size={13} /> <span>Motion/React</span>
									</Badge>
								</div>
							</div>
						</div>

						<div>
							<p className="text-sm font-medium mb-2">Descripción</p>
							<p className="text-sm text-muted-foreground">
								Esta tarjeta demuestra los efectos visuales avanzados y
								personalizables que se pueden lograr con el componente BaseCard.
								Mueve el cursor sobre la tarjeta para experimentar efectos 3D y
								holográficos.
							</p>
						</div>
					</div>

					{/* Pie de la tarjeta */}
					<div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
						<div className="flex gap-3">
							<Button
								size="sm"
								variant="ghost"
								className="flex items-center gap-1.5 text-xs h-8"
							>
								<User size={14} />
								<span>Perfil</span>
							</Button>
							<Button
								size="sm"
								variant="ghost"
								className="flex items-center gap-1.5 text-xs h-8"
							>
								<Calendar size={14} />
								<span>Agenda</span>
							</Button>
						</div>
						<Button
							size="sm"
							variant="default"
							className="flex items-center gap-1.5 text-xs h-8"
						>
							<Mail size={14} />
							<span>Contacto</span>
						</Button>
					</div>
				</div>
			</BaseCard>

			{/* Modal de configuración */}
			{configOpen && (
				<VisualizationConfig
					options={cardOptions}
					onOptionsChange={(newOptions) => {
						setCardOptions((prev) => ({ ...prev, ...newOptions }));
					}}
					onClose={() => setConfigOpen(false)}
				/>
			)}
		</>
	);
}
