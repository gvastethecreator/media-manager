/**
 * Placeholder del visor 3D (por implementar con three.js u otro)
 */
export function ThreeDViewer({ src }: { src: string }) {
	return (
		<div className="flex h-64 items-center justify-center rounded-md border">
			<div className="text-muted-foreground text-sm">Vista 3D no disponible aún · Archivo: {src}</div>
		</div>
	);
}
