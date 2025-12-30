import { BaseItem, type BaseItemProps, getFallbackContent, getThumbnailUrl } from './base-item';

export interface File3DItemProps extends BaseItemProps {
	/** Mostrar tipo de archivo 3D */
	showFileType?: boolean;
}

export function File3DItem({ item, size, showFileType = true, ...baseProps }: File3DItemProps) {
	const thumbnailUrl = getThumbnailUrl(item, size);
	const { icon, bgColor } = getFallbackContent(item);

	const get3DFileType = (name?: string): string => {
		if (name?.endsWith('.obj')) return 'OBJ';
		if (name?.endsWith('.fbx')) return 'FBX';
		if (name?.endsWith('.gltf')) return 'GLTF';
		if (name?.endsWith('.glb')) return 'GLB';
		if (name?.endsWith('.dae')) return 'DAE';
		if (name?.endsWith('.3ds')) return '3DS';
		if (name?.endsWith('.blend')) return 'Blender';
		if (name?.endsWith('.stl')) return 'STL';
		if (name?.endsWith('.ply')) return 'PLY';
		return '3D';
	};

	return (
		<BaseItem item={item} size={size} {...baseProps}>
			<div className="relative h-full w-full overflow-hidden rounded-lg">
				{thumbnailUrl ? (
					<img alt={item.name} className="h-full w-full object-cover" loading="lazy" src={thumbnailUrl} />
				) : (
					<div className={`flex h-full w-full items-center justify-center ${bgColor}`}>
						<span className="text-4xl">{icon}</span>
					</div>
				)}

				{/* Indicador 3D animado */}
				<div className="absolute top-2 left-2">
					<div className="animate-pulse rounded bg-cyan-500 px-1 py-0.5 text-white text-xs">3D</div>
				</div>

				{/* Indicador de tipo de archivo */}
				{showFileType && (
					<div className="absolute top-2 right-2">
						<div className="rounded bg-gray-700 px-1 py-0.5 text-white text-xs">{get3DFileType(item.name)}</div>
					</div>
				)}

				{/* Overlay con información */}
				<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2">
					<p className="truncate font-medium text-white text-xs">{item.name}</p>

					{item.size && <p className="text-gray-200 text-xs">{(item.size / (1024 * 1024)).toFixed(1)} MB</p>}
				</div>
			</div>
		</BaseItem>
	);
}
