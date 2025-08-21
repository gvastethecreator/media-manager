export function FileListHeader() {
	return (
		<div className="sticky top-0 z-10 grid grid-cols-[1fr_6rem_5rem_6rem] items-center gap-2 border-b bg-background/80 p-2 text-muted-foreground text-xs backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div>Nombre</div>
			<div className="text-right">Fecha</div>
			<div className="text-right">Dimensiones</div>
			<div className="text-right">Tamaño</div>
		</div>
	);
}
