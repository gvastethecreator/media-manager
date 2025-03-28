import { BarChart4, FileText, ListChecks, MapPin, Tag, UserSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getNoteCounts } from './note-server-actions';

interface NoteCardContentProps {
	content?: string | null;
	category?: string | null;
	tags?: string[] | null;
	status?: string | null;
	priority?: number | null;
	primaryColor: string;
	noteId: string;
}

/**
 * Componente para el contenido principal de una tarjeta de nota.
 * Similar al cuadro de texto de una carta Magic.
 */
export function NoteCardContent({
	content,
	category = 'general',
	tags = [],
	status = 'pendiente',
	priority = 0,
	primaryColor,
	noteId
}: NoteCardContentProps) {
	// Estado para guardar los contadores de relaciones
	const [relationCounts, setRelationCounts] = useState({
		characters: 0,
		places: 0,
		worldItems: 0,
		concepts: 0,
		prompts: 0,
		images: 0,
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

	return (
		<div className="p-3 bg-card/80 flex-1 overflow-hidden flex flex-col">
			{/* Sección de categoría y etiquetas */}
			<div className="mb-2 flex justify-between items-center">
				<div className="text-xs uppercase tracking-wider font-medium" style={{ color: primaryColor }}>
					{category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Nota'}
				</div>
				{status && (
					<div className="flex items-center text-xs opacity-80">
						<ListChecks className="h-3.5 w-3.5 mr-1" />
						<span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
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
			<div className="mb-2 text-muted-foreground" style={{ fontSize: '0.8rem', lineHeight: '1.25rem' }}>
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
							<span
								key={index}
								className="text-xs px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary"
								style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
							>
								{tag}
							</span>
						))}
						{Array.isArray(tags) && tags.length > 5 && (
							<span className="text-xs px-1.5 py-0.5 opacity-70">
								+{tags.length - 5} más
							</span>
						)}
					</div>
				</div>
			)}

			{/* Contadores de relaciones */}
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