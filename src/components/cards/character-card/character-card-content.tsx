import { Brain, Dumbbell, HeartPulse, Users, Zap } from 'lucide-react';

interface CharacterCardContentProps {
	description?: string | null;
	alignment?: string | null;
	primaryColor: string;
	stats?: {
		strength?: number;
		intelligence?: number;
		constitution?: number;
		charisma?: number;
		dexterity?: number;
	} | null | string;
}

/**
 * Componente para el contenido principal de una tarjeta de personaje.
 * Similar al cuadro de texto de una carta Magic.
 */
export function CharacterCardContent({
	description,
	alignment = 'neutral',
	primaryColor,
	stats
}: CharacterCardContentProps) {
	// Parsear stats si es un string
	const parsedStats = typeof stats === 'string'
		? (stats ? JSON.parse(stats) : {})
		: (stats || {});

	// Asegurar que tenemos valores por defecto para todas las stats
	const characterStats = {
		strength: parsedStats.strength || parsedStats.str || 3,
		intelligence: parsedStats.intelligence || parsedStats.int || 3,
		constitution: parsedStats.constitution || parsedStats.con || 3,
		charisma: parsedStats.charisma || parsedStats.cha || 3,
		dexterity: parsedStats.dexterity || parsedStats.dex || 3,
	};

	return (
		<div className="p-3.5 bg-card/80 flex-1 overflow-hidden flex flex-col">
			{/* Sección de estadísticas */}
			<div className="mb-2.5">
				<div className="flex justify-between">
					<div className="text-xs uppercase tracking-wider font-medium mb-1.5" style={{ color: primaryColor }}>
						Atributos
					</div>
					<div className="text-xs opacity-70">Alineamiento: {alignment}</div>
				</div>

				{/* Grid de estadísticas */}
				<div className="grid grid-cols-5 gap-2 mb-3">
					<StatBar
						icon={<Dumbbell className="h-3.5 w-3.5" />}
						value={characterStats.strength}
						label="FUE"
						primaryColor={primaryColor}
					/>
					<StatBar
						icon={<Zap className="h-3.5 w-3.5" />}
						value={characterStats.dexterity}
						label="DES"
						primaryColor={primaryColor}
					/>
					<StatBar
						icon={<HeartPulse className="h-3.5 w-3.5" />}
						value={characterStats.constitution}
						label="CON"
						primaryColor={primaryColor}
					/>
					<StatBar
						icon={<Brain className="h-3.5 w-3.5" />}
						value={characterStats.intelligence}
						label="INT"
						primaryColor={primaryColor}
					/>
					<StatBar
						icon={<Users className="h-3.5 w-3.5" />}
						value={characterStats.charisma}
						label="CAR"
						primaryColor={primaryColor}
					/>
				</div>
			</div>

			{/* Descripción del personaje */}
			<div className="text-muted-foreground" style={{ fontSize: '0.8rem', lineHeight: '1.25rem' }}>
				{description ? (
					<div className="overflow-hidden line-clamp-5">
						{description}
					</div>
				) : (
					<div className="italic opacity-70 text-center py-1">
						Sin descripción
					</div>
				)}
			</div>
		</div>
	);
}

// Componente para mostrar una barra de estadística
function StatBar({ icon, value, label, primaryColor }: {
	icon: React.ReactNode;
	value: number;
	label: string;
	primaryColor: string;
}) {
	// Normalizar el valor entre 0 y 10 para la visualización
	const normalizedValue = Math.max(0, Math.min(10, value));

	return (
		<div className="flex flex-col items-center">
			<div className="mb-1 flex items-center justify-center">
				{icon}
			</div>
			<div className="h-12 w-4 bg-gray-700/30 rounded-sm relative overflow-hidden">
				<div
					className="absolute bottom-0 left-0 right-0 transition-all duration-500"
					style={{
						height: `${(normalizedValue / 10) * 100}%`,
						backgroundColor: primaryColor
					}}
				/>
			</div>
			<div className="mt-1 text-xs font-medium tracking-tight">{label}</div>
		</div>
	);
}