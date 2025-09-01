/**
 * @file Componente de configuración para el reindexado estructurado
 * @description Permite al usuario configurar las opciones del nuevo flujo de reindexado
 */

import { Settings, Zap, Clock, Image, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface StructuredReindexConfigProps {
    isOpen: boolean;
    onToggle: () => void;
    useStructuredFlow: boolean;
    onUseStructuredFlowChange: (value: boolean) => void;
    skipThumbnails: boolean;
    onSkipThumbnailsChange: (value: boolean) => void;
    skipMetadata: boolean;
    onSkipMetadataChange: (value: boolean) => void;
    disabled?: boolean;
}

export function StructuredReindexConfig({
    isOpen,
    onToggle,
    useStructuredFlow,
    onUseStructuredFlowChange,
    skipThumbnails,
    onSkipThumbnailsChange,
    skipMetadata,
    onSkipMetadataChange,
    disabled = false
}: StructuredReindexConfigProps) {
    if (!isOpen) {
        return (
            <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                disabled={disabled}
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
                <Settings className="mr-1 h-3 w-3" />
                Configuración avanzada
            </Button>
        );
    }

    return (
        <Card className="border-0 shadow-none bg-muted/30">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-primary" />
                        <CardTitle className="text-sm">Configuración de Reindexado</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onToggle} className="h-6 w-6 p-0">
                        ✕
                    </Button>
                </div>
                <CardDescription className="text-xs">
                    Configura el comportamiento del proceso de reindexado
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Tipo de flujo */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label htmlFor="structured-flow" className="text-sm font-medium flex items-center gap-2">
                                <Zap className="h-3.5 w-3.5 text-blue-500" />
                                Flujo Estructurado
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    NUEVO
                                </Badge>
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Proceso secuencial optimizado: análisis → existencia → eliminación → estructura → indexado → thumbnails → metadata → verificación
                            </p>
                        </div>
                        <Switch
                            id="structured-flow"
                            checked={useStructuredFlow}
                            onCheckedChange={onUseStructuredFlowChange}
                            disabled={disabled}
                        />
                    </div>

                    {useStructuredFlow && (
                        <div className="ml-6 pl-3 border-l-2 border-blue-200 dark:border-blue-800 space-y-2">
                            <div className="grid grid-cols-4 gap-2 text-xs">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                    <span>Análisis</span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                    <span>Existencia</span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                                    <span>Limpieza</span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                                    <span>Estructura</span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                                    <span>Indexado</span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                                    <span>Thumbnails</span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <div className="w-2 h-2 bg-teal-500 rounded-full" />
                                    <span>Metadata</span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <div className="w-2 h-2 bg-gray-500 rounded-full" />
                                    <span>Verificación</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {!useStructuredFlow && (
                        <div className="ml-6 pl-3 border-l-2 border-gray-200 dark:border-gray-800 space-y-1">
                            <p className="text-xs text-muted-foreground">
                                <Clock className="inline h-3 w-3 mr-1" />
                                Flujo legacy: procesa todas las operaciones por carpeta simultáneamente
                            </p>
                        </div>
                    )}
                </div>

                <Separator />

                {/* Opciones de optimización */}
                <div className="space-y-3">
                    <h4 className="text-sm font-medium">Optimizaciones</h4>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label htmlFor="skip-thumbnails" className="text-sm flex items-center gap-2">
                                    <Image className="h-3.5 w-3.5 text-orange-500" />
                                    Saltar Thumbnails
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Omite la generación de miniaturas para acelerar el proceso
                                </p>
                            </div>
                            <Switch
                                id="skip-thumbnails"
                                checked={skipThumbnails}
                                onCheckedChange={onSkipThumbnailsChange}
                                disabled={disabled}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label htmlFor="skip-metadata" className="text-sm flex items-center gap-2">
                                    <FileText className="h-3.5 w-3.5 text-teal-500" />
                                    Saltar Metadata
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Omite la extracción de metadatos para acelerar el proceso
                                </p>
                            </div>
                            <Switch
                                id="skip-metadata"
                                checked={skipMetadata}
                                onCheckedChange={onSkipMetadataChange}
                                disabled={disabled}
                            />
                        </div>
                    </div>
                </div>

                {/* Información adicional */}
                {useStructuredFlow && (
                    <>
                        <Separator />
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">Ventajas del Flujo Estructurado</h4>
                            <ul className="text-xs text-muted-foreground space-y-1 ml-3">
                                <li>• Progreso más detallado y predecible</li>
                                <li>• Mejor manejo de errores por fase</li>
                                <li>• Optimización de recursos del sistema</li>
                                <li>• Posibilidad de cancelar por fase</li>
                                <li>• Verificación de integridad al final</li>
                            </ul>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
