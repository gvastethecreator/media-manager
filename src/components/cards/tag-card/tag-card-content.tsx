import { Keyboard, Tag as TagIcon } from 'lucide-react';

interface TagCardContentProps {
	description?: string | null;
	shortcut?: string | null;
	primaryColor: string;
}

/**
 * Componente para el contenido principal de la tarjeta de etiqueta.
 * Similar al texto de reglas de una carta Magic.
 */
export function TagCardContent({
	description,
	shortcut,
	primaryColor,
}: TagCardContentProps) {
	return (
		<div className="flex-grow p-3 overflow-y-auto scrollbar-thin" style={{ scrollbarColor: `${primaryColor} transparent` }}>
			{/* Contenedor con borde estilizado similar a las reglas de Magic */}
			<div
				className="h-full flex flex-col"
				style={{
					borderLeft: `1px solid ${primaryColor}20`,
					paddingLeft: '0.5rem',
				}}
			>
				{/* Icono decorativo de etiqueta */}
				<div className="flex items-center gap-1 mb-2">
					<TagIcon
						className="w-4 h-4 opacity-70"
						style={{ color: primaryColor }}
					/>
					<div
						className="flex-grow h-px"
						style={{ background: `linear-gradient(to right, ${primaryColor}70, transparent)` }}
					/>
				</div>

				{/* Descripción principal */}
				{description ? (
					<div className="mb-3 text-xs leading-relaxed" style={{ color: `${primaryColor}DD` }}>
						<p className="italic">{description}</p>
					</div>
				) : (
					<div className="mb-3 text-xs text-muted-foreground italic">
						Sin descripción
					</div>
				)}

				{/* Atajo de teclado */}
				{shortcut && (
					<div className="mt-auto">
						<div className="flex items-center gap-1 text-xs">
							<Keyboard className="w-3.5 h-3.5 text-muted-foreground" />
							<span className="font-medium text-muted-foreground">Atajo:</span>
							<code
								className="px-1.5 py-0.5 rounded text-xs font-mono"
								style={{
									background: `${primaryColor}15`,
									border: `1px solid ${primaryColor}30`,
									color: primaryColor
								}}
							>
								{shortcut}
							</code>
						</div>
						<div className="mt-1 text-xs text-muted-foreground">
							<span className="opacity-70">Puedes usar este atajo para aplicar rápidamente esta etiqueta.</span>
						</div>
					</div>
				)}

				{/* Diseño decorativo para rellenar espacio vacío */}
				{!shortcut && (
					<div className="mt-auto">
						<div
							className="w-full h-px mb-2 opacity-30"
							style={{ background: `linear-gradient(to right, ${primaryColor}, transparent 80%)` }}
						/>
						<div className="flex justify-center">
							<div
								className="w-8 h-8 rounded-full opacity-10"
								style={{
									background: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)`,
								}}
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}