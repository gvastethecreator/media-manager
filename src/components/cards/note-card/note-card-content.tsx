import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BarChart4, BookMarked, FileText, FolderOpen, HashIcon, Image, ListChecks, MapPin, Tag, TagIcon, UserSquare, Video } from 'lucide-react';
import { nanoid } from "nanoid";
import React, { useEffect, useState } from "react";
import { getNoteCounts, type NoteRelationCounts } from './note-server-actions';

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
	secondaryColor,
	noteId,
	tcgMode = true
}: NoteCardContentProps) {
	// Generar un ID de renderizado único
	const renderKey = React.useMemo(() => nanoid(), []);

	// Estado para guardar los contadores de relaciones
	const [relationCounts, setRelationCounts] = useState<NoteRelationCounts>({
		characters: 0,
		places: 0,
		worldItems: 0,
		concepts: 0,
		prompts: 0,
		images: 0,
		videos: 0,
		albums: 0,
		collections: 0,
		tags: 0,
		wildcards: 0,
		properties: 0,
		groups: 0
	});

	// Determinar si se muestran elementos
	const hasTags = Array.isArray(tags) && tags.length > 0;
	const hasContent = content && content.length > 0;

	// Formatear la prioridad con etiquetas
	const priorityLabel = priority === 0 ? 'Normal' :
		priority === 1 ? 'Alta' :
			priority === 2 ? 'Urgente' : 'Baja';

	// Cargar recuentos de relaciones al montar el componente
	useEffect(() => {
		const loadCounts = async () => {
			try {
				const counts = await getNoteCounts(noteId);
				setRelationCounts(counts);
			} catch (error) {
				console.error('Error cargando recuentos:', error);
			}
		};

		loadCounts();
	}, [noteId]);

	// Calcular el total de relaciones
	const totalRelations = Object.values(relationCounts).reduce((sum, count) => sum + count, 0);

	return (
		<div className={cn(
			"p-3 flex-1 overflow-hidden flex flex-col",
			tcgMode ? "bg-card/90 bg-gradient-to-b from-black/40 to-black/60" : "bg-card/80"
		)}>
			{/* Sección de categoría y etiquetas */}
			<div className="mb-2 flex justify-between items-center">
				<div className="text-xs uppercase tracking-wider font-medium"
					style={{ color: primaryColor }}>
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
				<BarChart4 className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
				<span className="text-xs text-muted-foreground">
					Prioridad: <span style={{ color: primaryColor }}>{priorityLabel}</span>
				</span>
			</div>

			{/* Contenido de la nota */}
			<div className={cn(
				"mb-2 text-muted-foreground",
				tcgMode ? "p-2 bg-black/20 rounded border border-white/10" : ""
			)}
				style={{ fontSize: '0.8rem', lineHeight: '1.25rem' }}>
				{hasContent ? (
					<div className="overflow-hidden line-clamp-4">
						{content}
					</div>
				) : (
					<div className="italic opacity-70 text-center py-1">
						Sin contenido
					</div>
				)}
			</div>

			{/* Etiquetas de la nota (si hay) */}
			{hasTags && (
				<div className="mb-2">
					<div className="flex items-center gap-1 text-xs opacity-70 mb-1">
						<Tag className="h-3.5 w-3.5" />
						<span>Etiquetas</span>
					</div>
					<div className="flex flex-wrap gap-1">
						{tags.slice(0, 5).map((tag: string, index: number) => (
							<Badge
								key={`tag-${renderKey}-${tag}`}
								variant="outline"
								className="text-xs px-1.5 py-0.5 rounded-sm"
								style={{
									backgroundColor: `${primaryColor}20`,
									borderColor: `${primaryColor}40`,
									color: primaryColor
								}}
							>
								{tag}
							</Badge>
						))}
						{Array.isArray(tags) && tags.length > 5 && (
							<Badge
								variant="outline"
								className="text-xs px-1.5 py-0.5 opacity-70"
							>
								+{tags.length - 5} más
							</Badge>
						)}
					</div>
				</div>
			)}

			{/* Estadísticas TCG */}
			{tcgMode && (
				<div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-auto py-2 px-3 bg-black/30 rounded border border-white/10">
					<StatBar
						icon={<Image className="h-3.5 w-3.5" />}
						label="Imágenes"
						value={relationCounts.images}
						maxValue={20}
						primaryColor={primaryColor}
					/>
					<StatBar
						icon={<Video className="h-3.5 w-3.5" />}
						label="Videos"
						value={relationCounts.videos}
						maxValue={20}
						primaryColor={primaryColor}
					/>
					<StatBar
						icon={<UserSquare className="h-3.5 w-3.5" />}
						label="Personajes"
						value={relationCounts.characters}
						maxValue={20}
						primaryColor={primaryColor}
					/>
					<StatBar
						icon={<FolderOpen className="h-3.5 w-3.5" />}
						label="Colecciones"
						value={relationCounts.collections}
						maxValue={20}
						primaryColor={primaryColor}
					/>
				</div>
			)}

			{/* Contadores de relaciones estándar */}
			{!tcgMode && (
				<div className="mt-auto grid grid-cols-2 gap-2 text-xs">
					<StatCounter
						icon={<UserSquare className="h-3.5 w-3.5" />}
						count={relationCounts.characters}
						label="Personajes"
						primaryColor={primaryColor}
					/>
					<StatCounter
						icon={<MapPin className="h-3.5 w-3.5" />}
						count={relationCounts.places}
						label="Lugares"
						primaryColor={primaryColor}
					/>
					<StatCounter
						icon={<FileText className="h-3.5 w-3.5" />}
						count={relationCounts.worldItems + relationCounts.concepts}
						label="Objetos"
						primaryColor={primaryColor}
					/>
					<StatCounter
						icon={<ListChecks className="h-3.5 w-3.5" />}
						count={relationCounts.prompts}
						label="Prompts"
						primaryColor={primaryColor}
					/>
				</div>
			)}

			{/* Relaciones adicionales en estilo TCG */}
			{tcgMode && totalRelations > 0 && (
				<div className="flex justify-center gap-2 mt-2">
					{relationCounts.tags > 0 && (
						<Badge variant="outline" className="text-xs px-1.5 py-0.5 flex items-center gap-1 bg-black/40 border-white/20">
							<TagIcon className="h-3 w-3" />
							<span>{relationCounts.tags}</span>
						</Badge>
					)}
					{relationCounts.prompts > 0 && (
						<Badge variant="outline" className="text-xs px-1.5 py-0.5 flex items-center gap-1 bg-black/40 border-white/20">
							<BookMarked className="h-3 w-3" />
							<span>{relationCounts.prompts}</span>
						</Badge>
					)}
					{relationCounts.places > 0 && (
						<Badge variant="outline" className="text-xs px-1.5 py-0.5 flex items-center gap-1 bg-black/40 border-white/20">
							<MapPin className="h-3 w-3" />
							<span>{relationCounts.places}</span>
						</Badge>
					)}
					{relationCounts.worldItems > 0 && (
						<Badge variant="outline" className="text-xs px-1.5 py-0.5 flex items-center gap-1 bg-black/40 border-white/20">
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
function StatCounter({ icon, count, label, primaryColor }: {
	icon: React.ReactNode;
	count: number;
	label: string;
	primaryColor: string;
}) {
	return (
		<div className="flex flex-col items-center justify-center">
			<div className="flex items-center gap-1">
				{icon}
				<span className="font-medium">{count}</span>
			</div>
			<div className="text-[0.65rem] opacity-70">{label}</div>
		</div>
	);
}

// Componente para barra de estadísticas estilo TCG
function StatBar({ icon, label, value, maxValue, primaryColor }: {
	icon: React.ReactNode;
	label: string;
	value: number;
	maxValue: number;
	primaryColor: string;
}) {
	// Calcular porcentaje para la barra, con un mínimo para que siempre sea visible
	const percentage = value > 0 ? Math.max(5, Math.min(100, (value / maxValue) * 100)) : 0;

	return (
		<div className="flex flex-col w-full text-[0.7rem]">
			<div className="flex items-center justify-between mb-1">
				<div className="flex items-center gap-1">
					{icon}
					<span className="opacity-80">{label}</span>
				</div>
				<span className="font-medium" style={{ color: primaryColor }}>{value}</span>
			</div>
			<div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
				<div
					className="h-full rounded-full"
					style={{
						width: `${percentage}%`,
						backgroundColor: primaryColor,
						boxShadow: `0 0 4px ${primaryColor}`
					}}
				/>
			</div>
		</div>
	);
}