'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Bug, Calendar, Code2, FileDigit, FileImage, HardDrive, Palette, Settings2 } from 'lucide-react';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { InfoItem } from './details-panel-info-item';
import type { MetadataComponentProps } from './details-panel-types';
import { truncateText } from './details-panel-utils';

// Logger para componente de generación AI
const aiLogger = {
	info: (message: string, data?: unknown) => console.info(`[AIGeneration] ${message}`, data || ''),
	warn: (message: string, data?: unknown) => console.warn(`[AIGeneration] ${message}`, data || ''),
	error: (message: string, data?: unknown) => console.error(`[AIGeneration] ${message}`, data || ''),
	debug: (message: string, data?: unknown) => console.debug(`[AIGeneration] ${message}`, data || ''),
};

/**
 * Tipo para información de generación de IA
 */
type AIGenerationInfo = {
	type?: string;
	prompt?: string;
	model?: string;
	sampler?: string;
	negative_prompt?: string;
	steps?: number;
	cfg_scale?: number;
	seed?: number;
	[key: string]: unknown;
};

/**
 * Intenta encontrar información de generación por IA en el objeto metadata
 */
function findGenerationInfo(metadata: Record<string, unknown>): AIGenerationInfo | null {
	// Si ya tiene generación, usarla
	if (metadata.generation) {
		return metadata.generation as AIGenerationInfo;
	}

	// Buscar ai (alias común)
	if (metadata.ai) {
		return metadata.ai as AIGenerationInfo;
	}

	// Campos que indican información de generación
	const generationIndicators = ['prompt', 'model', 'sampler', 'negative_prompt', 'steps', 'cfg_scale', 'seed'];

	// Verificar campos directamente en metadata
	const directFields = generationIndicators.filter((field) => field in metadata);
	if (directFields.length >= 2) {
		// Parece contener información de generación directamente
		const generation: AIGenerationInfo = { type: 'unknown' };

		// Copiar los campos relevantes
		for (const field of generationIndicators) {
			if (metadata[field] !== undefined) {
				generation[field] = metadata[field];
			}
		}

		return generation;
	}

	// Buscar en subobjetos de primer nivel
	for (const key in metadata) {
		if (typeof metadata[key] === 'object' && metadata[key] !== null) {
			const obj = metadata[key] as Record<string, unknown>;

			// Ver si este objeto parece ser de generación
			const subFields = generationIndicators.filter((field) => field in obj);
			if (subFields.length >= 2) {
				// Este subobjeto parece contener información de generación
				const generation: AIGenerationInfo = { type: key };

				// Copiar los campos relevantes
				for (const field of generationIndicators) {
					if (obj[field] !== undefined) {
						generation[field] = obj[field];
					}
				}

				return generation;
			}
		}
	}

	// No se encontró información de generación
	return null;
}

/**
 * Componente que muestra información de generación AI de la imagen
 */
export function AIGenerationInfo({ metadata }: MetadataComponentProps) {
	const { toast } = useToast();
	const [isPromptExpanded, setIsPromptExpanded] = useState(false);
	const [isNegativePromptExpanded, setIsNegativePromptExpanded] = useState(false);
	const [isWorkflowExpanded, setIsWorkflowExpanded] = useState(false);
	const [generationData, setGenerationData] = useState<AIGenerationInfo | null>(null);

	// Para diagnóstico: extraer información de generación y loguear cuando se reciben los metadatos
	useEffect(() => {
		if (metadata) {
			aiLogger.info('Componente recibió metadata:', {
				hasMetadata: !!metadata,
				metadataKeys: Object.keys(metadata),
				hasGeneration: !!metadata?.generation,
			});

			if (metadata.generation) {
				aiLogger.debug('Objeto generation encontrado directamente:', metadata.generation);
				setGenerationData(metadata.generation as AIGenerationInfo);
			} else {
				aiLogger.warn('Metadata sin propiedad generation, buscando en otras propiedades');

				// Intentar encontrar información de generación
				const generationInfo = findGenerationInfo(metadata);

				if (generationInfo) {
					aiLogger.info('Encontrada información de generación alternativa:', generationInfo);
					setGenerationData(generationInfo);
				} else {
					aiLogger.warn('No se encontró información de generación por IA');

					// Mostrar las claves principales para diagnóstico
					aiLogger.debug('Claves en objeto metadata:', Object.keys(metadata));
					setGenerationData(null);
				}
			}
		} else {
			aiLogger.warn('Componente recibió metadata nula');
			setGenerationData(null);
		}
	}, [metadata]);

	// Si no hay datos de generación, mostrar un mensaje
	if (!generationData) {
		return (
			<div className="flex flex-col gap-2 p-2 border border-dashed border-amber-500/50 rounded-md">
				<div className="flex items-center justify-between">
					<h3 className="text-xs font-medium text-muted-foreground">Información de Generación AI</h3>
					<Badge variant="outline" className="text-[10px] h-5 px-2 bg-amber-500/10 text-amber-500">
						No disponible
					</Badge>
				</div>
				<p className="text-xs text-muted-foreground">
					No se encontró información de generación por IA para esta imagen.
				</p>
				<Button
					variant="outline"
					size="sm"
					className="w-full text-xs mt-2"
					onClick={() => {
						toast({
							title: 'Depuración',
							description: 'Metadata completa impresa en consola',
						});
					}}
				>
					<Bug className="h-3.5 w-3.5 mr-2" />
					Depurar metadata en consola
				</Button>
			</div>
		);
	}

	// A partir de aquí usamos generationData en lugar de metadata.generation
	const gen = generationData;

	// Determinar el tipo de generador, con manejo mejorado de tipos desconocidos
	const generatorType = (gen.type || '').toLowerCase();
	const isSD = generatorType.includes('stable-diffusion') || generatorType === 'sd';
	const isComfyUI = generatorType.includes('comfyui') || generatorType === 'comfy';
	const isInvokeAI = generatorType.includes('invoke') || generatorType === 'invoke-ai';
	const isNovelAI = generatorType.includes('novel') || generatorType === 'novel-ai';
	const isMidjourney = generatorType.includes('midjourney') || generatorType === 'mj';
	const isDalle = generatorType.includes('dalle') || generatorType.includes('dall-e');
	const isUnknown = !generatorType || (!isSD && !isComfyUI && !isInvokeAI && !isNovelAI && !isMidjourney && !isDalle);

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between">
				<h3 className="text-xs font-medium text-muted-foreground">Información de Generación AI</h3>
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="sm"
						className="h-5 px-2"
						onClick={() => {
							toast({
								title: 'Depuración',
								description: 'Datos de generación impresos en consola',
							});
						}}
					>
						<Bug className="h-3.5 w-3.5 mr-1" />
						<span className="text-[10px]">Depurar</span>
					</Button>
					<Badge
						variant="outline"
						className={cn(
							'text-[10px] h-5 px-2',
							isSD && 'bg-blue-500/10 text-blue-500',
							isComfyUI && 'bg-green-500/10 text-green-500',
							isInvokeAI && 'bg-purple-500/10 text-purple-500',
							isNovelAI && 'bg-pink-500/10 text-pink-500',
							isMidjourney && 'bg-indigo-500/10 text-indigo-500',
							isDalle && 'bg-orange-500/10 text-orange-500',
							isUnknown && 'bg-gray-500/10 text-gray-500'
						)}
					>
						{isSD && 'Stable Diffusion'}
						{isComfyUI && 'ComfyUI'}
						{isInvokeAI && 'InvokeAI'}
						{isNovelAI && 'NovelAI'}
						{isMidjourney && 'Midjourney'}
						{isDalle && 'DALL-E'}
						{isUnknown && (gen.type || 'Desconocido')}
					</Badge>
				</div>
			</div>

			<div className="flex flex-col gap-1.5">
				{/* Prompt */}
				{gen.prompt && (
					<div className="flex flex-col gap-1">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<FileImage className="h-3.5 w-3.5 text-teal-400" />
								<span className="text-xs text-muted-foreground">Prompt</span>
							</div>
							<Button
								variant="ghost"
								size="sm"
								className="h-6 px-2"
								onClick={() => setIsPromptExpanded(!isPromptExpanded)}
							>
								{isPromptExpanded ? 'Colapsar' : 'Expandir'}
							</Button>
						</div>
						<div className={cn('text-xs bg-muted/30 p-2 rounded-sm', !isPromptExpanded && 'max-h-24 overflow-hidden')}>
							<p className="whitespace-pre-wrap break-words">
								{isPromptExpanded ? gen.prompt : truncateText(gen.prompt)}
							</p>
						</div>
					</div>
				)}

				{/* Prompt Negativo */}
				{gen.negative_prompt && (
					<div className="flex flex-col gap-1">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<FileImage className="h-3.5 w-3.5 text-rose-400" />
								<span className="text-xs text-muted-foreground">Prompt Negativo</span>
							</div>
							<Button
								variant="ghost"
								size="sm"
								className="h-6 px-2"
								onClick={() => setIsNegativePromptExpanded(!isNegativePromptExpanded)}
							>
								{isNegativePromptExpanded ? 'Colapsar' : 'Expandir'}
							</Button>
						</div>
						<div
							className={cn(
								'text-xs bg-muted/30 p-2 rounded-sm',
								!isNegativePromptExpanded && 'max-h-24 overflow-hidden'
							)}
						>
							<p className="whitespace-pre-wrap break-words">
								{isNegativePromptExpanded ? gen.negative_prompt : truncateText(gen.negative_prompt)}
							</p>
						</div>
					</div>
				)}

				{/* Modelo */}
				{gen.model && (
					<InfoItem icon={<HardDrive className="h-3.5 w-3.5 text-sky-400" />} label="Modelo" value={gen.model} />
				)}

				{/* Parámetros comunes */}
				<div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
					{gen.steps && (
						<InfoItem icon={<Code2 className="h-3.5 w-3.5 text-lime-400" />} label="Pasos" value={gen.steps} />
					)}
					{(gen.cfg_scale || gen.cfg) && (
						<InfoItem
							icon={<Palette className="h-3.5 w-3.5 text-fuchsia-400" />}
							label="CFG"
							value={gen.cfg_scale || gen.cfg}
						/>
					)}
					{gen.seed && (
						<InfoItem icon={<FileDigit className="h-3.5 w-3.5 text-amber-400" />} label="Semilla" value={gen.seed} />
					)}
					{gen.sampler && (
						<InfoItem
							icon={<FileImage className="h-3.5 w-3.5 text-indigo-400" />}
							label="Sampler"
							value={gen.sampler}
						/>
					)}
					{gen.scheduler && (
						<InfoItem
							icon={<Calendar className="h-3.5 w-3.5 text-purple-400" />}
							label="Scheduler"
							value={gen.scheduler}
						/>
					)}
					{isSD && gen.clip_skip && (
						<InfoItem
							icon={<FileImage className="h-3.5 w-3.5 text-orange-400" />}
							label="CLIP Skip"
							value={gen.clip_skip}
						/>
					)}
				</div>

				{/* Workflow (ComfyUI) */}
				{isComfyUI && gen.workflow && (
					<div className="flex flex-col gap-1">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Code2 className="h-3.5 w-3.5 text-blue-400" />
								<span className="text-xs text-muted-foreground">Workflow</span>
							</div>
							<Button
								variant="ghost"
								size="sm"
								className="h-6 px-2"
								onClick={() => setIsWorkflowExpanded(!isWorkflowExpanded)}
							>
								{isWorkflowExpanded ? 'Colapsar' : 'Expandir'}
							</Button>
						</div>
						<div
							className={cn('text-xs bg-muted/30 p-2 rounded-sm', !isWorkflowExpanded && 'max-h-32 overflow-hidden')}
						>
							<pre className="whitespace-pre-wrap break-all">
								{isWorkflowExpanded ? gen.workflow : truncateText(gen.workflow, 300)}
							</pre>
						</div>
					</div>
				)}

				{/* Parámetros adicionales - Mostrar todas las propiedades no procesadas */}
				<div className="mt-2">
					<h4 className="text-xs font-medium text-muted-foreground mb-1">Parámetros adicionales</h4>
					<div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
						{Object.entries(gen).map(([key, value]) => {
							// Excluir propiedades ya mostradas
							if (
								[
									'type',
									'prompt',
									'negative_prompt',
									'model',
									'steps',
									'cfg_scale',
									'cfg',
									'seed',
									'sampler',
									'scheduler',
									'clip_skip',
									'workflow',
									'extra_params',
								].includes(key)
							) {
								return null;
							}

							// Si el valor es null, indefinido o cadena vacía, no mostrar
							if (value === null || value === undefined || value === '') {
								return null;
							}

							// Si el valor es un array u objeto, convertirlo a string
							const displayValue = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);

							return (
								<InfoItem
									key={key}
									icon={<Settings2 className="h-3.5 w-3.5 text-neutral-400" />}
									label={key}
									value={displayValue}
								/>
							);
						})}
					</div>
				</div>

				{/* Metadata completa */}
				<div className="mt-2">
					<Button
						variant="ghost"
						size="sm"
						className="w-full text-xs"
						onClick={() => {
							navigator.clipboard.writeText(JSON.stringify(gen));
							toast({
								title: 'Copiado',
								description: 'Metadata de generación AI copiada al portapapeles',
							});
						}}
					>
						<FileImage className="h-3.5 w-3.5 mr-2" />
						Copiar metadata completa
					</Button>
				</div>
			</div>
		</div>
	);
}
