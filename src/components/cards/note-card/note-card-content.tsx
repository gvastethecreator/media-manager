import {
	BarChart4,
	BookMarked,
	FileText,
	FolderOpen,
	HashIcon,
	Image,
	ListChecks,
	MapPin,
	Tag,
	TagIcon,
	UserSquare,
	Video,
} from 'lucide-react';
import { nanoid } from 'nanoid';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useNoteCounts } from '@/lib/api/notes';
import { cn } from '@/lib/utils';

interface NoteCardContentProps {
	content?: string | null;
	category?: string | null;
	tags?: string[] | null;
	status?: string | null;
	priority?: number | null;
	primaryColor: string;
	secondaryColor: string;
	noteId: string;
	tcgMode?: boolean;
}

/**
 * Componente para el contenido principal de una tarjeta de nota.
 * Similar al cuadro de texto de una carta Magic o Yu-Gi-Oh.
 */
export function NoteCardContent(props: NoteCardContentProps) {
	const state = useNoteCardContentState(props);
	return <NoteCardContentView {...state} />;
}

interface NoteCardContentState extends NoteCardContentProps {
	renderKey: string;
	hasTags: boolean;
	hasContent: boolean;
	priorityLabel: string;
	relationCounts: Record<string, number> | undefined;
	totalRelations: number;
}

function useNoteCardContentState({
	content,
	category = 'general',
	tags = [],
	status = 'pendiente',
	priority = 0,
	primaryColor,
	secondaryColor,
	noteId,
	tcgMode = true,
}: NoteCardContentProps): NoteCardContentState {
	const renderKey = React.useMemo(() => nanoid(), []);
	const { data: relationCounts } = useNoteCounts(noteId);
	const hasTags = Array.isArray(tags) && tags.length > 0;
	const hasContent = Boolean(content && content.length > 0);
	const PRIORITY_LABELS = { 0: 'Normal', 1: 'Alta', 2: 'Urgente' } as const;
	const priorityLabel = PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS] || 'Baja';
	const totalRelations = relationCounts ? Object.values(relationCounts).reduce((sum, count) => sum + count, 0) : 0;
	return {
		content: content || null,
		category,
		tags,
		status,
		priority,
		primaryColor,
		secondaryColor,
		noteId,
		tcgMode,
		renderKey,
		hasTags,
		hasContent,
		priorityLabel,
		relationCounts: relationCounts as any,
		totalRelations,
	};
}

function NoteCardContentView({
	content,
	category = 'general',
	tags = [],
	status = 'pendiente',
	priorityLabel,
	primaryColor,
	tcgMode = true,
	hasTags,
	hasContent,
	renderKey,
	relationCounts,
	totalRelations,
}: NoteCardContentState) {
	return (
		<div
			className={cn(
				'flex flex-1 flex-col overflow-hidden p-3',
				tcgMode ? 'bg-card/90 bg-gradient-to-b from-black/40 to-black/60' : 'bg-card/80'
			)}
		>
			<CategoryAndStatus category={category} primaryColor={primaryColor} status={status} />
			<PriorityDisplay primaryColor={primaryColor} priorityLabel={priorityLabel} />
			<ContentBlock content={content} hasContent={hasContent} primaryColor={primaryColor} tcgMode={tcgMode} />
			{hasTags && <TagsBlock primaryColor={primaryColor} renderKey={renderKey} tags={tags ?? []} />}
			{tcgMode ? (
				<TCGStats primaryColor={primaryColor} relationCounts={relationCounts} />
			) : (
				<StandardCounters primaryColor={primaryColor} relationCounts={relationCounts} />
			)}
			{tcgMode && totalRelations > 0 && (
				<AdditionalRelations primaryColor={primaryColor} relationCounts={relationCounts} />
			)}
		</div>
	);
}

const CategoryAndStatus: React.FC<{ category?: string | null; status?: string | null; primaryColor: string }> = ({
	category,
	status,
	primaryColor,
}) => (
	<div className="mb-2 flex items-center justify-between">
		<div className="font-medium text-xs uppercase tracking-wider" style={{ color: primaryColor }}>
			{category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Nota'}
		</div>
		{status && (
			<div className="flex items-center gap-1 text-xs">
				<ListChecks className="h-3.5 w-3.5" />
				<span className="capitalize" style={{ color: primaryColor }}>
					{status}
				</span>
			</div>
		)}
	</div>
);

const PriorityDisplay: React.FC<{ primaryColor: string; priorityLabel: string }> = ({
	primaryColor,
	priorityLabel,
}) => (
	<div className="mb-2 flex items-center">
		<BarChart4 className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
		<span className="text-muted-foreground text-xs">
			Prioridad: <span style={{ color: primaryColor }}>{priorityLabel}</span>
		</span>
	</div>
);

const ContentBlock: React.FC<{
	content?: string | null;
	hasContent: boolean;
	tcgMode: boolean;
	primaryColor: string;
}> = ({ content, hasContent, tcgMode }) => (
	<div
		className={cn('mb-2 text-muted-foreground', tcgMode ? 'rounded border border-border/40 bg-muted/20 p-2' : '')}
		style={{ fontSize: '0.8rem', lineHeight: '1.25rem' }}
	>
		{hasContent ? (
			<div className="line-clamp-4 overflow-hidden">{content}</div>
		) : (
			<div className="py-1 text-center italic opacity-70">Sin contenido</div>
		)}
	</div>
);

const TagsBlock: React.FC<{ tags: string[]; primaryColor: string; renderKey: string }> = ({
	tags,
	primaryColor,
	renderKey,
}) => (
	<div className="mb-2">
		<div className="mb-1 flex items-center gap-1 text-xs opacity-70">
			<Tag className="h-3.5 w-3.5" />
			<span>Etiquetas</span>
		</div>
		<div className="flex flex-wrap gap-1">
			{tags.slice(0, 5).map((tag) => (
				<Badge
					className="rounded-sm px-1.5 py-0.5 text-xs"
					key={`tag-${renderKey}-${tag}`}
					style={{ backgroundColor: `color-mix(in oklab, ${primaryColor}, transparent 80%)`, borderColor: `color-mix(in oklab, ${primaryColor}, transparent 60%)`, color: primaryColor }}
					variant="outline"
				>
					{tag}
				</Badge>
			))}
			{tags.length > 5 && (
				<Badge className="px-1.5 py-0.5 text-xs opacity-70" variant="outline">
					+{tags.length - 5} más
				</Badge>
			)}
		</div>
	</div>
);

const TCGStats: React.FC<{ relationCounts?: Record<string, number>; primaryColor: string }> = ({
	relationCounts,
	primaryColor,
}) => (
	<div className="mt-auto grid grid-cols-2 gap-x-4 gap-y-1 rounded border border-border/40 bg-muted/30 px-3 py-2">
		<StatBar
			icon={<Image className="h-3.5 w-3.5" />}
			label="Imágenes"
			maxValue={20}
			primaryColor={primaryColor}
			value={relationCounts?.images || 0}
		/>
		<StatBar
			icon={<Video className="h-3.5 w-3.5" />}
			label="Videos"
			maxValue={20}
			primaryColor={primaryColor}
			value={relationCounts?.videos || 0}
		/>
		<StatBar
			icon={<UserSquare className="h-3.5 w-3.5" />}
			label="Personajes"
			maxValue={20}
			primaryColor={primaryColor}
			value={relationCounts?.characters || 0}
		/>
		<StatBar
			icon={<FolderOpen className="h-3.5 w-3.5" />}
			label="Colecciones"
			maxValue={20}
			primaryColor={primaryColor}
			value={relationCounts?.collections || 0}
		/>
	</div>
);

const StandardCounters: React.FC<{ relationCounts?: Record<string, number>; primaryColor: string }> = ({
	relationCounts,
	primaryColor,
}) => (
	<div className="mt-auto grid grid-cols-2 gap-2 text-xs">
		<StatCounter
			count={relationCounts?.characters || 0}
			icon={<UserSquare className="h-3.5 w-3.5" />}
			label="Personajes"
			primaryColor={primaryColor}
		/>
		<StatCounter
			count={relationCounts?.places || 0}
			icon={<MapPin className="h-3.5 w-3.5" />}
			label="Lugares"
			primaryColor={primaryColor}
		/>
		<StatCounter
			count={(relationCounts?.worldItems || 0) + (relationCounts?.concepts || 0)}
			icon={<FileText className="h-3.5 w-3.5" />}
			label="Objetos"
			primaryColor={primaryColor}
		/>
		<StatCounter
			count={relationCounts?.prompts || 0}
			icon={<ListChecks className="h-3.5 w-3.5" />}
			label="Prompts"
			primaryColor={primaryColor}
		/>
	</div>
);

const AdditionalRelations: React.FC<{ relationCounts?: Record<string, number>; primaryColor: string }> = ({
	relationCounts,
	primaryColor,
}) => (
	<div className="mt-2 flex justify-center gap-2" style={{ ['--accent' as any]: primaryColor }}>
		{relationCounts?.tags && relationCounts.tags > 0 && (
			<Badge className="flex items-center gap-1 border-border/60 bg-muted/40 px-1.5 py-0.5 text-xs" variant="outline">
				<TagIcon className="h-3 w-3" />
				<span>{relationCounts.tags}</span>
			</Badge>
		)}
		{relationCounts?.prompts && relationCounts.prompts > 0 && (
			<Badge className="flex items-center gap-1 border-border/60 bg-muted/40 px-1.5 py-0.5 text-xs" variant="outline">
				<BookMarked className="h-3 w-3" />
				<span>{relationCounts.prompts}</span>
			</Badge>
		)}
		{relationCounts?.places && relationCounts.places > 0 && (
			<Badge className="flex items-center gap-1 border-border/60 bg-muted/40 px-1.5 py-0.5 text-xs" variant="outline">
				<MapPin className="h-3 w-3" />
				<span>{relationCounts.places}</span>
			</Badge>
		)}
		{relationCounts?.worldItems && relationCounts.worldItems > 0 && (
			<Badge className="flex items-center gap-1 border-border/60 bg-muted/40 px-1.5 py-0.5 text-xs" variant="outline">
				<HashIcon className="h-3 w-3" />
				<span>{relationCounts.worldItems}</span>
			</Badge>
		)}
	</div>
);

// Componente para mostrar un contador de estadísticas
function StatCounter({
	icon,
	count,
	label,
	primaryColor,
}: {
	icon: React.ReactNode;
	count: number;
	label: string;
	primaryColor: string;
}) {
	return (
		<div className="flex flex-col items-center justify-center">
			<div className="flex items-center gap-1">
				{icon}
				<span className="font-medium" style={{ color: primaryColor }}>
					{count}
				</span>
			</div>
			<div className="text-[0.65rem] opacity-70">{label}</div>
		</div>
	);
}

// Componente para barra de estadísticas estilo TCG
function StatBar({
	icon,
	label,
	value,
	maxValue,
	primaryColor,
}: {
	icon: React.ReactNode;
	label: string;
	value: number;
	maxValue: number;
	primaryColor: string;
}) {
	// Calcular porcentaje para la barra, con un mínimo para que siempre sea visible
	const percentage = value > 0 ? Math.max(5, Math.min(100, (value / maxValue) * 100)) : 0;

	return (
		<div className="flex w-full flex-col text-[0.7rem]">
			<div className="mb-1 flex items-center justify-between">
				<div className="flex items-center gap-1">
					{icon}
					<span className="opacity-80">{label}</span>
				</div>
				<span className="font-medium" style={{ color: primaryColor }}>
					{value}
				</span>
			</div>
			<div className="h-1.5 w-full overflow-hidden rounded-full bg-card">
				<div
					className="h-full rounded-full"
					style={{
						width: `${percentage}%`,
						backgroundColor: primaryColor,
						boxShadow: `0 0 4px ${primaryColor}`,
					}}
				/>
			</div>
		</div>
	);
}
