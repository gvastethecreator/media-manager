/**
 * @file Componente de configuración para el reindexado estructurado
 * @description Permite al usuario configurar las opciones del nuevo flujo de reindexado
 */

import { Clock, FileText, Image, Settings, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch-v3';

interface StructuredReindexConfigProps {
	isOpen: boolean;
	onToggle: () => void;
	useStructuredFlow: boolean;
	onUseStructuredFlowChange: (value: boolean) => void;
	skipThumbnails: boolean;
	onSkipThumbnailsChange: (value: boolean) => void;
	skipMetadata: boolean;
	onSkipMetadataChange: (value: boolean) => void;
	disabled?: boolean;
}

export function StructuredReindexConfig({
	isOpen,
	onToggle,
	useStructuredFlow,
	onUseStructuredFlowChange,
	skipThumbnails,
	onSkipThumbnailsChange,
	skipMetadata,
	onSkipMetadataChange,
	disabled = false,
}: StructuredReindexConfigProps) {
	if (!isOpen) {
		return (
			<Button
				className="h-7 text-muted-foreground text-xs hover:text-foreground"
				disabled={disabled}
				onClick={onToggle}
				size="sm"
				variant="ghost"
			>
				<Settings className="mr-1 h-3 w-3" />
				Configuración avanzada
			</Button>
		);
	}

	return (
		<Card className="border-0 bg-muted/30 shadow-none">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Settings className="h-4 w-4 text-primary" />
						<CardTitle className="text-sm">Configuración de Reindexado</CardTitle>
					</div>
					<Button className="h-6 w-6 p-0" onClick={onToggle} size="sm" variant="ghost">
						✕
					</Button>
				</div>
				<CardDescription className="text-xs">Configura el comportamiento del proceso de reindexado</CardDescription>
			</CardHeader>

			<CardContent className="space-y-4">
				{/* Tipo de flujo */}
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<Label className="flex items-center gap-2 font-medium text-sm" htmlFor="structured-flow">
								<Zap className="h-3.5 w-3.5 text-dt-primary-500" />
								Flujo Estructurado
								<Badge className="px-1.5 py-0 text-[10px]" variant="outline">
									NUEVO
								</Badge>
							</Label>
							<p className="text-muted-foreground text-xs">
								Proceso secuencial optimizado: análisis → existencia → eliminación → estructura → indexado → thumbnails
								→ metadata → verificación
							</p>
						</div>
						<Switch
							checked={useStructuredFlow}
							disabled={disabled}
							id="structured-flow"
							onCheckedChange={onUseStructuredFlowChange}
						/>
					</div>

					{useStructuredFlow && (
						<div className="ml-6 space-y-2 border-dt-primary-200 border-l-2 pl-3 dark:border-dt-primary-800">
							<div className="grid grid-cols-4 gap-2 text-xs">
								<div className="flex items-center gap-1 text-muted-foreground">
									<div className="h-2 w-2 rounded-full bg-dt-primary-500" />
									<span>Análisis</span>
								</div>
								<div className="flex items-center gap-1 text-muted-foreground">
									<div className="h-2 w-2 rounded-full bg-dt-success-500" />
									<span>Existencia</span>
								</div>
								<div className="flex items-center gap-1 text-muted-foreground">
									<div className="h-2 w-2 rounded-full bg-dt-danger-500" />
									<span>Limpieza</span>
								</div>
								<div className="flex items-center gap-1 text-muted-foreground">
									<div className="h-2 w-2 rounded-full bg-purple-500" />
									<span>Estructura</span>
								</div>
								<div className="flex items-center gap-1 text-muted-foreground">
									<div className="h-2 w-2 rounded-full bg-dt-warning-500" />
									<span>Indexado</span>
								</div>
								<div className="flex items-center gap-1 text-muted-foreground">
									<div className="h-2 w-2 rounded-full bg-orange-500" />
									<span>Thumbnails</span>
								</div>
								<div className="flex items-center gap-1 text-muted-foreground">
									<div className="h-2 w-2 rounded-full bg-teal-500" />
									<span>Metadata</span>
								</div>
								<div className="flex items-center gap-1 text-muted-foreground">
									<div className="h-2 w-2 rounded-full bg-dt-neutral-500" />
									<span>Verificación</span>
								</div>
							</div>
						</div>
					)}

					{!useStructuredFlow && (
						<div className="ml-6 space-y-1 border-border border-l-2 pl-3">
							<p className="text-muted-foreground text-xs">
								<Clock className="mr-1 inline h-3 w-3" />
								Flujo legacy: procesa todas las operaciones por carpeta simultáneamente
							</p>
						</div>
					)}
				</div>

				<Separator />

				{/* Opciones de optimización */}
				<div className="space-y-3">
					<h4 className="font-medium text-sm">Optimizaciones</h4>

					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<Label className="flex items-center gap-2 text-sm" htmlFor="skip-thumbnails">
									<Image className="h-3.5 w-3.5 text-warning" />
									Saltar Thumbnails
								</Label>
								<p className="text-muted-foreground text-xs">
									Omite la generación de miniaturas para acelerar el proceso
								</p>
							</div>
							<Switch
								checked={skipThumbnails}
								disabled={disabled}
								id="skip-thumbnails"
								onCheckedChange={onSkipThumbnailsChange}
							/>
						</div>

						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<Label className="flex items-center gap-2 text-sm" htmlFor="skip-metadata">
									<FileText className="h-3.5 w-3.5 text-teal-500" />
									Saltar Metadata
								</Label>
								<p className="text-muted-foreground text-xs">
									Omite la extracción de metadatos para acelerar el proceso
								</p>
							</div>
							<Switch
								checked={skipMetadata}
								disabled={disabled}
								id="skip-metadata"
								onCheckedChange={onSkipMetadataChange}
							/>
						</div>
					</div>
				</div>

				{/* Información adicional */}
				{useStructuredFlow && (
					<>
						<Separator />
						<div className="space-y-2">
							<h4 className="font-medium text-sm">Ventajas del Flujo Estructurado</h4>
							<ul className="ml-3 space-y-1 text-muted-foreground text-xs">
								<li>• Progreso más detallado y predecible</li>
								<li>• Mejor manejo de errores por fase</li>
								<li>• Optimización de recursos del sistema</li>
								<li>• Posibilidad de cancelar por fase</li>
								<li>• Verificación de integridad al final</li>
							</ul>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
