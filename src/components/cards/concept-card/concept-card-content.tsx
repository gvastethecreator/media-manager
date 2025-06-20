import { cn } from '@/lib/utils';
import { BookText, Globe, Image, MessageSquare, Package, Tag, UserSquare, VideoIcon } from 'lucide-react';
import { nanoid } from 'nanoid';
import React, { useEffect, useState } from 'react';
import { getConceptCounts } from './concept-server-actions';

interface ConceptCardContentProps {
	description?: string | null;
	content?: string | null;
	category?: string | null;
	tags?: string[] | string | null;
	primaryColor: string;
	secondaryColor?: string;
	conceptId: string;
	tcgMode?: boolean;
}

/**
 * Componente para el contenido principal de una tarjeta de concepto.
 * Diseñado con estilo TCG para mostrar la información de forma atractiva.
 */
export function ConceptCardContent({
	description,
	content,
	category = 'general',
	tags = '[]',
	primaryColor,
	secondaryColor,
	conceptId,
	tcgMode = true,
}: ConceptCardContentProps) {
	// Generar un ID de renderizado único
	const renderKey = React.useMemo(() => nanoid(), []);

	// Estado para guardar los contadores de relaciones
	const [relationCounts, setRelationCounts] = useState({
		// Contenido multimedia
		images: 0,
		videos: 0,

		// Entidades organizativas
		albums: 0,
		collections: 0,
		tags: 0,

		// Entidades de mundo
		characters: 0,
		places: 0,
		worldItems: 0,

		// Entidades utilitarias
		prompts: 0,
		notes: 0,
		wildcards: 0,
		properties: 0,
		groups: 0,
	});

	// Calcular total relaciones para efectos visuales
	const totalRelations = Object.values(relationCounts).reduce((sum, count) => sum + count, 0);

	// Parsear tags si es un string
	const parsedTags = typeof tags === 'string' ? (tags ? JSON.parse(tags) : []) : tags || [];

	// Cargar recuentos de relaciones al montar el componente
	useEffect(() => {
		const loadCounts = async () => {
			try {
				const counts = await getConceptCounts(conceptId);
				setRelationCounts(prev => ({ ...prev, ...counts }));
			} catch (error) {
				console.error('Error cargando recuentos:', error);
			}
		};

		loadCounts();
	}, [conceptId]);

	// Extracto del contenido si existe
	const contentPreview =
		content && content.length > 0 ? content.substring(0, 120) + (content.length > 120 ? '...' : '') : null;

	// Color secundario si no viene como prop
	const secColor = secondaryColor || `${primaryColor}90`;

	return (
		<div
			className={`p-3 flex-1 overflow-hidden flex flex-col ${tcgMode ? 'bg-black/10' : 'bg-card/80'}`}
			style={
				tcgMode
					? {
						backgroundImage: `
					radial-gradient(circle at 15% 50%, ${primaryColor}10 0%, transparent 25%),
					radial-gradient(circle at 85% 30%, ${secColor}10 0%, transparent 25%)
				`,
					}
					: {}
			}
		>
			{/* Decoración TCG */}
			{tcgMode && (
				<>
					<div
						className="absolute inset-x-0 top-[160px] h-[1px] opacity-30"
						style={{ background: `linear-gradient(to right, transparent, ${primaryColor}, transparent)` }}
					/>
					<div
						className="absolute right-3 top-[160px] h-6 w-6 rounded-full opacity-10"
						style={{ background: `radial-gradient(circle, ${primaryColor}, transparent 70%)` }}
					/>
				</>
			)}

			{/* Sección de categoría y rareza (basada en total relaciones) */}
			<div className="mb-2 flex justify-between items-center">
				<div
					className={cn('text-sm font-semibold mb-2', tcgMode && 'uppercase tracking-wide')}
					style={{ color: primaryColor }}
				>
					{tcgMode ? '◇ Concepto ◇' : 'Concepto'}
				</div>
				{category && (
					<div className="flex items-center text-xs opacity-70">
						<span className="capitalize">{category}</span>
						{tcgMode && (
							<span
								className="ml-1 px-1 rounded-sm text-[0.65rem]"
								style={{
									backgroundColor: `${primaryColor}30`,
									color: 'white',
									border: `1px solid ${primaryColor}50`,
								}}
							>
								{totalRelations > 50 ? 'RARO' : totalRelations > 20 ? 'POCO COMÚN' : 'COMÚN'}
							</span>
						)}
					</div>
				)}
			</div>

			{/* Descripción del concepto */}
			<div
				className={`mb-3 ${tcgMode ? 'text-white/90 bg-black/20 px-2 py-1.5 rounded-sm border border-white/5' : 'text-muted-foreground'}`}
				style={{
					fontSize: '0.8rem',
					lineHeight: '1.25rem',
					boxShadow: tcgMode ? `inset 0 0 5px ${primaryColor}20` : 'none',
				}}
			>
				{description ? (
					<div className="overflow-hidden line-clamp-3">{description}</div>
				) : contentPreview ? (
					<div className="overflow-hidden line-clamp-2 italic">{contentPreview}</div>
				) : (
					<div className="italic opacity-70 text-center py-1">Sin descripción</div>
				)}
			</div>

			{/* Etiquetas del concepto (si hay) */}
			{parsedTags.length > 0 && (
				<div className="mb-3">
					<div className="flex flex-wrap gap-1">
						{parsedTags.slice(0, 5).map((tag: string, _index: number) => (
							<span
								key={`tag-${renderKey}-${tag}`}
								className={`text-xs px-1.5 py-0.5 rounded-sm ${tcgMode ? 'border border-white/10' : 'bg-primary/10'}`}
								style={{
									backgroundColor: tcgMode ? `${primaryColor}30` : `${primaryColor}20`,
									color: tcgMode ? 'white' : primaryColor,
									boxShadow: tcgMode ? `0 0 5px ${primaryColor}20` : 'none',
								}}
							>
								{tag}
							</span>
						))}
						{parsedTags.length > 5 && (
							<span className={`text-xs px-1.5 py-0.5 rounded-sm opacity-80 ${tcgMode ? 'bg-black/20' : ''}`}>
								+{parsedTags.length - 5}
							</span>
						)}
					</div>
				</div>
			)}

			{/* Stats al estilo TCG */}
			{tcgMode && (
				<div className="mb-2">
					<div className="grid grid-cols-2 gap-1 text-[0.65rem] font-medium">
						<StatBar
							label="Conocimiento"
							value={Math.min(100, relationCounts.notes * 10 + relationCounts.prompts * 5)}
							color={primaryColor}
							max={100}
						/>
						<StatBar
							label="Influencia"
							value={Math.min(
								100,
								relationCounts.characters * 8 + relationCounts.places * 6 + relationCounts.worldItems * 4
							)}
							color={primaryColor}
							max={100}
						/>
						<StatBar
							label="Visibilidad"
							value={Math.min(100, relationCounts.images * 5 + relationCounts.videos * 10 + relationCounts.albums * 3)}
							color={primaryColor}
							max={100}
						/>
						<StatBar
							label="Conectividad"
							value={Math.min(
								100,
								relationCounts.collections * 6 + relationCounts.tags * 4 + relationCounts.groups * 8
							)}
							color={primaryColor}
							max={100}
						/>
					</div>
				</div>
			)}

			{/* Contadores de relaciones */}
			<div className="mt-auto grid grid-cols-4 gap-2 text-xs">
				<div className="col-span-4 mb-1">
					<div className="flex justify-between pb-1 mb-1 text-xs opacity-60 border-b border-white/10">
						<span>Relaciones principales</span>
						<span>{totalRelations}</span>
					</div>
				</div>

				{/* Primera fila - Mundo */}
				<StatCounter
					icon={<UserSquare className="h-3 w-3" />}
					count={relationCounts.characters}
					label="Personajes"
					primaryColor={primaryColor}
				/>
				<StatCounter
					icon={<Globe className="h-3 w-3" />}
					count={relationCounts.places}
					label="Lugares"
					primaryColor={primaryColor}
				/>
				<StatCounter
					icon={<Package className="h-3 w-3" />}
					count={relationCounts.worldItems}
					label="Objetos"
					primaryColor={primaryColor}
				/>
				<StatCounter
					icon={<BookText className="h-3 w-3" />}
					count={relationCounts.notes}
					label="Notas"
					primaryColor={primaryColor}
				/>

				{/* Segunda fila - Contenido */}
				<StatCounter
					icon={<Image className="h-3 w-3" />}
					count={relationCounts.images}
					label="Imágenes"
					primaryColor={primaryColor}
				/>
				<StatCounter
					icon={<VideoIcon className="h-3 w-3" />}
					count={relationCounts.videos}
					label="Videos"
					primaryColor={primaryColor}
				/>
				<StatCounter
					icon={<MessageSquare className="h-3 w-3" />}
					count={relationCounts.prompts}
					label="Prompts"
					primaryColor={primaryColor}
				/>
				<StatCounter
					icon={<Tag className="h-3 w-3" />}
					count={relationCounts.properties}
					label="Props"
					primaryColor={primaryColor}
				/>
			</div>
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
		<div className="flex flex-col items-center">
			<div
				className="flex items-center gap-0.5 mb-0.5 font-medium"
				style={{ color: count > 0 ? primaryColor : undefined }}
			>
				{icon}
				<span className="font-medium">{count}</span>
			</div>
			<div className="text-[0.6rem] opacity-70">{label}</div>
		</div>
	);
}

// Componente para barras de estadísticas tipo TCG
function StatBar({ label, value, color, max }: { label: string; value: number; color: string; max: number }) {
	// Calcular porcentaje pero limitar entre 0 y 100
	const percentage = Math.min(100, Math.max(0, (value / max) * 100));

	return (
		<div className="flex flex-col">
			<div className="flex justify-between items-center mb-0.5">
				<span className="uppercase tracking-wider">{label}</span>
				<span>{value}</span>
			</div>
			<div className="h-1.5 bg-black/30 rounded-sm overflow-hidden border border-white/5">
				<div
					className="h-full rounded-sm"
					style={{
						width: `${percentage}%`,
						background: `linear-gradient(to right, ${color}80, ${color})`,
						boxShadow: `0 0 3px ${color}`,
					}}
				/>
			</div>
		</div>
	);
}
