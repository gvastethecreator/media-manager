import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ParsedPromptSegment {
	type: 'text' | 'lora' | 'embedding' | 'weight' | 'network';
	content: string;
	weight?: number;
	metadata?: Record<string, any>;
}

export interface PromptParserProps {
	prompt: string;
	className?: string;
	onLorasDetected?: (loras: string[]) => void;
}

// Regex patterns para diferentes elementos de prompts
const LORA_PATTERN = /<lora:([^:>]+)(?::([0-9.]+))?>/gi;
const EMBEDDING_PATTERN = /<(?:embedding|textual_inversion):([^:>]+)(?::([0-9.]+))?>/gi;
const WEIGHT_PATTERN = /\(([^)]+)\)(?::([0-9.]+))?/g;
const NETWORK_PATTERN = /<(?:hypernet|hypernetwork):([^:>]+)(?::([0-9.]+))?>/gi;

export function parsePrompt(prompt: string): ParsedPromptSegment[] {
	const segments: ParsedPromptSegment[] = [];
	const detectedLoras: string[] = [];
	let lastIndex = 0;

	// Crear un array de todos los matches con sus posiciones
	const allMatches: Array<{
		match: RegExpExecArray;
		type: 'lora' | 'embedding' | 'network';
		start: number;
		end: number;
	}> = [];

	// Buscar LoRAs
	const loraMatches = Array.from(prompt.matchAll(new RegExp(LORA_PATTERN.source, 'gi')));
	for (const match of loraMatches) {
		if (match.index !== undefined) {
			allMatches.push({
				match: match as RegExpExecArray,
				type: 'lora',
				start: match.index,
				end: match.index + match[0].length,
			});
			detectedLoras.push(match[1]);
		}
	}

	// Buscar embeddings
	const embeddingMatches = Array.from(prompt.matchAll(new RegExp(EMBEDDING_PATTERN.source, 'gi')));
	for (const match of embeddingMatches) {
		if (match.index !== undefined) {
			allMatches.push({
				match: match as RegExpExecArray,
				type: 'embedding',
				start: match.index,
				end: match.index + match[0].length,
			});
		}
	}

	// Buscar networks
	const networkMatches = Array.from(prompt.matchAll(new RegExp(NETWORK_PATTERN.source, 'gi')));
	for (const match of networkMatches) {
		if (match.index !== undefined) {
			allMatches.push({
				match: match as RegExpExecArray,
				type: 'network',
				start: match.index,
				end: match.index + match[0].length,
			});
		}
	}

	// Ordenar por posición
	allMatches.sort((a, b) => a.start - b.start);

	// Procesar segmentos
	for (const { match, type, start, end } of allMatches) {
		// Agregar texto antes del match
		if (lastIndex < start) {
			const textBefore = prompt.slice(lastIndex, start);
			if (textBefore.trim()) {
				segments.push({
					type: 'text',
					content: textBefore,
				});
			}
		}

		// Agregar el elemento especial
		const name = match[1];
		const weight = match[2] ? Number.parseFloat(match[2]) : undefined;

		segments.push({
			type,
			content: name,
			weight,
			metadata: {
				original: match[0],
				fullMatch: match[0],
			},
		});

		lastIndex = end;
	}

	// Agregar texto restante
	if (lastIndex < prompt.length) {
		const remainingText = prompt.slice(lastIndex);
		if (remainingText.trim()) {
			segments.push({
				type: 'text',
				content: remainingText,
			});
		}
	}

	return segments;
}

export const PromptParser: React.FC<PromptParserProps> = ({ prompt, className, onLorasDetected }) => {
	const segments = React.useMemo(() => parsePrompt(prompt), [prompt]);

	React.useEffect(() => {
		const loras = segments.filter((segment) => segment.type === 'lora').map((segment) => segment.content);

		if (loras.length > 0 && onLorasDetected) {
			onLorasDetected(loras);
		}
	}, [segments, onLorasDetected]);

	if (!prompt.trim()) {
		return <span className="text-muted-foreground italic">Sin prompt</span>;
	}

	return (
		<div className={cn('whitespace-pre-wrap break-words font-sans leading-relaxed', className)}>
			{segments.map((segment, idx) => {
				switch (segment.type) {
					case 'lora':
						return (
							<Badge
								className="mx-1 inline-flex items-center gap-1 bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
								key={idx}
								variant="secondary"
							>
								<span className="font-medium">LoRA:</span>
								<span className="font-mono text-xs">{segment.content}</span>
								{segment.weight && (
									<span className="font-mono text-blue-600 text-xs dark:text-blue-400">:{segment.weight}</span>
								)}
							</Badge>
						);

					case 'embedding':
						return (
							<Badge
								className="mx-1 inline-flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300"
								key={idx}
								variant="secondary"
							>
								<span className="font-medium">Embed:</span>
								<span className="font-mono text-xs">{segment.content}</span>
								{segment.weight && (
									<span className="font-mono text-green-600 text-xs dark:text-green-400">:{segment.weight}</span>
								)}
							</Badge>
						);

					case 'network':
						return (
							<Badge
								className="mx-1 inline-flex items-center gap-1 bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300"
								key={idx}
								variant="secondary"
							>
								<span className="font-medium">Net:</span>
								<span className="font-mono text-xs">{segment.content}</span>
								{segment.weight && (
									<span className="font-mono text-purple-600 text-xs dark:text-purple-400">:{segment.weight}</span>
								)}
							</Badge>
						);
					default:
						return <span key={idx}>{segment.content}</span>;
				}
			})}
		</div>
	);
};

export const CollapsiblePrompt: React.FC<{
	prompt: string;
	collapsedLines?: number;
	className?: string;
	defaultExpanded?: boolean;
	onLorasDetected?: (loras: string[]) => void;
}> = ({ prompt, collapsedLines = 10, className, defaultExpanded = true, onLorasDetected }) => {
	const [expanded, setExpanded] = React.useState(defaultExpanded);
	const needsCollapse = prompt.split('\n').length > collapsedLines || prompt.length > 1200;

	const content = (
		<div className={cn(expanded ? 'max-h-none' : 'line-clamp-10', className)}>
			<PromptParser onLorasDetected={onLorasDetected} prompt={prompt} />
		</div>
	);

	if (!needsCollapse) return content;

	return (
		<div className="space-y-2">
			{content}
			<button
				className="text-[11px] text-blue-600 transition-colors hover:underline dark:text-blue-400"
				onClick={() => setExpanded((v) => !v)}
				type="button"
			>
				{expanded ? 'Ocultar' : 'Ver completo'}
			</button>
		</div>
	);
};
