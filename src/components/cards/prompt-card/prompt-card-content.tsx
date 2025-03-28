import { BookText, Code, Settings, UserSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getPromptCounts } from './prompt-server-actions';

interface PromptCardContentProps {
	description?: string | null;
	content?: string | null;
	parameters?: string | null;
	category?: string | null;
	tags?: string | null;
	primaryColor: string;
	promptId: string;
}

/**
 * Componente para el contenido principal de una tarjeta de prompt.
 * Similar al cuadro de texto de una carta Magic.
 */
export function PromptCardContent({
	description,
	content,
	parameters = '{}',
	category = 'general',
	tags = '[]',
	primaryColor,
	promptId
}: PromptCardContentProps) {
	// Estado para guardar los contadores de relaciones
	const [relationCounts, setRelationCounts] = useState({
		characters: 0,
		places: 0,
		worldItems: 0,
		concepts: 0,
		notes: 0,
		images: 0,
	});

	// Parsear tags si es un string
	const parsedTags = typeof tags === 'string'
		? (tags ? JSON.parse(tags) : [])
		: (tags || []);

	// Parsear parámetros si es un string
	const parsedParameters = typeof parameters === 'string'
		? (parameters ? JSON.parse(parameters) : {})
		: (parameters || {});

	// Cargar recuentos de relaciones al montar el componente
	useEffect(() => {
		const loadCounts = async () => {
			try {
				const counts = await getPromptCounts(promptId);
				setRelationCounts(counts);
			} catch (error) {
				console.error('Error cargando recuentos:', error);
			}
		};

		loadCounts();
	}, [promptId]);

	// Determinar si se muestran los parámetros o tags
	const hasParameters = Object.keys(parsedParameters).length > 0;
	const hasTags = parsedTags.length > 0;

	return (
		<div className="p-3 bg-card/80 flex-1 overflow-hidden flex flex-col">
			{/* Sección de categoría y etiquetas */}
			<div className="mb-2 flex justify-between items-center">
				<div className="text-xs uppercase tracking-wider font-medium" style={{ color: primaryColor }}>
					{category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Prompt'}
				</div>
				{hasParameters && (
					<div className="flex items-center text-xs opacity-70">
						<Settings className="h-3.5 w-3.5 mr-1" />
						<span>{Object.keys(parsedParameters).length} parámetros</span>
					</div>
				)}
			</div>

			{/* Descripción del prompt */}
			<div className="mb-2 text-muted-foreground" style={{ fontSize: '0.8rem', lineHeight: '1.25rem' }}>
				{description ? (
					<div className="overflow-hidden line-clamp-3">
						{description}
					</div>
				) : content ? (
					<div className="overflow-hidden line-clamp-3">
						{content.length > 150 ? content.substring(0, 150) + '...' : content}
					</div>
				) : (
					<div className="italic opacity-70 text-center py-1">
						Sin descripción
					</div>
				)}
			</div>

			{/* Etiquetas del prompt (si hay) */}
			{hasTags && (
				<div className="mb-2">
					<div className="flex flex-wrap gap-1">
						{parsedTags.slice(0, 5).map((tag: string, index: number) => (
							<span
								key={index}
								className="text-xs px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary"
								style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
							>
								{tag}
							</span>
						))}
						{parsedTags.length > 5 && (
							<span className="text-xs px-1.5 py-0.5 opacity-70">
								+{parsedTags.length - 5} más
							</span>
						)}
					</div>
				</div>
			)}

			{/* Extracto de contenido con formato de código si existe */}
			{content && content.length > 0 && !description && (
				<div className="mb-2">
					<div className="flex items-center gap-1 text-xs opacity-70 mb-1">
						<Code className="h-3.5 w-3.5" />
						<span>Contenido</span>
					</div>
					<div className="text-xs bg-black/5 p-1.5 rounded overflow-hidden text-muted-foreground">
						<pre className="line-clamp-2 font-mono text-[0.65rem]">
							{content.substring(0, 100)}{content.length > 100 ? '...' : ''}
						</pre>
					</div>
				</div>
			)}

			{/* Contadores de relaciones */}
			<div className="mt-auto grid grid-cols-3 gap-2 text-xs">
				<StatCounter
					icon={<UserSquare className="h-3.5 w-3.5" />}
					count={relationCounts.characters}
					label="Personajes"
					primaryColor={primaryColor}
				/>
				<StatCounter
					icon={<BookText className="h-3.5 w-3.5" />}
					count={relationCounts.notes}
					label="Notas"
					primaryColor={primaryColor}
				/>
				<StatCounter
					icon={<Settings className="h-3.5 w-3.5" />}
					count={Object.keys(parsedParameters).length}
					label="Parámetros"
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
		<div className="flex flex-col items-center">
			<div className="flex items-center gap-1 mb-1">
				{icon}
				<span className="font-medium">{count}</span>
			</div>
			<div className="text-[0.65rem] opacity-70">{label}</div>
		</div>
	);
}