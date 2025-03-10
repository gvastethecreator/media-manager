'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Calendar, Code2, FileDigit, FileImage, HardDrive, Palette, Settings2 } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';
import { InfoItem } from './details-panel-info-item';
import type { MetadataComponentProps } from './details-panel-types';
import { truncateText } from './details-panel-utils';

/**
 * Componente que muestra información de generación AI de la imagen
 */
export function AIGenerationInfo({ metadata }: MetadataComponentProps) {
	const { toast } = useToast();
	const [isPromptExpanded, setIsPromptExpanded] = useState(false);
	const [isNegativePromptExpanded, setIsNegativePromptExpanded] = useState(false);
	const [isWorkflowExpanded, setIsWorkflowExpanded] = useState(false);

	if (!metadata?.generation) {
		return null;
	}

	const gen = metadata.generation;
	const isSD = gen.type === 'stable-diffusion';
	const isComfyUI = gen.type === 'comfyui';
	const isInvokeAI = gen.type === 'invoke-ai';
	const isNovelAI = gen.type === 'novel-ai';

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between">
				<h3 className="text-xs font-medium text-muted-foreground">Información de Generación AI</h3>
				<Badge
					variant="outline"
					className={cn(
						'text-[10px] h-5 px-2',
						isSD && 'bg-blue-500/10 text-blue-500',
						isComfyUI && 'bg-green-500/10 text-green-500',
						isInvokeAI && 'bg-purple-500/10 text-purple-500',
						isNovelAI && 'bg-pink-500/10 text-pink-500'
					)}
				>
					{isSD && 'Stable Diffusion'}
					{isComfyUI && 'ComfyUI'}
					{isInvokeAI && 'InvokeAI'}
					{isNovelAI && 'NovelAI'}
				</Badge>
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

				{/* Parámetros */}
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

				{/* Parámetros adicionales */}
				{gen.extra_params && Object.keys(gen.extra_params).length > 0 && (
					<div className="mt-2">
						<h4 className="text-xs font-medium text-muted-foreground mb-1">Parámetros adicionales</h4>
						<div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
							{Object.entries(gen.extra_params).map(([key, value]) => (
								<InfoItem
									key={key}
									icon={<Settings2 className="h-3.5 w-3.5 text-neutral-400" />}
									label={key}
									value={value as string}
								/>
							))}
						</div>
					</div>
				)}

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
								description: 'Metadata copiada al portapapeles',
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
