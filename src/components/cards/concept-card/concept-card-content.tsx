import { BookText, Brain, UserSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getConceptCounts } from './concept-server-actions';

interface ConceptCardContentProps {
	description?: string | null;
	content?: string | null;
	category?: string | null;
	tags?: string | null;
	primaryColor: string;
	conceptId: string;
}

/**
 * Componente para el contenido principal de una tarjeta de concepto.
 * Similar al cuadro de texto de una carta Magic.
 */
export function ConceptCardContent({
	description,
	content,
	category = 'general',
	tags = '[]',
	primaryColor,
	conceptId
}: ConceptCardContentProps) {
	// Estado para guardar los contadores de relaciones
	const [relationCounts, setRelationCounts] = useState({
		characters: 0,
		places: 0,
		worldItems: 0,
		notes: 0,
		prompts: 0,
		images: 0,
	});

	// Parsear tags si es un string
	const parsedTags = typeof tags === 'string'
		? (tags ? JSON.parse(tags) : [])
		: (tags || []);

	// Cargar recuentos de relaciones al montar el componente
	useEffect(() => {
		const loadCounts = async () => {
			try {
				const counts = await getConceptCounts(conceptId);
				setRelationCounts(counts);
			} catch (error) {
				console.error('Error cargando recuentos:', error);
			}
		};

		loadCounts();
	}, [conceptId]);

	return (
		<div className="p-3 bg-card/80 flex-1 overflow-hidden flex flex-col">
			{/* Sección de categoría y tags */}
			<div className="mb-2 flex justify-between items-center">
				<div className="text-xs uppercase tracking-wider font-medium" style={{ color: primaryColor }}>
					Concepto
				</div>
				{category && (
					<div className="flex items-center text-xs opacity-70">
						<span className="capitalize">{category}</span>
					</div>
				)}
			</div>

			{/* Descripción del concepto */}
			<div className="mb-3 text-muted-foreground" style={{ fontSize: '0.8rem', lineHeight: '1.25rem' }}>
				{description ? (
					<div className="overflow-hidden line-clamp-3">
						{description}
					</div>
				) : (
					<div className="italic opacity-70 text-center py-1">
						Sin descripción
					</div>
				)}
			</div>

			{/* Etiquetas del concepto (si hay) */}
			{parsedTags.length > 0 && (
				<div className="mb-3">
					<div className="flex flex-wrap gap-1">
						{parsedTags.map((tag: string, index: number) => (
							<span
								key={index}
								className="text-xs px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary"
								style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
							>
								{tag}
							</span>
						))}
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
					icon={<Brain className="h-3.5 w-3.5" />}
					count={relationCounts.places}
					label="Lugares"
					primaryColor={primaryColor}
				/>
				<StatCounter
					icon={<BookText className="h-3.5 w-3.5" />}
					count={relationCounts.notes}
					label="Notas"
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