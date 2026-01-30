import { BookText, Globe, Image, MessageSquare, Package, Tag, UserSquare, VideoIcon } from 'lucide-react';
import { nanoid } from 'nanoid';
import React, { useEffect, useState } from 'react';
import { getConceptCountsFromApi } from '@/lib/api/client/concept.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { cn } from '@/lib/utils';

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

	// Parsear tags si es un string con lookup table pattern
	const parseTagsString = (tagsInput: string | string[]): string[] => {
		if (typeof tagsInput === 'string') {
			return tagsInput ? JSON.parse(tagsInput) : [];
		}
		return tagsInput || [];
	};

	// Guard contra null para cumplir firma de parseTagsString
	const parsedTags = tags ? parseTagsString(tags) : [];

	// Cargar recuentos de relaciones al montar el componente
	useEffect(() => {
		const loadCounts = async () => {
			try {
				const counts = await getConceptCountsFromApi(conceptId);
				setRelationCounts((prev) => ({ ...prev, ...counts }));
			} catch (error) {
				clientLogger.error('Error cargando recuentos:', error);
			}
		};

		loadCounts();
	}, [conceptId]);

	// Extracto del contenido con helper function
	const generateContentPreview = (inputContent: string | null | undefined): string | null => {
		if (!inputContent || inputContent.length === 0) {
			return null;
		}

		const CONTENT_LIMIT = 120;

		if (inputContent.length > CONTENT_LIMIT) {
			return `${inputContent.substring(0, CONTENT_LIMIT)}...`;
		}

		return inputContent;
	};

	const contentPreview = generateContentPreview(content);

	// Color secundario si no viene como prop
	const secColor = secondaryColor || `${primaryColor}90`;

	return (
		<div
			className={`flex flex-1 flex-col overflow-hidden p-3 ${tcgMode ? 'bg-muted/10' : 'bg-card/80'}`}
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
						className="absolute top-[160px] right-3 h-6 w-6 rounded-full opacity-10"
						style={{ background: `radial-gradient(circle, ${primaryColor}, transparent 70%)` }}
					/>
				</>
			)}

			{/* Sección de categoría y rareza (basada en total relaciones) */}
			<div className="mb-2 flex items-center justify-between">
				<div
					className={cn('mb-2 font-semibold text-sm', tcgMode && 'uppercase tracking-wide')}
					style={{ color: primaryColor }}
				>
					{tcgMode ? '◇ Concepto ◇' : 'Concepto'}
				</div>
				{category && (
					<div className="flex items-center text-sm opacity-70">
						<span className="capitalize">{category}</span>
						{tcgMode && (
							<span
								className="ml-1 rounded-sm px-1 text-[0.65rem]"
								style={{
									backgroundColor: `${primaryColor}30`,
									color: 'white',
									border: `1px solid ${primaryColor}50`,
								}}
							>
								{(() => {
									if (totalRelations > 50) {
										return 'RARO';
									}
									if (totalRelations > 20) {
										return 'POCO COMÚN';
									}
									return 'COMÚN';
								})()}
							</span>
						)}
					</div>
				)}
			</div>

			{/* Descripción del concepto */}
			<div
				className={`mb-3 ${tcgMode ? 'rounded-sm border border-border/20 bg-muted/20 px-2 py-1.5 text-white/90' : 'text-muted-foreground'}`}
				style={{
					fontSize: '0.8rem',
					lineHeight: '1.25rem',
					boxShadow: tcgMode ? `inset 0 0 5px ${primaryColor}20` : 'none',
				}}
			>
				{(() => {
					if (description) {
						return <div className="line-clamp-3 overflow-hidden">{description}</div>;
					}
					if (contentPreview) {
						return <div className="line-clamp-2 overflow-hidden italic">{contentPreview}</div>;
					}
					return <div className="py-1 text-center italic opacity-70">Sin descripción</div>;
				})()}
			</div>

			{/* Etiquetas del concepto (si hay) */}
			{parsedTags.length > 0 && (
				<div className="mb-3">
					<div className="flex flex-wrap gap-1">
						{parsedTags.slice(0, 5).map((tag: string, _index: number) => (
							<span
								className={`rounded-sm px-1.5 py-0.5 text-sm ${tcgMode ? 'border border-border/40' : 'bg-primary/10'}`}
								key={`tag-${renderKey}-${tag}`}
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
							<span className={`rounded-sm px-1.5 py-0.5 text-sm opacity-80 ${tcgMode ? 'bg-muted/20' : ''}`}>
								+{parsedTags.length - 5}
							</span>
						)}
					</div>
				</div>
			)}

			{/* Stats al estilo TCG */}
			{tcgMode && (
				<div className="mb-2">
					<div className="grid grid-cols-2 gap-1 font-medium text-[0.65rem]">
						<StatBar
							color={primaryColor}
							label="Conocimiento"
							max={100}
							value={Math.min(100, relationCounts.notes * 10 + relationCounts.prompts * 5)}
						/>
						<StatBar
							color={primaryColor}
							label="Influencia"
							max={100}
							value={Math.min(
								100,
								relationCounts.characters * 8 + relationCounts.places * 6 + relationCounts.worldItems * 4
							)}
						/>
						<StatBar
							color={primaryColor}
							label="Visibilidad"
							max={100}
							value={Math.min(100, relationCounts.images * 5 + relationCounts.videos * 10 + relationCounts.albums * 3)}
						/>
						<StatBar
							color={primaryColor}
							label="Conectividad"
							max={100}
							value={Math.min(
								100,
								relationCounts.collections * 6 + relationCounts.tags * 4 + relationCounts.groups * 8
							)}
						/>
					</div>
				</div>
			)}

			{/* Contadores de relaciones */}
			<div className="mt-auto grid grid-cols-4 gap-2 text-sm">
				<div className="col-span-4 mb-1">
					<div className="mb-1 flex justify-between border-border/40 border-b pb-1 text-sm opacity-60">
						<span>Relaciones principales</span>
						<span>{totalRelations}</span>
					</div>
				</div>

				{/* Primera fila - Mundo */}
				<StatCounter
					count={relationCounts.characters}
					icon={<UserSquare className="h-4 w-4" />}
					label="Personajes"
					primaryColor={primaryColor}
				/>
				<StatCounter
					count={relationCounts.places}
					icon={<Globe className="h-4 w-4" />}
					label="Lugares"
					primaryColor={primaryColor}
				/>
				<StatCounter
					count={relationCounts.worldItems}
					icon={<Package className="h-4 w-4" />}
					label="Objetos"
					primaryColor={primaryColor}
				/>
				<StatCounter
					count={relationCounts.notes}
					icon={<BookText className="h-4 w-4" />}
					label="Notas"
					primaryColor={primaryColor}
				/>

				{/* Segunda fila - Contenido */}
				<StatCounter
					count={relationCounts.images}
					icon={<Image className="h-4 w-4" />}
					label="Imágenes"
					primaryColor={primaryColor}
				/>
				<StatCounter
					count={relationCounts.videos}
					icon={<VideoIcon className="h-4 w-4" />}
					label="Videos"
					primaryColor={primaryColor}
				/>
				<StatCounter
					count={relationCounts.prompts}
					icon={<MessageSquare className="h-4 w-4" />}
					label="Prompts"
					primaryColor={primaryColor}
				/>
				<StatCounter
					count={relationCounts.properties}
					icon={<Tag className="h-4 w-4" />}
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
				className="mb-0.5 flex items-center gap-0.5 font-medium"
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
			<div className="mb-0.5 flex items-center justify-between">
				<span className="uppercase tracking-wider">{label}</span>
				<span>{value}</span>
			</div>
			<div className="h-1.5 overflow-hidden rounded-sm border border-border/20 bg-muted/30">
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
