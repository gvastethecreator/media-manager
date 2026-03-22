import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ParsedPromptSegment {
	content: string;
	metadata?: Record<string, any>;
	type: 'text' | 'lora' | 'embedding' | 'weight' | 'network';
	weight?: number;
}

export interface PromptParserProps {
	className?: string;
	onLorasDetected?: (loras: string[]) => void;
	prompt: string;
}

const LORA_PATTERN = /<lora:([^:>]+)(?::([0-9.]+))?>/gi;
const EMBEDDING_PATTERN = /<(?:embedding|textual_inversion):([^:>]+)(?::([0-9.]+))?>/gi;
const WEIGHT_PATTERN = /\(([^)]+)\)(?::([0-9.]+))?/g;
const NETWORK_PATTERN = /<(?:hypernet|hypernetwork):([^:>]+)(?::([0-9.]+))?>/gi;

export function parsePrompt(prompt: string): ParsedPromptSegment[] {
	const segments: ParsedPromptSegment[] = [];
	const detectedLoras: string[] = [];
	let lastIndex = 0;

	const allMatches: Array<{
		match: RegExpExecArray;
		type: 'lora' | 'embedding' | 'network';
		start: number;
		end: number;
	}> = [];

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

	allMatches.sort((a, b) => a.start - b.start);

	for (const { match, type, start, end } of allMatches) {
		if (lastIndex < start) {
			const textBefore = prompt.slice(lastIndex, start);
			if (textBefore.trim()) {
				segments.push({
					type: 'text',
					content: textBefore,
				});
			}
		}

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
		return <span className="text-[10px] text-muted-foreground italic">Sin prompt</span>;
	}

	return (
		<div
			className={cn(
				'w-full min-w-0 whitespace-pre-wrap break-words font-sans text-[11px] leading-relaxed [word-break:break-word]',
				className
			)}
		>
			{segments.map((segment, idx) => {
				const badgeBase =
					'inline-flex items-center gap-1 px-1.5 py-0 h-auto text-[9px] font-bold tracking-tighter uppercase mb-1 mr-1 max-w-full';
				switch (segment.type) {
					case 'lora':
						return (
							<Badge
								className={cn(badgeBase, 'border-blue-500/20 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20')}
								key={idx}
								variant="secondary"
							>
								<span>LoRA:</span>
								<span className="truncate">{segment.content}</span>
								{segment.weight && <span>:{segment.weight}</span>}
							</Badge>
						);

					case 'embedding':
						return (
							<Badge
								className={cn(
									badgeBase,
									'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
								)}
								key={idx}
								variant="secondary"
							>
								<span>Emb:</span>
								<span className="truncate">{segment.content}</span>
								{segment.weight && <span>:{segment.weight}</span>}
							</Badge>
						);

					case 'network':
						return (
							<Badge
								className={cn(badgeBase, 'border-amber-500/20 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20')}
								key={idx}
								variant="secondary"
							>
								<span>Net:</span>
								<span className="truncate">{segment.content}</span>
								{segment.weight && <span>:{segment.weight}</span>}
							</Badge>
						);
					default:
						return (
							<span className="break-words" key={idx}>
								{segment.content}
							</span>
						);
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
	const needsCollapse = prompt.split('\n').length > collapsedLines || prompt.length > 800;

	const content = (
		<div className={cn(expanded ? 'max-h-none' : 'line-clamp-6', className, 'w-full min-w-0 overflow-hidden')}>
			<PromptParser onLorasDetected={onLorasDetected} prompt={prompt} />
		</div>
	);

	if (!needsCollapse) return content;

	return (
		<div className="w-full min-w-0 space-y-1.5 overflow-hidden">
			{content}
			<button
				className="font-black text-[9px] text-primary/60 uppercase tracking-widest transition-colors hover:text-primary"
				onClick={() => setExpanded((v) => !v)}
				type="button"
			>
				{expanded ? '[ Ocultar ]' : '[ Ver más ]'}
			</button>
		</div>
	);
};
