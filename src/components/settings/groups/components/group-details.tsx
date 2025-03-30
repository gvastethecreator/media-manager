interface GroupDetailsProps {
	description?: string | null;
	category?: string | null;
	shortcut?: string | null;
	sortBy?: string | null;
	color?: string;
}

export function GroupDetails({
	description,
	category,
	shortcut,
	sortBy,
	color
}: GroupDetailsProps) {
	return (
		<>
			{/* Descripción */}
			{description && (
				<div className="space-y-2">
					<h3 className="text-sm font-medium">Descripción</h3>
					<p className="text-sm text-muted-foreground">{description}</p>
				</div>
			)}

			{/* Categoría */}
			<div className="space-y-2">
				<h3 className="text-sm font-medium">Categoría</h3>
				<p className="text-sm text-muted-foreground">{category || 'Sin categoría'}</p>
			</div>

			{/* Atajo */}
			{shortcut && (
				<div className="space-y-2">
					<h3 className="text-sm font-medium">Atajo</h3>
					<p className="text-sm text-muted-foreground">{shortcut}</p>
				</div>
			)}

			{/* Orden */}
			<div className="space-y-2">
				<h3 className="text-sm font-medium">Ordenamiento</h3>
				<p className="text-sm text-muted-foreground">{sortBy || 'Por nombre'}</p>
			</div>

			{/* Color */}
			{color && (
				<div className="space-y-2">
					<h3 className="text-sm font-medium">Color</h3>
					<div className="flex items-center gap-2">
						<div
							className="w-4 h-4 rounded"
							style={{ backgroundColor: color }}
						/>
						<span className="text-sm text-muted-foreground">{color}</span>
					</div>
				</div>
			)}
		</>
	);
}