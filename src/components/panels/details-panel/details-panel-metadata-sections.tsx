import { Calendar, Camera, Copy, CopyCheck, ImageIcon, Info, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatBytes } from '@/lib/utils/format.utils';
import { InfoItem } from './details-panel-info-item';
import type { InfoItemData, MetadataSectionsProps } from './details-panel-types';

// Helper to render a list of info items
function renderInfoItems(items: (InfoItemData | null | undefined)[]) {
	return items
		.filter((item): item is InfoItemData => !!item && (item.condition === undefined || item.condition))
		.map((item) => <InfoItem key={item.label} label={item.label} value={item.value || 'N/A'} icon={item.icon} />);
}

/**
 * Componente para metadata XMP
 */
export function XMPInfo({ metadata }: MetadataSectionsProps) {
	const [copied, setCopied] = useState(false);
	const xmp = metadata?.xmp as Record<string, any> | undefined;

	if (!xmp) {
		return <div className="text-xs text-muted-foreground">No hay datos XMP disponibles</div>;
	}

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		});
	};

	const infoItems: (InfoItemData | null)[] = [
		{
			label: 'Creador',
			value: String(xmp.creator || ''),
			icon: <Info className="h-3.5 w-3.5 text-blue-500" />,
			condition: !!xmp.creator,
		},
		{
			label: 'Título',
			value: String(xmp.title || ''),
			icon: <Info className="h-3.5 w-3.5 text-blue-500" />,
			condition: !!xmp.title,
		},
		{
			label: 'Descripción',
			value: String(xmp.description || ''),
			icon: <Info className="h-3.5 w-3.5 text-blue-500" />,
			condition: !!xmp.description,
		},
		{
			label: 'Derechos',
			value: String(xmp.rights || ''),
			icon: <Copy className="h-3.5 w-3.5 text-red-500" />,
			condition: !!xmp.rights,
		},
		{
			label: 'Toolkit',
			value: String(xmp.toolkit || ''),
			icon: <Info className="h-3.5 w-3.5 text-purple-500" />,
			condition: !!xmp.toolkit,
		},
	];

	const hasAnyInfo =
		infoItems.some((item) => item?.condition) ||
		(xmp.subject && Array.isArray(xmp.subject) && xmp.subject.length > 0) ||
		xmp.rawData;

	return (
		<div className="space-y-3">
			{renderInfoItems(infoItems)}

			{xmp.subject && Array.isArray(xmp.subject) && xmp.subject.length > 0 && (
				<div>
					<InfoItem
						label="Etiquetas"
						icon={<Info className="h-3.5 w-3.5 text-green-500" />}
						value={
							<div className="flex flex-wrap gap-1 justify-end">
								{xmp.subject.map((tag: string) => (
									<button
										key={`xmp-tag-${tag}`}
										className="text-xs rounded-full bg-muted px-2 py-0.5 hover:bg-muted/80"
										onClick={() => copyToClipboard(tag)}
										type="button"
									>
										{tag}
									</button>
								))}
							</div>
						}
					/>
				</div>
			)}

			{xmp.rawData && (
				<div>
					<InfoItem
						label="Datos XMP sin procesar"
						icon={<Info className="h-3.5 w-3.5 text-amber-500" />}
						value={
							<div className="relative">
								<div className="max-h-20 w-full overflow-y-auto text-xs p-2 bg-muted/50 rounded-md font-mono whitespace-pre-wrap text-[10px] text-left">
									{typeof xmp.rawData === 'string'
										? xmp.rawData.substring(0, 500) + (xmp.rawData.length > 500 ? '...' : '')
										: JSON.stringify(xmp.rawData, null, 2)}
								</div>
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												size="sm"
												variant="ghost"
												className="absolute top-1 right-1 h-6 w-6 p-0"
												onClick={() =>
													copyToClipboard(
														typeof xmp.rawData === 'string' ? xmp.rawData : JSON.stringify(xmp.rawData, null, 2)
													)
												}
											>
												{copied ? (
													<CopyCheck className="h-3.5 w-3.5 text-green-500" />
												) : (
													<Copy className="h-3.5 w-3.5" />
												)}
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											<p className="text-xs">{copied ? 'Copiado!' : 'Copiar al portapapeles'}</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</div>
						}
					/>
				</div>
			)}

			{!hasAnyInfo && (
				<p className="text-xs text-muted-foreground italic">
					Esta imagen contiene metadatos XMP pero no hay información detallada disponible
				</p>
			)}
		</div>
	);
}

/**
 * Componente para metadata IPTC
 */
export function IPTCInfo({ metadata }: MetadataSectionsProps) {
	const iptc = metadata?.iptc as Record<string, any> | undefined;

	if (!iptc) {
		return <div className="text-xs text-muted-foreground">No hay datos IPTC disponibles</div>;
	}

	const infoItems: (InfoItemData | null)[] = [
		{
			label: 'Creador',
			value: Array.isArray(iptc.creator) ? iptc.creator.join(', ') : String(iptc.creator || ''),
			icon: <Info className="h-3.5 w-3.5 text-blue-500" />,
			condition: !!(iptc.creator && (Array.isArray(iptc.creator) ? iptc.creator.length > 0 : true)),
		},
		{
			label: 'Titular',
			value: String(iptc.headline || ''),
			icon: <Info className="h-3.5 w-3.5 text-amber-500" />,
			condition: !!iptc.headline,
		},
		{
			label: 'Leyenda',
			value: String(iptc.caption || ''),
			icon: <Info className="h-3.5 w-3.5 text-purple-500" />,
			condition: !!iptc.caption,
		},
		{
			label: 'Copyright',
			value: String(iptc.copyright || ''),
			icon: <Copy className="h-3.5 w-3.5 text-red-500" />,
			condition: !!iptc.copyright,
		},
		{
			label: 'Fuente',
			value: String(iptc.source || ''),
			icon: <Info className="h-3.5 w-3.5 text-green-500" />,
			condition: !!iptc.source,
		},
	];

	const hasAnyInfo =
		infoItems.some((item) => item?.condition) ||
		(iptc.keywords && Array.isArray(iptc.keywords) && iptc.keywords.length > 0);

	return (
		<div className="space-y-3">
			{renderInfoItems(infoItems)}

			{iptc.keywords && Array.isArray(iptc.keywords) && iptc.keywords.length > 0 && (
				<InfoItem
					label="Palabras clave"
					icon={<Info className="h-3.5 w-3.5 text-green-500" />}
					value={
						<div className="flex flex-wrap gap-1 justify-end">
							{iptc.keywords.map((keyword: string) => (
								<div key={`iptc-keyword-${keyword}`} className="text-xs rounded-full bg-muted px-2 py-0.5">
									{keyword}
								</div>
							))}
						</div>
					}
				/>
			)}

			{!hasAnyInfo && (
				<p className="text-xs text-muted-foreground italic">
					Esta imagen contiene metadatos IPTC pero no hay información detallada disponible
				</p>
			)}
		</div>
	);
}

/**
 * Componente para metadata EXIF
 */
export function ExifInfo({ metadata }: MetadataSectionsProps) {
	const exif = metadata?.exif as Record<string, any> | undefined;

	if (!exif) {
		return <div className="text-xs text-muted-foreground">No hay datos EXIF disponibles</div>;
	}

	const formatExifDate = (dateStr?: string | Date) => {
		if (!dateStr) return 'No disponible';
		try {
			const date =
				typeof dateStr === 'string' ? new Date(dateStr.replace(/(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')) : dateStr;
			if (Number.isNaN(date.getTime())) return typeof dateStr === 'string' ? dateStr : 'Fecha inválida';
			return date.toLocaleString();
		} catch (_error) {
			return String(dateStr);
		}
	};

	const infoItems: (InfoItemData | null)[] = [
		{
			label: 'Fabricante',
			value: exif.make,
			icon: <Camera className="h-3.5 w-3.5 text-indigo-500" />,
			condition: !!exif.make,
		},
		{
			label: 'Modelo',
			value: exif.model,
			icon: <Camera className="h-3.5 w-3.5 text-indigo-500" />,
			condition: !!exif.model,
		},
		{
			label: 'Software',
			value: exif.software,
			icon: <Info className="h-3.5 w-3.5 text-blue-500" />,
			condition: !!exif.software,
		},
		{
			label: 'Fecha',
			value: formatExifDate(exif.dateTime),
			icon: <Calendar className="h-3.5 w-3.5 text-amber-500" />,
			condition: !!exif.dateTime,
		},
		{
			label: 'Tiempo exposición',
			value: exif.exposureTime ? `${exif.exposureTime}s` : null,
			icon: <Camera className="h-3.5 w-3.5 text-purple-500" />,
			condition: !!exif.exposureTime,
		},
		{
			label: 'Apertura',
			value: exif.fNumber ? `f/${exif.fNumber}` : null,
			icon: <Camera className="h-3.5 w-3.5 text-purple-500" />,
			condition: !!exif.fNumber,
		},
		{ label: 'ISO', value: exif.iso, icon: <Camera className="h-3.5 w-3.5 text-purple-500" />, condition: !!exif.iso },
		{
			label: 'Distancia focal',
			value: exif.focalLength,
			icon: <Camera className="h-3.5 w-3.5 text-purple-500" />,
			condition: !!exif.focalLength,
		},
		{
			label: 'Flash',
			value: exif.flash,
			icon: <Camera className="h-3.5 w-3.5 text-yellow-500" />,
			condition: !!exif.flash,
		},
		{
			label: 'Programa exposición',
			value: exif.exposureProgram,
			icon: <Info className="h-3.5 w-3.5" />,
			condition: !!exif.exposureProgram,
		},
		{
			label: 'Modo medición',
			value: exif.meteringMode,
			icon: <Info className="h-3.5 w-3.5" />,
			condition: !!exif.meteringMode,
		},
		{
			label: 'Balance de blancos',
			value: exif.whiteBalance,
			icon: <Info className="h-3.5 w-3.5" />,
			condition: !!exif.whiteBalance,
		},
		{
			label: 'Modelo de lente',
			value: exif.lensModel,
			icon: <Camera className="h-3.5 w-3.5 text-gray-500" />,
			condition: !!exif.lensModel,
		},
	];

	const hasAnyInfo = infoItems.some((item) => item?.condition);

	return (
		<div className="space-y-3">
			{renderInfoItems(infoItems)}
			{!hasAnyInfo && <p className="text-xs text-muted-foreground italic">No hay datos EXIF detallados disponibles.</p>}
		</div>
	);
}

/**
 * Componente para metadata GPS
 */
export function GPSInfo({ metadata }: MetadataSectionsProps) {
	if (!metadata?.gps) {
		return <div className="text-xs text-muted-foreground">No hay datos GPS disponibles</div>;
	}

	const { gps } = metadata;

	const formatCoordinate = (value: number, isLatitude: boolean) => {
		const direction = isLatitude ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'O';
		return `${Math.abs(value).toFixed(6)}° ${direction}`;
	};

	const infoItems: (InfoItemData | null)[] = [
		{
			label: 'Latitud',
			value: typeof gps.latitude === 'number' ? formatCoordinate(gps.latitude, true) : null,
			icon: <MapPin className="h-3.5 w-3.5 text-green-500" />,
			condition: typeof gps.latitude === 'number',
		},
		{
			label: 'Longitud',
			value: typeof gps.longitude === 'number' ? formatCoordinate(gps.longitude, false) : null,
			icon: <MapPin className="h-3.5 w-3.5 text-green-500" />,
			condition: typeof gps.longitude === 'number',
		},
		{
			label: 'Altitud',
			value: typeof gps.altitude === 'number' ? `${gps.altitude.toFixed(2)}m` : null,
			icon: <MapPin className="h-3.5 w-3.5 text-blue-500" />,
			condition: typeof gps.altitude === 'number',
		},
	];

	const hasGpsData = typeof gps.latitude === 'number' && typeof gps.longitude === 'number';
	const hasAnyInfo = infoItems.some((item) => item?.condition);

	return (
		<div className="space-y-3">
			{renderInfoItems(infoItems)}

			{hasGpsData && (
				<div className="mt-2 text-right">
					<a
						href={`https://www.google.com/maps/search/?api=1&query=${gps.latitude},${gps.longitude}`}
						target="_blank"
						rel="noopener noreferrer"
						className="text-xs text-primary hover:underline"
					>
						Ver en Google Maps
					</a>
				</div>
			)}
			{!hasAnyInfo && <p className="text-xs text-muted-foreground italic">No hay datos GPS detallados disponibles.</p>}
		</div>
	);
}

/**
 * Componente para metadata técnica
 */
export function TechnicalInfo({ metadata }: MetadataSectionsProps) {
	if (!metadata) {
		return <div className="text-xs text-muted-foreground">No hay datos técnicos disponibles</div>;
	}

	const infoItems: (InfoItemData | null)[] = [
		{
			label: 'Dimensiones',
			value: `${metadata.width} x ${metadata.height}`,
			icon: <ImageIcon className="h-3.5 w-3.5 text-purple-500" />,
			condition: !!(metadata.width && metadata.height),
		},
		{
			label: 'Formato',
			value: metadata.format,
			icon: <Info className="h-3.5 w-3.5 text-blue-500" />,
			condition: !!metadata.format,
		},
		{
			label: 'Tamaño',
			value: metadata.sizeInBytes ? formatBytes(metadata.sizeInBytes) : null,
			icon: <Info className="h-3.5 w-3.5 text-red-500" />,
			condition: !!metadata.sizeInBytes,
		},
		{
			label: 'Espacio de color',
			value: metadata.colorSpace,
			icon: <Info className="h-3.5 w-3.5" />,
			condition: !!metadata.colorSpace,
		},
		{
			label: 'Perfil de color',
			value: (metadata as any).colorProfile || null,
			icon: <Info className="h-3.5 w-3.5" />,
			condition: !!(metadata as any).colorProfile,
		},
		{
			label: 'Canal Alfa',
			value: (metadata as any).hasAlpha === undefined ? null : (metadata as any).hasAlpha ? 'Sí' : 'No',
			icon: <Info className="h-3.5 w-3.5" />,
			condition: (metadata as any).hasAlpha !== undefined,
		},
		{
			label: 'Orientación',
			value: (metadata as any).orientation || null,
			icon: <Info className="h-3.5 w-3.5" />,
			condition: !!(metadata as any).orientation,
		},
		{
			label: 'Densidad',
			value: (metadata as any).density ? `${(metadata as any).density} dpi` : null,
			icon: <Info className="h-3.5 w-3.5" />,
			condition: !!(metadata as any).density,
		},
	];

	const hasAnyInfo = infoItems.some((item) => item?.condition);

	return (
		<div className="space-y-3">
			{renderInfoItems(infoItems)}
			{!hasAnyInfo && (
				<p className="text-xs text-muted-foreground italic">No hay datos técnicos detallados disponibles.</p>
			)}
		</div>
	);
}
