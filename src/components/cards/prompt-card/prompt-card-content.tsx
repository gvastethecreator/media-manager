import { Album, Code, Image, Settings, Target, UserSquare } from 'lucide-react';
import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PromptCardContentProps {
	name: string;
	description?: string | null;
	content?: string;
	purpose?: string;
	parameters?: Record<string, any> | string;
	category?: string;
	tags?: string[] | string;
	emoji?: string | null;
	color?: string;
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
	relationCounts = {},
	tcgMode = true,
	compact = false,
}: PromptCardContentProps) {
	// Parsear tags si es un string
	const parsedTags = useMemo(() => {
		if (typeof tags === 'string') {
			try {
				return tags ? JSON.parse(tags) : [];
			} catch (_e) {
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
			} catch (_e) {
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
	const _hasRelations = Object.values(relationCounts).some((count) => count > 0);

	return (
		<div
			className={cn('flex flex-1 flex-col overflow-hidden p-3', tcgMode ? 'bg-card/80' : 'bg-card')}
			style={{
				background: tcgMode ? `linear-gradient(to bottom, transparent, ${primaryColor}10)` : undefined,
				borderBottom: tcgMode ? `1px solid ${borderColor}` : undefined,
				boxShadow: tcgMode ? `0 0 15px ${primaryColor}20 inset` : undefined,
			}}
		>
			{/* Sección de categoría y etiquetas */}
			<div className="mb-2 flex items-center justify-between">
				<div
					className="flex items-center gap-1 font-medium text-xs uppercase tracking-wider"
					style={{ color: primaryColor }}
				>
					{category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Prompt'}
					{tcgMode && <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />}
				</div>

				{hasParameters && (
					<div className="flex items-center text-xs opacity-70">
						<Settings className="mr-1 h-3.5 w-3.5" />
						<span>
							{parameterKeys.length} {parameterKeys.length === 1 ? 'parámetro' : 'parámetros'}
						</span>
					</div>
				)}
			</div>

			{/* Sección de contenido principal */}
			{mainContent && (
				<div className="mb-2 text-muted-foreground" style={{ fontSize: '0.8rem', lineHeight: '1.25rem' }}>
					<div className={cn('overflow-hidden', compact ? 'line-clamp-2' : 'line-clamp-3', tcgMode && 'font-medium')}>
						{mainContentPreview}
					</div>
				</div>
			)}

			{/* Sección de propósito, si existe y no se ha mostrado antes */}
			{purpose && !description && (
				<div className="mb-2 flex items-start gap-1">
					<Target className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" style={{ color: primaryColor }} />
					<div className="line-clamp-2 text-muted-foreground text-xs">{purpose}</div>
				</div>
			)}

			{/* Etiquetas del prompt (si hay y no está en modo compacto) */}
			{hasTags && !compact && (
				<div className="mb-2">
					<div className="flex flex-wrap gap-1">
						{parsedTags.slice(0, maxTagsToShow).map((tag: string) => (
							<Badge
								className="px-1.5 py-0.5 text-xs"
								key={`tag-${tag}`}
								style={{
									backgroundColor: tagColor,
									color: primaryColor,
									borderColor: primaryColor,
									boxShadow: tcgMode ? `0 0 5px ${primaryColor}30` : undefined,
								}}
								variant="outline"
							>
								{tag}
							</Badge>
						))}
						{parsedTags.length > maxTagsToShow && (
							<Badge className="px-1.5 py-0.5 text-xs opacity-70" variant="outline">
								+{parsedTags.length - maxTagsToShow}
							</Badge>
						)}
					</div>
				</div>
			)}

			{/* Parámetros principales si existen (en modo no compacto) */}
			{hasParameters && !compact && (
				<div className="mb-2 rounded border bg-black/5 p-1.5" style={{ borderColor: `${primaryColor}40` }}>
					<div className="mb-1 flex items-center gap-1 font-medium text-xs" style={{ color: primaryColor }}>
						<Settings className="h-3.5 w-3.5" />
						<span>Parámetros</span>
					</div>
					<div className="grid grid-cols-2 gap-1.5 text-xs">
						{parameterKeys.slice(0, 4).map((key) => (
							<div
								className="flex justify-between overflow-hidden rounded bg-black/5 px-1.5 py-0.5"
								key={`param-${key}`}
								style={{ backgroundColor: `${primaryColor}10` }}
							>
								<span className="truncate font-medium">{key}:</span>
								<span className="ml-1 truncate opacity-80">
									{typeof parsedParameters[key] === 'object'
										? '{...}'
										: String(parsedParameters[key]).substring(0, 10) +
											(String(parsedParameters[key]).length > 10 ? '...' : '')}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Contadores de relaciones */}
			<div className="mt-auto grid grid-cols-4 gap-2 text-xs">
				<StatCounter
					count={relationCounts.collections || 0}
					icon={<Image className="h-3.5 w-3.5" />}
					label="Colecciones"
					primaryColor={primaryColor}
				/>
				<StatCounter
					count={relationCounts.albums || 0}
					icon={<Album className="h-3.5 w-3.5" />}
					label="Álbumes"
					primaryColor={primaryColor}
				/>
				<StatCounter
					count={relationCounts.characters || 0}
					icon={<UserSquare className="h-3.5 w-3.5" />}
					label="Personajes"
					primaryColor={primaryColor}
				/>
				<StatCounter
					count={content ? Math.ceil(content.length / 100) : 0}
					icon={<Code className="h-3.5 w-3.5" />}
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
	primaryColor,
}: {
	icon: React.ReactNode;
	count: number;
	label: string;
	primaryColor: string;
}) {
	return (
		<div className="flex flex-col items-center">
			<div className="mb-1 flex items-center gap-1">
				{icon}
				<span className="font-medium" style={{ color: primaryColor }}>
					{count}
				</span>
			</div>
			<div className="text-[0.65rem] opacity-70">{label}</div>
		</div>
	);
}
