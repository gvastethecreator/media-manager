'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
	type AIGenerationInfo as AIGenerationInfoType,
	determineGeneratorType,
	findGenerationInfo,
} from '@/lib/parsers';
import { cn } from '@/lib/utils/utils';
import { Bug, Calendar, Code2, FileDigit, FileImage, HardDrive, Palette, Settings2 } from 'lucide-react';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { aiLogger, getExtraParam, safeStr } from './details-panel-ai-generation-utils';
import { InfoItem } from './details-panel-info-item';
import type { MetadataComponentProps } from './details-panel-types';
import { truncateText } from './details-panel-utils';

/**
 * Verifica y extrae el valor de strength de extra_params si existe
 */
function getStrengthParam(params: Record<string, unknown> | null): string | null {
	if (!params || typeof params !== 'object') {
		return null;
	}

	if ('strength' in params && params.strength) {
		return typeof params.strength === 'string' ? params.strength : String(params.strength);
	}

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
	const [generationData, setGenerationData] = useState<AIGenerationInfoType | null>(null);

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
				setGenerationData(metadata.generation as AIGenerationInfoType);
			} else {
				aiLogger.warn('Metadata sin propiedad generation, buscando en otras propiedades');

				// Intentar encontrar información de generación
				const generationInfo = findGenerationInfo(metadata as Record<string, unknown>);

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
	const generatorInfo = determineGeneratorType(gen);

	// Extraer extra_params como un objeto con tipado seguro
	const extraParams =
		typeof gen.extra_params === 'object' && gen.extra_params ? (gen.extra_params as Record<string, unknown>) : null;

	// Extraer strength value si existe
	const strengthValue = extraParams ? getStrengthParam(extraParams) : null;

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
					<Badge variant="outline" className={cn('text-[10px] h-5 px-2', generatorInfo.className)}>
						{generatorInfo.fullName}
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
								{isPromptExpanded ? safeStr(gen.prompt) : truncateText(safeStr(gen.prompt))}
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
								{isNegativePromptExpanded ? safeStr(gen.negative_prompt) : truncateText(safeStr(gen.negative_prompt))}
							</p>
						</div>
					</div>
				)}

				{/* Modelo */}
				{gen.model && (
					<InfoItem
						icon={<HardDrive className="h-3.5 w-3.5 text-sky-400" />}
						label="Modelo"
						value={safeStr(gen.model)}
					/>
				)}

				{/* Parámetros comunes */}
				<div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
					{gen.steps && (
						<InfoItem icon={<Code2 className="h-3.5 w-3.5 text-lime-400" />} label="Pasos" value={safeStr(gen.steps)} />
					)}
					{(gen.cfg_scale || gen.cfg) && (
						<InfoItem
							icon={<Palette className="h-3.5 w-3.5 text-fuchsia-400" />}
							label="CFG"
							value={safeStr(gen.cfg_scale || gen.cfg)}
						/>
					)}
					{gen.seed && (
						<InfoItem
							icon={<FileDigit className="h-3.5 w-3.5 text-amber-400" />}
							label="Semilla"
							value={safeStr(gen.seed)}
						/>
					)}
					{gen.sampler && (
						<InfoItem
							icon={<FileImage className="h-3.5 w-3.5 text-indigo-400" />}
							label="Sampler"
							value={safeStr(gen.sampler)}
						/>
					)}
					{gen.scheduler && (
						<InfoItem
							icon={<Calendar className="h-3.5 w-3.5 text-purple-400" />}
							label="Scheduler"
							value={safeStr(gen.scheduler)}
						/>
					)}
					{(generatorInfo.type === 'sd' || generatorInfo.type === 'a1111') && gen.clip_skip && (
						<InfoItem
							icon={<FileImage className="h-3.5 w-3.5 text-orange-400" />}
							label="CLIP Skip"
							value={safeStr(gen.clip_skip)}
						/>
					)}
				</div>

				{/* Workflow (ComfyUI) */}
				{generatorInfo.type === 'comfyui' && gen.workflow && (
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
								{isWorkflowExpanded ? safeStr(gen.workflow) : truncateText(safeStr(gen.workflow), 300)}
							</pre>
						</div>
					</div>
				)}

				{/* Parámetros específicos según el tipo de generador */}
				{generatorInfo.type === 'novelai' && extraParams && (
					<div className="mt-2">
						<h4 className="text-xs font-medium text-muted-foreground mb-1">Parámetros NovelAI</h4>
						<div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
							{getExtraParam(extraParams, 'quality') && (
								<InfoItem
									icon={<Settings2 className="h-3.5 w-3.5 text-pink-400" />}
									label="Calidad"
									value={getExtraParam(extraParams, 'quality') || ''}
								/>
							)}
							{getExtraParam(extraParams, 'noise') && (
								<InfoItem
									icon={<Settings2 className="h-3.5 w-3.5 text-pink-400" />}
									label="Ruido"
									value={getExtraParam(extraParams, 'noise') || ''}
								/>
							)}
							{strengthValue && (
								<InfoItem
									icon={<Settings2 className="h-3.5 w-3.5 text-pink-400" />}
									label="Fuerza"
									value={strengthValue}
								/>
							)}
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
							const jsonData = JSON.stringify(gen, null, 2);
							navigator.clipboard.writeText(jsonData);
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
