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
export function NoteCardContent({
	content,
	category = 'general',
	tags = [],
	status = 'pendiente',
	priority = 0,
	primaryColor,
	noteId,
	tcgMode = true,
}: NoteCardContentProps) {
	// Generar un ID de renderizado único
	const renderKey = React.useMemo(() => nanoid(), []);

	// Usar el hook para obtener contadores de relaciones
	const { data: relationCounts } = useNoteCounts(noteId);

	// Determinar si se muestran elementos
	const hasTags = Array.isArray(tags) && tags.length > 0;
	const hasContent = content && content.length > 0;

	// Formatear la prioridad con etiquetas
	const priorityLabel = priority === 0 ? 'Normal' : priority === 1 ? 'Alta' : priority === 2 ? 'Urgente' : 'Baja';

	// Calcular el total de relaciones
	const totalRelations = relationCounts ? Object.values(relationCounts).reduce((sum, count) => sum + count, 0) : 0;

	return (
		<div
			className={cn(
				'flex flex-1 flex-col overflow-hidden p-3',
				tcgMode ? 'bg-card/90 bg-gradient-to-b from-black/40 to-black/60' : 'bg-card/80'
			)}
		>
			{/* Sección de categoría y etiquetas */}
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

			{/* Prioridad de la nota */}
			<div className="mb-2 flex items-center">
				<BarChart4 className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
				<span className="text-muted-foreground text-xs">
					Prioridad: <span style={{ color: primaryColor }}>{priorityLabel}</span>
				</span>
			</div>

			{/* Contenido de la nota */}
			<div
				className={cn('mb-2 text-muted-foreground', tcgMode ? 'rounded border border-white/10 bg-black/20 p-2' : '')}
				style={{ fontSize: '0.8rem', lineHeight: '1.25rem' }}
			>
				{hasContent ? (
					<div className="line-clamp-4 overflow-hidden">{content}</div>
				) : (
					<div className="py-1 text-center italic opacity-70">Sin contenido</div>
				)}
			</div>

			{/* Etiquetas de la nota (si hay) */}
			{hasTags && (
				<div className="mb-2">
					<div className="mb-1 flex items-center gap-1 text-xs opacity-70">
						<Tag className="h-3.5 w-3.5" />
						<span>Etiquetas</span>
					</div>
					<div className="flex flex-wrap gap-1">
						{tags.slice(0, 5).map((tag: string, _index: number) => (
							<Badge
								className="rounded-sm px-1.5 py-0.5 text-xs"
								key={`tag-${renderKey}-${tag}`}
								style={{
									backgroundColor: `${primaryColor}20`,
									borderColor: `${primaryColor}40`,
									color: primaryColor,
								}}
								variant="outline"
							>
								{tag}
							</Badge>
						))}
						{Array.isArray(tags) && tags.length > 5 && (
							<Badge className="px-1.5 py-0.5 text-xs opacity-70" variant="outline">
								+{tags.length - 5} más
							</Badge>
						)}
					</div>
				</div>
			)}

			{/* Estadísticas TCG */}
			{tcgMode && (
				<div className="mt-auto grid grid-cols-2 gap-x-4 gap-y-1 rounded border border-white/10 bg-black/30 px-3 py-2">
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
			)}

			{/* Contadores de relaciones estándar */}
			{!tcgMode && (
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
			)}

			{/* Relaciones adicionales en estilo TCG */}
			{tcgMode && totalRelations > 0 && (
				<div className="mt-2 flex justify-center gap-2">
					{relationCounts?.tags && relationCounts.tags > 0 && (
						<Badge
							className="flex items-center gap-1 border-white/20 bg-black/40 px-1.5 py-0.5 text-xs"
							variant="outline"
						>
							<TagIcon className="h-3 w-3" />
							<span>{relationCounts.tags}</span>
						</Badge>
					)}
					{relationCounts?.prompts && relationCounts.prompts > 0 && (
						<Badge
							className="flex items-center gap-1 border-white/20 bg-black/40 px-1.5 py-0.5 text-xs"
							variant="outline"
						>
							<BookMarked className="h-3 w-3" />
							<span>{relationCounts.prompts}</span>
						</Badge>
					)}
					{relationCounts?.places && relationCounts.places > 0 && (
						<Badge
							className="flex items-center gap-1 border-white/20 bg-black/40 px-1.5 py-0.5 text-xs"
							variant="outline"
						>
							<MapPin className="h-3 w-3" />
							<span>{relationCounts.places}</span>
						</Badge>
					)}
					{relationCounts?.worldItems && relationCounts.worldItems > 0 && (
						<Badge
							className="flex items-center gap-1 border-white/20 bg-black/40 px-1.5 py-0.5 text-xs"
							variant="outline"
						>
							<HashIcon className="h-3 w-3" />
							<span>{relationCounts.worldItems}</span>
						</Badge>
					)}
				</div>
			)}
		</div>
	);
}

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
			<div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
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
