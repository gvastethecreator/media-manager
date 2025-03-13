"use client";

import { updateImageStats } from "@/app/actions/images";
import { parseMetadata } from "@/app/actions/metadata";
import { getAIGenerationInfo } from "@/app/actions/metadata/metadata-parsers.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils/utils";
import type { ImageItem } from "@/types/image-item";
import type { FileMetadata } from "@/types/metadata.types";
import {
	Bug,
	Calendar,
	Camera,
	FileImage,
	FileText,
	Folder,
	HardDrive,
	Info,
	Layers,
	Loader2,
	MapPin as MapIcon,
	Settings2,
	Sparkles,
} from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";
import { AIGenerationInfo } from "./details-panel-ai-generation-info";
import { BasicInfo } from "./details-panel-basic-info";
import {
	ExifInfo,
	GPSInfo,
	IPTCInfo,
	TechnicalInfo,
	XMPInfo,
} from "./details-panel-metadata-sections";
import type { DetailsPanelProps } from "./details-panel-types";
import { getMetadata } from "./details-panel-utils";

// Logger para el panel de detalles
const detailsLogger = {
	info: (message: string, data?: unknown) =>
		console.info(`[DetailsPanel] ${message}`, data || ""),
	warn: (message: string, data?: unknown) =>
		console.warn(`[DetailsPanel] ${message}`, data || ""),
	error: (message: string, data?: unknown) =>
		console.error(`[DetailsPanel] ${message}`, data || ""),
};

// Componente para previsualización de imagen
function ImagePreview({ item }: { item: ImageItem }) {
	return (
		<div className="w-full h-full flex items-center justify-center bg-black/30">
			{item.url ? (
				<img
					src={item.url}
					alt={item.name}
					className="max-h-full max-w-full object-contain"
				/>
			) : (
				<FileImage className="h-12 w-12 text-muted" />
			)}
		</div>
	);
}

// Componente temporal para secciones que faltan
function RelatedEntities() {
	return (
		<div className="p-3 border border-dashed border-muted-foreground/30 rounded-md">
			<p className="text-xs text-muted-foreground text-center">
				Esta funcionalidad está en desarrollo.
			</p>
		</div>
	);
}

/**
 * Analiza un objeto de metadatos para extraer información útil
 */
async function parseMetadataDirectly(
	rawMetadata: string | null
): Promise<FileMetadata | null> {
	if (!rawMetadata) {
		return null;
	}

	try {
		// Intentar parsear el JSON
		const parsed = JSON.parse(rawMetadata);

		// Construir objeto resultado
		const result: Partial<FileMetadata> = {};

		// Copiar propiedades básicas
		if (parsed.dimensions) {
			result.dimensions = parsed.dimensions;
		}
		if (parsed.mimeType) {
			result.mimeType = parsed.mimeType;
		}
		if (parsed.colorSpace) {
			result.colorSpace = parsed.colorSpace;
		}
		if (parsed.hasAlpha !== undefined) {
			result.hasAlpha = parsed.hasAlpha;
		}
		if (parsed.isAnimated !== undefined) {
			result.isAnimated = parsed.isAnimated;
		}

		// Copiar EXIF
		if (parsed.exif) {
			result.exif = parsed.exif;
		}

		// Copiar XMP
		if (parsed.xmp) {
			result.xmp = parsed.xmp;
		}

		// Copiar IPTC
		if (parsed.iptc) {
			result.iptc = parsed.iptc;
		}

		// Usar la función del servidor para extraer información de generación por IA
		try {
			detailsLogger.info(
				"Intentando extraer información de generación AI mediante parsers especializados"
			);
			const aiGenerationInfo = await getAIGenerationInfo(parsed);

			if (aiGenerationInfo) {
				detailsLogger.info("Información de generación AI extraída con éxito", {
					tipo: aiGenerationInfo.type,
					modelo: aiGenerationInfo.model,
				});
				result.generation = aiGenerationInfo;
			} else {
				detailsLogger.warn(
					"No se pudo extrair información de generación AI con parsers especializados"
				);
			}
		} catch (error) {
			detailsLogger.error(
				"Error al extraer información de generación AI:",
				error instanceof Error ? error.message : String(error)
			);
		}

		// Si no hay propiedades, retornar null
		return Object.keys(result).length > 0 ? (result as FileMetadata) : null;
	} catch (error) {
		console.error("Error en parseMetadataDirectly:", error);
		return null;
	}
}

/**
 * Panel de detalles para mostrar información de imágenes seleccionadas
 */
export function DetailsPanel({ selectedItems }: DetailsPanelProps) {
	// Solo mostramos información de un ítem a la vez
	const item = selectedItems?.[0] || null;
	const [metadata, setMetadata] = useState<FileMetadata | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [activeTab, setActiveTab] = useState("info");
	const { toast } = useToast();

	// Callback para depuración - muestra información detallada en consola
	const handleDebug = () => {
		console.group("🔍 Depuración de Metadata");
		console.log("Item seleccionado:", item);
		console.log("Metadata procesada:", metadata);
		if (item?.metadata) {
			try {
				console.log("Metadata raw:", JSON.parse(item.metadata));
			} catch (_error) {
				console.log("Metadata raw (no es JSON válido):", item.metadata);
			}
		}
		console.groupEnd();

		toast({
			title: "Depuración",
			description: "Información impresa en la consola del navegador (F12)",
		});
	};

	// Determina el tipo de generador de IA a partir de los metadatos
	const getGeneratorType = React.useCallback((generation: unknown) => {
		const gen = generation as Record<string, unknown>;
		if (!gen || !gen.type) {
			return "unknown";
		}

		const type = String(gen.type).toLowerCase();

		if (
			type.includes("stable-diffusion") ||
			type === "sd" ||
			type === "a1111"
		) {
			return "Stable Diffusion";
		}
		if (type.includes("comfyui") || type === "comfy") {
			return "ComfyUI";
		}
		if (type.includes("invoke") || type === "invoke-ai") {
			return "InvokeAI";
		}
		if (type.includes("novel") || type === "novel-ai") {
			return "NovelAI";
		}
		if (type.includes("midjourney") || type === "mj") {
			return "Midjourney";
		}
		if (type.includes("dalle") || type.includes("dall-e")) {
			return "DALL-E";
		}

		return String(gen.type) || "Desconocido";
	}, []);

	// Efecto para cargar metadata cuando cambia el ítem seleccionado
	React.useEffect(() => {
		if (!item) {
			setMetadata(null);
			return;
		}

		let mounted = true;
		setIsProcessing(true);

		// Función asíncrona para cargar metadatos
		const fetchMetadata = async () => {
			try {
				detailsLogger.info(`Cargando metadata para item: ${item.id}`, {
					name: item.name,
					hasMetadata: !!item.metadata,
					metadataPreview: item.metadata
						? `${item.metadata.substring(0, 100)}...`
						: "null",
				});

				// Si ya tenemos metadata en el ítem, primero intentamos usarla directamente
				if (item.metadata) {
					try {
						// Primer intento: usar getMetadata normal
						const parsedMetadata = getMetadata(item.metadata);
						if (parsedMetadata) {
							detailsLogger.info(
								"Metadata parseada correctamente desde el item",
								{
									hasGeneration: !!parsedMetadata.generation,
									generationType: parsedMetadata.generation?.type,
								}
							);

							if (mounted) {
								setMetadata(parsedMetadata);
								setIsProcessing(false);
							}

							// Actualizamos estadísticas de vistas en segundo plano
							updateImageStats(item.id, "view").catch((err: Error) =>
								detailsLogger.error("Error actualizando estadísticas:", err)
							);
							return;
						}

						// Segundo intento: usar método alternativo de parseo con parsers especializados
						detailsLogger.info(
							"Intentando método alternativo de parseo con parsers de IA"
						);
						const alternativeMetadata = await parseMetadataDirectly(
							item.metadata
						);
						if (alternativeMetadata && mounted) {
							detailsLogger.info(
								"Metadata parseada correctamente con método alternativo",
								{
									hasGeneration: !!alternativeMetadata.generation,
									generationType: alternativeMetadata.generation?.type,
									generatorInfo: alternativeMetadata.generation
										? getGeneratorType(
												alternativeMetadata.generation as unknown
											)
										: "No detectado",
								}
							);

							setMetadata(alternativeMetadata);
							setIsProcessing(false);

							// Actualizamos estadísticas de vistas en segundo plano
							updateImageStats(item.id, "view").catch((err: Error) =>
								detailsLogger.error("Error actualizando estadísticas:", err)
							);
							return;
						}
					} catch (error) {
						detailsLogger.error("Error parseando metadata local:", error);
					}
				}

				// Añadir un timeout para la petición de metadata
				const metadataPromise = parseMetadata(item.id);
				const timeoutPromise = new Promise<null>((_, reject) => {
					setTimeout(() => {
						reject(new Error("Timeout al obtener metadata"));
					}, 10000); // 10 segundos de timeout
				});

				// Intentamos obtener metadata fresca del servidor con timeout
				const result = await Promise.race([metadataPromise, timeoutPromise]);

				if (mounted) {
					if (result) {
						detailsLogger.info("Metadata obtenida correctamente desde API", {
							hasGeneration: !!result.generation,
							generationType: result.generation?.type,
							generatorInfo: result.generation
								? getGeneratorType(result.generation as unknown)
								: "No detectado",
						});
						setMetadata(result);

						// Actualizamos estadísticas de vistas en segundo plano
						updateImageStats(item.id, "view").catch((err: Error) =>
							detailsLogger.error("Error actualizando estadísticas:", err)
						);
					} else {
						detailsLogger.warn("No se encontró metadata para el ítem");
						setMetadata(null);
					}
					setIsProcessing(false);
				}
			} catch (error) {
				if (mounted) {
					detailsLogger.error("Error cargando metadata:", error);
					setMetadata(null);
					setIsProcessing(false);
				}
			}
		};

		// Ejecutar la función asíncrona
		fetchMetadata();

		// Limpieza cuando el componente se desmonta o el ítem cambia
		return () => {
			mounted = false;
		};
	}, [item, getGeneratorType]);

	// Si no hay ítem seleccionado, mostrar mensaje
	if (!item) {
		return (
			<div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
				<FileImage className="h-12 w-12 mb-4 opacity-20" />
				<p className="text-sm">Selecciona una imagen para ver sus detalles</p>
			</div>
		);
	}

	// Determinar si hay información de generación AI
	const hasAIGeneration = metadata?.generation !== undefined;

	// Determinar si hay información de ubicación GPS
	const hasGPS = metadata?.exif?.gps !== undefined;

	return (
		<div className="flex flex-col h-full bg-background">
			{/* Cabecera con vista previa */}
			<div className="p-3 pb-0">
				<Card className="overflow-hidden">
					<div className="aspect-video bg-black">
						<ImagePreview item={item} />
					</div>
					<CardContent className="p-2 bg-muted/30">
						<h2 className="text-sm font-medium truncate">{item.name}</h2>
						<p className="text-xs text-muted-foreground truncate">
							{item.path || "Sin ruta especificada"}
						</p>
						{hasAIGeneration && metadata?.generation && (
							<div className="mt-1">
								<Badge
									variant="outline"
									className={cn(
										"text-[10px] h-5 px-2 py-0 inline-flex items-center",
										metadata.generation.type
											?.toLowerCase()
											.includes("stable") && "bg-blue-500/10 text-blue-500",
										metadata.generation.type?.toLowerCase().includes("comfy") &&
											"bg-green-500/10 text-green-500",
										metadata.generation.type
											?.toLowerCase()
											.includes("invoke") && "bg-purple-500/10 text-purple-500",
										metadata.generation.type?.toLowerCase().includes("novel") &&
											"bg-pink-500/10 text-pink-500",
										metadata.generation.type
											?.toLowerCase()
											.includes("midjourney") &&
											"bg-indigo-500/10 text-indigo-500",
										metadata.generation.type?.toLowerCase().includes("dall") &&
											"bg-orange-500/10 text-orange-500"
									)}
								>
									<Sparkles className="h-3 w-3 mr-1" />
									Generada con{" "}
									{getGeneratorType(metadata.generation as unknown)}
								</Badge>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Tabs de navegación */}
			<div className="px-3 pt-3">
				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<TabsList className="w-full grid grid-cols-4 h-9">
						<TabsTrigger value="info" className="text-xs">
							<Info className="h-3.5 w-3.5 mr-1.5" />
							Básica
						</TabsTrigger>
						<TabsTrigger
							value="ai"
							className={cn(
								"text-xs",
								!hasAIGeneration && "text-muted-foreground/70"
							)}
							disabled={!hasAIGeneration}
						>
							<Sparkles className="h-3.5 w-3.5 mr-1.5" />
							IA
						</TabsTrigger>
						<TabsTrigger value="tech" className="text-xs">
							<Settings2 className="h-3.5 w-3.5 mr-1.5" />
							Técnica
						</TabsTrigger>
						<TabsTrigger
							value="geo"
							className={cn("text-xs", !hasGPS && "text-muted-foreground/70")}
							disabled={!hasGPS}
						>
							<MapIcon className="h-3.5 w-3.5 mr-1.5" />
							Geo
						</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			{/* Botón de depuración */}
			<div className="px-3 pt-2">
				<Button
					variant="outline"
					size="sm"
					className="w-full text-xs bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-700"
					onClick={handleDebug}
				>
					<Bug className="h-4 w-4 mr-2" />
					Depurar datos en consola (F12)
				</Button>
			</div>

			{/* Contenido principal */}
			<ScrollArea className="flex-1 px-3 pt-3">
				{isProcessing ? (
					<div className="flex flex-col items-center justify-center py-8">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
						<p className="text-sm text-muted-foreground">
							Cargando información...
						</p>
					</div>
				) : (
					<div className="space-y-4 pb-4">
						{activeTab === "info" && (
							<div className="space-y-4">
								<Card>
									<CardHeader className="p-3 pb-1">
										<CardTitle className="text-sm flex items-center">
											<Info className="h-4 w-4 mr-2 text-blue-500" />
											Información Básica
										</CardTitle>
									</CardHeader>
									<CardContent className="p-3 pt-1">
										<BasicInfo item={item} metadata={metadata} />
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="p-3 pb-1">
										<CardTitle className="text-sm flex items-center">
											<Camera className="h-4 w-4 mr-2 text-purple-500" />
											Entidades Relacionadas
										</CardTitle>
									</CardHeader>
									<CardContent className="p-3 pt-1">
										<RelatedEntities />
									</CardContent>
								</Card>
							</div>
						)}

						{activeTab === "ai" && (
							<Card>
								<CardHeader className="p-3 pb-1">
									<CardTitle className="text-sm flex items-center">
										<Sparkles className="h-4 w-4 mr-2 text-amber-500" />
										Generación por IA
									</CardTitle>
								</CardHeader>
								<CardContent className="p-3 pt-1">
									{metadata ? (
										<AIGenerationInfo metadata={metadata} />
									) : (
										<div className="p-3 border border-dashed border-amber-500/50 rounded-md">
											<p className="text-xs text-muted-foreground">
												No se encontró información de generación por IA para
												esta imagen.
											</p>
										</div>
									)}
								</CardContent>
							</Card>
						)}

						{activeTab === "tech" && (
							<div className="space-y-4">
								{metadata ? (
									<>
										<Card>
											<CardHeader className="p-3 pb-1">
												<CardTitle className="text-sm flex items-center">
													<Settings2 className="h-4 w-4 mr-2 text-green-500" />
													Información Técnica
												</CardTitle>
											</CardHeader>
											<CardContent className="p-3 pt-1">
												<TechnicalInfo metadata={metadata} />
											</CardContent>
										</Card>

										{metadata.exif && (
											<Card>
												<CardHeader className="p-3 pb-1">
													<CardTitle className="text-sm flex items-center">
														<Camera className="h-4 w-4 mr-2 text-indigo-500" />
														Información EXIF
													</CardTitle>
												</CardHeader>
												<CardContent className="p-3 pt-1">
													<ExifInfo metadata={metadata} />
												</CardContent>
											</Card>
										)}

										{metadata.xmp && (
											<Card>
												<CardHeader className="p-3 pb-1">
													<CardTitle className="text-sm flex items-center">
														<FileImage className="h-4 w-4 mr-2 text-cyan-500" />
														Información XMP
													</CardTitle>
												</CardHeader>
												<CardContent className="p-3 pt-1">
													<XMPInfo metadata={metadata} />
												</CardContent>
											</Card>
										)}

										{metadata.iptc && (
											<Card>
												<CardHeader className="p-3 pb-1">
													<CardTitle className="text-sm flex items-center">
														<FileImage className="h-4 w-4 mr-2 text-rose-500" />
														Información IPTC
													</CardTitle>
												</CardHeader>
												<CardContent className="p-3 pt-1">
													<IPTCInfo metadata={metadata} />
												</CardContent>
											</Card>
										)}
									</>
								) : (
									<div className="p-4 border border-dashed border-muted-foreground/30 rounded-md">
										<p className="text-sm text-muted-foreground text-center">
											No se encontró información técnica para esta imagen.
										</p>
									</div>
								)}
							</div>
						)}

						{activeTab === "geo" && (
							<Card>
								<CardHeader className="p-3 pb-1">
									<CardTitle className="text-sm flex items-center">
										<MapIcon className="h-4 w-4 mr-2 text-teal-500" />
										Información Geográfica
									</CardTitle>
								</CardHeader>
								<CardContent className="p-3 pt-1">
									{metadata?.exif?.gps ? (
										<GPSInfo metadata={metadata} />
									) : (
										<div className="p-3 border border-dashed border-muted-foreground/30 rounded-md">
											<p className="text-xs text-muted-foreground">
												Esta imagen no contiene información de ubicación GPS.
											</p>
										</div>
									)}
								</CardContent>
							</Card>
						)}

						{!metadata && !isProcessing && activeTab !== "info" && (
							<div className="p-4 border border-dashed border-amber-500/50 rounded-md">
								<p className="text-sm text-muted-foreground text-center">
									No se encontró información de metadatos para esta imagen.
								</p>
							</div>
						)}
					</div>
				)}
			</ScrollArea>
		</div>
	);
}
