interface GroupDetailsProps {
	description?: string | null;
	category?: string | null;
	shortcut?: string | null;
	sortBy?: string | null;
	color?: string | null;
}

export function GroupDetails({ description, category, shortcut, sortBy, color }: GroupDetailsProps) {
	return (
		<>
			{/* Descripción */}
			{description && (
				<div className="space-y-2">
					<h3 className="font-medium text-sm">Descripción</h3>
					<p className="text-muted-foreground text-sm">{description}</p>
				</div>
			)}

			{/* Categoría */}
			<div className="space-y-2">
				<h3 className="font-medium text-sm">Categoría</h3>
				<p className="text-muted-foreground text-sm">{category || 'Sin categoría'}</p>
			</div>

			{/* Atajo */}
			{shortcut && (
				<div className="space-y-2">
					<h3 className="font-medium text-sm">Atajo</h3>
					<p className="text-muted-foreground text-sm">{shortcut}</p>
				</div>
			)}

			{/* Orden */}
			<div className="space-y-2">
				<h3 className="font-medium text-sm">Ordenamiento</h3>
				<p className="text-muted-foreground text-sm">{sortBy || 'Por nombre'}</p>
			</div>

			{/* Color */}
			{color && (
				<div className="space-y-2">
					<h3 className="font-medium text-sm">Color</h3>
					<div className="flex items-center gap-2">
						<div className="h-4 w-4 rounded" style={{ backgroundColor: color }} />
						<span className="text-muted-foreground text-sm">{color}</span>
					</div>
				</div>
			)}
		</>
	);
}
