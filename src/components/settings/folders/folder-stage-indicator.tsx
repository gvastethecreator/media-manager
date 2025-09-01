import { Check, Code, Eye, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StageInfo {
	stage: number;
	name: string;
	description: string;
	icon: React.ReactNode;
	color: {
		bg: string;
		text: string;
		border: string;
		ring: string;
	};
}

const STAGE_CONFIGS: Record<string, StageInfo> = {
	starting: {
		stage: 0,
		name: 'Iniciando',
		description: 'Preparando proceso',
		icon: <Eye className="h-3 w-3" />,
		color: {
			bg: 'bg-slate-50',
			text: 'text-slate-600',
			border: 'border-slate-200',
			ring: 'ring-slate-200',
		},
	},
	scanning: {
		stage: 1,
		name: 'Indexando',
		description: 'Escaneando archivos y creando entidades',
		icon: <Eye className="h-3 w-3" />,
		color: {
			bg: 'bg-blue-50',
			text: 'text-blue-600',
			border: 'border-blue-200',
			ring: 'ring-blue-200',
		},
	},
	metadata: {
		stage: 2,
		name: 'Metadata',
		description: 'Extrayendo metadatos de archivos',
		icon: <Code className="h-3 w-3" />,
		color: {
			bg: 'bg-amber-50',
			text: 'text-amber-600',
			border: 'border-amber-200',
			ring: 'ring-amber-200',
		},
	},
	processing: {
		stage: 3,
		name: 'Thumbnails',
		description: 'Generando miniaturas',
		icon: <ImageIcon className="h-3 w-3" />,
		color: {
			bg: 'bg-purple-50',
			text: 'text-purple-600',
			border: 'border-purple-200',
			ring: 'ring-purple-200',
		},
	},
	complete: {
		stage: 4,
		name: 'Completado',
		description: 'Proceso finalizado exitosamente',
		icon: <Check className="h-3 w-3" />,
		color: {
			bg: 'bg-emerald-50',
			text: 'text-emerald-600',
			border: 'border-emerald-200',
			ring: 'ring-emerald-200',
		},
	},
};

interface FolderStageIndicatorProps {
	phase: string;
	progress: number;
	message?: string;
	isProcessing: boolean;
	filesProcessed?: number;
	totalFiles?: number;
	className?: string;
}

export function FolderStageIndicator({
	phase,
	progress,
	message,
	isProcessing,
	filesProcessed,
	totalFiles,
	className,
}: FolderStageIndicatorProps) {
	const currentStage = STAGE_CONFIGS[phase] || STAGE_CONFIGS.starting;
	const isComplete = phase === 'complete';

	// Calcular el progreso de cada etapa basado en el progreso total
	const getStageProgress = (stageNumber: number) => {
		const baseProgress = ((stageNumber - 1) / 3) * 100;
		const nextProgress = (stageNumber / 3) * 100;

		if (progress < baseProgress) {
			return 0;
		}
		if (progress >= nextProgress) {
			return 100;
		}

		return ((progress - baseProgress) / (nextProgress - baseProgress)) * 100;
	};

	return (
		<div className={cn('absolute right-2 bottom-2 w-fit space-y-2', className)}>
			{/* Indicador de etapa actual */}
			<div className="flex items-center justify-between">
				<div
					className={cn(
						'flex items-center gap-2 rounded-sm border-2 border-background/50 px-2 py-1 shadow-xs backdrop-blur-lg'
					)}
				>
					<div>{currentStage.icon}</div>
					<div className="flex flex-col">
						<span className={cn('font-medium text-sm', currentStage.color.text)}>{currentStage.name}</span>
						<span className="text-[10px] text-muted-foreground">{currentStage.description}</span>
						{/* Contador de archivos */}
					</div>
				</div>
			</div>

			{/* Barra de progreso de etapas */}
			<div className="space-y-1">
				<div className="flex items-center gap-1">
					{[1, 2, 3].map((stageNum) => {
						const stageKey = Object.keys(STAGE_CONFIGS).find((key) => STAGE_CONFIGS[key].stage === stageNum);
						const stageConfig = stageKey ? STAGE_CONFIGS[stageKey] : null;
						const stageProgress = getStageProgress(stageNum);
						const isCurrentStage = currentStage.stage === stageNum;
						const isCompleted = stageProgress >= 100;

						return (
							<div className="flex-1" key={stageNum}>
								<div
									className={cn(
										'h-1.5 overflow-hidden rounded-full',
										stageConfig ? stageConfig.color.bg : 'bg-muted',
										isCurrentStage && 'ring-1',
										isCurrentStage && stageConfig ? stageConfig.color.ring : ''
									)}
								>
									<div
										className={cn(
											'h-full',
											stageConfig ? stageConfig.color.text.replace('text-', 'bg-') : 'bg-muted-foreground',
											isCompleted && 'bg-emerald-500'
										)}
										style={{ width: `${stageProgress}%` }}
									/>
								</div>
								{stageConfig && (
									<div className="mt-0.5 text-center">
										<span
											className={cn(
												'font-medium text-[9px]',
												isCurrentStage ? stageConfig.color.text : 'text-muted-foreground',
												isCompleted && 'text-emerald-600'
											)}
										>
											{stageConfig.name}
										</span>
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>

			{/* Mensaje detallado */}
			{message && <div className="text-[10px] text-muted-foreground">{message}</div>}
		</div>
	);
}
