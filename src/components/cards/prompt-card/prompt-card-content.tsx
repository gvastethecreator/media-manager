'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Album, Code, Image, Settings, Target, UserSquare } from 'lucide-react';
import { useMemo } from 'react';

interface PromptCardContentProps {
	description?: string | null;
	content?: string;
	purpose?: string;
	parameters?: Record<string, any> | string;
	category?: string;
	tags?: string[] | string;
	primaryColor: string;
	secondaryColor?: string;
	relationCounts?: {
		characters?: number;
		notes?: number;
		concepts?: number;
		places?: number;
		worldItems?: number;
		collections?: number;
		albums?: number;
	};
	tcgMode?: boolean;
	compact?: boolean;
}

/**
 * Componente para el contenido principal de una tarjeta de prompt.
 * Similar al cuadro de texto de una carta TCG.
 */
export function PromptCardContent({
	description,
	content = '',
	purpose = '',
	parameters = {},
	category = 'general',
	tags = [],
	primaryColor,
	secondaryColor,
	relationCounts = {},
	tcgMode = true,
	compact = false
}: PromptCardContentProps) {
	// Parsear tags si es un string
	const parsedTags = useMemo(() => {
		if (typeof tags === 'string') {
			try {
				return tags ? JSON.parse(tags) : [];
			} catch (e) {
				return [];
			}
		}
		return tags || [];
	}, [tags]);

	// Parsear parámetros si es un string
	const parsedParameters = useMemo(() => {
		if (typeof parameters === 'string') {
			try {
				return parameters ? JSON.parse(parameters) : {};
			} catch (e) {
				return {};
			}
		}
		return parameters || {};
	}, [parameters]);

	// Determinar si se muestran los parámetros o tags
	const parameterKeys = Object.keys(parsedParameters);
	const hasParameters = parameterKeys.length > 0;
	const hasTags = parsedTags.length > 0;
	const maxTagsToShow = compact ? 3 : 5;

	// Estilo para elementos basados en el color primario
	const tagColor = `${primaryColor}20`;
	const borderColor = `${primaryColor}30`;

	// Contenido principal a mostrar (descripción, propósito o contenido)
	const mainContent = description || purpose || content;
	const mainContentPreview = mainContent
		? mainContent.length > (compact ? 80 : 150)
			? `${mainContent.substring(0, compact ? 80 : 150)}...`
			: mainContent
		: 'Sin descripción';

	// Determinar qué relaciones mostrar
	const hasRelations = Object.values(relationCounts).some(count => count > 0);

	return (
		<div
			className={cn(
				"flex flex-col p-3 flex-1 overflow-hidden",
				tcgMode ? "bg-card/80" : "bg-card"
			)}
			style={{
				background: tcgMode
					? `linear-gradient(to bottom, transparent, ${primaryColor}10)`
					: undefined,
				borderBottom: tcgMode
					? `1px solid ${borderColor}`
					: undefined,
				boxShadow: tcgMode
					? `0 0 15px ${primaryColor}20 inset`
					: undefined
			}}
		>
			{/* Sección de categoría y etiquetas */}
			<div className="mb-2 flex justify-between items-center">
				<div
					className="text-xs uppercase tracking-wider font-medium flex items-center gap-1"
					style={{ color: primaryColor }}
				>
					{category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Prompt'}
					{tcgMode && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }}></div>}
				</div>

				{hasParameters && (
					<div className="flex items-center text-xs opacity-70">
						<Settings className="h-3.5 w-3.5 mr-1" />
						<span>{parameterKeys.length} {parameterKeys.length === 1 ? "parámetro" : "parámetros"}</span>
					</div>
				)}
			</div>

			{/* Sección de contenido principal */}
			{mainContent && (
				<div className="mb-2 text-muted-foreground" style={{ fontSize: '0.8rem', lineHeight: '1.25rem' }}>
					<div className={cn(
						"overflow-hidden",
						compact ? "line-clamp-2" : "line-clamp-3",
						tcgMode && "font-medium"
					)}>
						{mainContentPreview}
					</div>
				</div>
			)}

			{/* Sección de propósito, si existe y no se ha mostrado antes */}
			{purpose && !description && (
				<div className="mb-2 flex items-start gap-1">
					<Target className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" style={{ color: primaryColor }} />
					<div className="text-xs line-clamp-2 text-muted-foreground">{purpose}</div>
				</div>
			)}

			{/* Etiquetas del prompt (si hay y no está en modo compacto) */}
			{hasTags && !compact && (
				<div className="mb-2">
					<div className="flex flex-wrap gap-1">
						{parsedTags.slice(0, maxTagsToShow).map((tag: string) => (
							<Badge
								key={`tag-${tag}`}
								variant="outline"
								className="px-1.5 py-0.5 text-xs"
								style={{
									backgroundColor: tagColor,
									color: primaryColor,
									borderColor: primaryColor,
									boxShadow: tcgMode ? `0 0 5px ${primaryColor}30` : undefined
								}}
							>
								{tag}
							</Badge>
						))}
						{parsedTags.length > maxTagsToShow && (
							<Badge
								variant="outline"
								className="px-1.5 py-0.5 text-xs opacity-70"
							>
								+{parsedTags.length - maxTagsToShow}
							</Badge>
						)}
					</div>
				</div>
			)}

			{/* Parámetros principales si existen (en modo no compacto) */}
			{hasParameters && !compact && (
				<div className="mb-2 bg-black/5 rounded p-1.5 border" style={{ borderColor: `${primaryColor}40` }}>
					<div className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: primaryColor }}>
						<Settings className="h-3.5 w-3.5" />
						<span>Parámetros</span>
					</div>
					<div className="grid grid-cols-2 gap-1.5 text-xs">
						{parameterKeys.slice(0, 4).map((key) => (
							<div
								key={`param-${key}`}
								className="flex justify-between bg-black/5 px-1.5 py-0.5 rounded overflow-hidden"
								style={{ backgroundColor: `${primaryColor}10` }}
							>
								<span className="font-medium truncate">{key}:</span>
								<span className="truncate ml-1 opacity-80">
									{typeof parsedParameters[key] === 'object'
										? '{...}'
										: String(parsedParameters[key]).substring(0, 10) + (String(parsedParameters[key]).length > 10 ? '...' : '')}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Contadores de relaciones */}
			<div className="mt-auto grid grid-cols-4 gap-2 text-xs">
				<StatCounter
					icon={<Image className="h-3.5 w-3.5" />}
					count={relationCounts.collections || 0}
					label="Colecciones"
					primaryColor={primaryColor}
				/>
				<StatCounter
					icon={<Album className="h-3.5 w-3.5" />}
					count={relationCounts.albums || 0}
					label="Álbumes"
					primaryColor={primaryColor}
				/>
				<StatCounter
					icon={<UserSquare className="h-3.5 w-3.5" />}
					count={relationCounts.characters || 0}
					label="Personajes"
					primaryColor={primaryColor}
				/>
				<StatCounter
					icon={<Code className="h-3.5 w-3.5" />}
					count={content ? Math.ceil(content.length / 100) : 0}
					label="Tokens"
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
	primaryColor
}: {
	icon: React.ReactNode;
	count: number;
	label: string;
	primaryColor: string;
}) {
	return (
		<div className="flex flex-col items-center">
			<div className="flex items-center gap-1 mb-1">
				{icon}
				<span className="font-medium">{count}</span>
			</div>
			<div className="text-[0.65rem] opacity-70">{label}</div>
		</div>
	);
}