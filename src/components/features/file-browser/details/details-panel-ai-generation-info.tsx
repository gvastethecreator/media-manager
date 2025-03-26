'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
	type AIGenerationInfo as AIGenerationInfoType,
	determineGeneratorType,
} from '@/lib/parsers';
import { cn } from '@/lib/utils';
import { Bug, Calendar, Code2, FileDigit, FileImage, HardDrive, Palette, Settings2 } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';
import { aiLogger, getExtraParam, safeStr } from './details-panel-ai-generation-utils';
import { InfoItem } from './details-panel-info-item';
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

interface AIGenerationInfoProps {
	generation: AIGenerationInfoType;
}

/**
 * Componente que muestra información de generación AI de la imagen
 */
export function AIGenerationInfo({ generation }: AIGenerationInfoProps) {
	const { toast } = useToast();
	const [isPromptExpanded, setIsPromptExpanded] = useState(false);
	const [isNegativePromptExpanded, setIsNegativePromptExpanded] = useState(false);
	const [isWorkflowExpanded, setIsWorkflowExpanded] = useState(false);

	// Determinar el tipo de generador
	const generatorInfo = determineGeneratorType(generation);

	// Extraer extra_params como un objeto con tipado seguro
	const extraParams =
		typeof generation.extra_params === 'object' && generation.extra_params
		? (generation.extra_params as Record<string, unknown>)
		: null;

	// Extraer strength value si existe
	const strengthValue = extraParams ? getStrengthParam(extraParams) : null;

	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-center justify-between">
				<Badge variant="outline" className={cn('text-[9px] h-4 px-1.5', generatorInfo.className)}>
					{generatorInfo.fullName}
				</Badge>
				<Button
					variant="ghost"
					size="sm"
					className="h-5 px-1.5"
					onClick={() => {
						console.log('Datos de generación:', generation);
						toast({
							title: "Debug",
							description: "Datos impresos en consola",
						});
					}}
				>
					<Bug className="h-3 w-3 mr-1" />
					<span className="text-[9px]">Debug</span>
				</Button>
			</div>

			<div className="grid grid-cols-1 gap-1.5">
				{/* Información básica */}
				<div className="grid grid-cols-2 gap-1">
					{generation.model && (
						<InfoItem
							icon={<HardDrive className="h-3 w-3 text-indigo-400" />}
							label="Modelo"
							value={safeStr(generation.model)}
						/>
					)}

					{generation.sampler && (
						<InfoItem
							icon={<Palette className="h-3 w-3 text-pink-400" />}
							label="Sampler"
							value={safeStr(generation.sampler)}
						/>
					)}

					{generation.seed !== undefined && (
						<InfoItem
							icon={<FileDigit className="h-3 w-3 text-amber-400" />}
							label="Seed"
							value={String(generation.seed)}
						/>
					)}

					{generation.steps !== undefined && (
						<InfoItem
							icon={<Settings2 className="h-3 w-3 text-blue-400" />}
							label="Steps"
							value={String(generation.steps)}
						/>
					)}

					{generation.cfg_scale !== undefined && (
						<InfoItem
							icon={<Settings2 className="h-3 w-3 text-green-400" />}
							label="CFG"
							value={String(generation.cfg_scale)}
						/>
					)}

					{strengthValue && (
						<InfoItem
							icon={<Settings2 className="h-3 w-3 text-purple-400" />}
							label="Strength"
							value={strengthValue}
						/>
					)}

					{generation.created_at && (
						<InfoItem
							icon={<Calendar className="h-3 w-3 text-teal-400" />}
							label="Fecha"
							value={new Date(generation.created_at).toLocaleString()}
						/>
					)}
				</div>

				{/* Prompt */}
				{generation.prompt && (
					<div className="flex flex-col gap-0.5">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-1">
								<FileImage className="h-3 w-3 text-teal-400" />
								<span className="text-[10px] text-muted-foreground">Prompt</span>
							</div>
							<Button
								variant="ghost"
								size="sm"
								className="h-5 px-1.5"
								onClick={() => setIsPromptExpanded(!isPromptExpanded)}
							>
								<span className="text-[9px]">{isPromptExpanded ? 'Colapsar' : 'Expandir'}</span>
							</Button>
						</div>
						<div className={cn('text-[10px] bg-muted/30 p-1.5 rounded-sm', !isPromptExpanded && 'max-h-16 overflow-hidden')}>
							<p className="whitespace-pre-wrap break-words">
								{isPromptExpanded ? safeStr(generation.prompt) : truncateText(safeStr(generation.prompt), 150)}
							</p>
						</div>
					</div>
				)}

				{/* Prompt Negativo */}
				{generation.negative_prompt && (
					<div className="flex flex-col gap-0.5">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-1">
								<FileImage className="h-3 w-3 text-rose-400" />
								<span className="text-[10px] text-muted-foreground">Negativo</span>
							</div>
							<Button
								variant="ghost"
								size="sm"
								className="h-5 px-1.5"
								onClick={() => setIsNegativePromptExpanded(!isNegativePromptExpanded)}
							>
								<span className="text-[9px]">{isNegativePromptExpanded ? 'Colapsar' : 'Expandir'}</span>
							</Button>
						</div>
						<div
							className={cn(
								'text-[10px] bg-muted/30 p-1.5 rounded-sm',
								!isNegativePromptExpanded && 'max-h-16 overflow-hidden'
							)}
						>
							<p className="whitespace-pre-wrap break-words">
								{isNegativePromptExpanded
									? safeStr(generation.negative_prompt)
									: truncateText(safeStr(generation.negative_prompt), 150)}
							</p>
						</div>
					</div>
				)}

				{/* Workflow / JSON */}
				{generation.workflow && (
					<div className="flex flex-col gap-0.5">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-1">
								<Code2 className="h-3 w-3 text-cyan-400" />
								<span className="text-[10px] text-muted-foreground">Workflow</span>
							</div>
							<Button
								variant="ghost"
								size="sm"
								className="h-5 px-1.5"
								onClick={() => setIsWorkflowExpanded(!isWorkflowExpanded)}
							>
								<span className="text-[9px]">{isWorkflowExpanded ? 'Colapsar' : 'Expandir'}</span>
							</Button>
						</div>
						<div
							className={cn(
								'text-[10px] bg-muted/30 p-1.5 rounded-sm font-mono',
								!isWorkflowExpanded && 'max-h-16 overflow-hidden'
							)}
						>
							<pre className="whitespace-pre-wrap break-words">
								{isWorkflowExpanded
									? safeStr(generation.workflow)
									: truncateText(safeStr(generation.workflow), 100)}
							</pre>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
