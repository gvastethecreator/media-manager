import { ArrowLeft, Box, Download, Edit, Eye, RotateCcw, Share2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import type { ViewProps } from '../types';

interface File3DContentViewProps extends ViewProps {
	file3DId?: string;
}

export const File3DContentView: React.FC<File3DContentViewProps> = ({ className, file3DId }) => {
	const navigate = useNavigate();

	const handleGoBack = () => {
		navigate(-1);
	};

	// Mock data - en una implementación real vendría del store
	const file3DData = {
		id: file3DId || '1',
		name: 'model.obj',
		format: 'OBJ',
		size: '15.3 MB',
		created: '2024-01-15',
		modified: '2024-01-20',
		vertices: 12450,
		faces: 8320,
		textures: 3,
		materials: 2,
		animations: 0,
		bounds: {
			width: 10.5,
			height: 8.2,
			depth: 6.7,
		},
		tags: ['modelo', '3d', 'objeto'],
		path: '/models/model.obj',
	};

	return (
		<motion.div
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -20 }}
			transition={{ duration: 0.3 }}
			className={className}
		>
			<div className="h-full flex flex-col">
				{/* Header con navegación */}
				<div className="flex items-center gap-4 p-4 border-b border-border bg-background/50 backdrop-blur-sm">
					<Button variant="ghost" size="icon" onClick={handleGoBack} className="shrink-0">
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<div className="flex items-center gap-3 min-w-0 flex-1">
						<Box className="h-6 w-6 text-primary shrink-0" />
						<div className="min-w-0 flex-1">
							<h1 className="text-xl font-semibold truncate">{file3DData.name}</h1>
							<p className="text-sm text-muted-foreground truncate">{file3DData.path}</p>
						</div>
					</div>
					<div className="flex items-center gap-2 shrink-0">
						<Button variant="outline" size="sm">
							<Eye className="h-4 w-4 mr-2" />
							Vista 3D
						</Button>
						<Button variant="outline" size="sm">
							<Download className="h-4 w-4 mr-2" />
							Descargar
						</Button>
						<Button variant="outline" size="sm">
							<Edit className="h-4 w-4 mr-2" />
							Editar
						</Button>
						<Button variant="outline" size="sm">
							<Share2 className="h-4 w-4 mr-2" />
							Compartir
						</Button>
						<Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Contenido principal */}
				<div className="flex-1 flex gap-4 p-4 min-h-0">
					{/* Panel de información lateral */}
					<div className="w-80 shrink-0">
						<ScrollArea className="h-full">
							<div className="space-y-4">
								{/* Información básica */}
								<Card>
									<CardHeader>
										<CardTitle className="text-sm">Información del Modelo 3D</CardTitle>
									</CardHeader>
									<CardContent className="space-y-3">
										<div className="grid grid-cols-2 gap-2 text-sm">
											<span className="text-muted-foreground">Formato:</span>
											<Badge variant="secondary">{file3DData.format}</Badge>
											<span className="text-muted-foreground">Tamaño:</span>
											<span>{file3DData.size}</span>
											<span className="text-muted-foreground">Vértices:</span>
											<span>{file3DData.vertices.toLocaleString()}</span>
											<span className="text-muted-foreground">Caras:</span>
											<span>{file3DData.faces.toLocaleString()}</span>
											<span className="text-muted-foreground">Texturas:</span>
											<span>{file3DData.textures}</span>
											<span className="text-muted-foreground">Materiales:</span>
											<span>{file3DData.materials}</span>
											<span className="text-muted-foreground">Animaciones:</span>
											<span>{file3DData.animations}</span>
											<span className="text-muted-foreground">Creado:</span>
											<span>{file3DData.created}</span>
											<span className="text-muted-foreground">Modificado:</span>
											<span>{file3DData.modified}</span>
										</div>
									</CardContent>
								</Card>

								{/* Dimensiones */}
								<Card>
									<CardHeader>
										<CardTitle className="text-sm">Dimensiones</CardTitle>
									</CardHeader>
									<CardContent className="space-y-3">
										<div className="grid grid-cols-2 gap-2 text-sm">
											<span className="text-muted-foreground">Ancho:</span>
											<span>{file3DData.bounds.width} unidades</span>
											<span className="text-muted-foreground">Alto:</span>
											<span>{file3DData.bounds.height} unidades</span>
											<span className="text-muted-foreground">Profundidad:</span>
											<span>{file3DData.bounds.depth} unidades</span>
										</div>
									</CardContent>
								</Card>

								{/* Etiquetas */}
								<Card>
									<CardHeader>
										<CardTitle className="text-sm">Etiquetas</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="flex flex-wrap gap-2">
											{file3DData.tags.map((tag) => (
												<Badge key={tag} variant="outline" className="text-xs">
													{tag}
												</Badge>
											))}
										</div>
									</CardContent>
								</Card>

								{/* Acciones rápidas */}
								<Card>
									<CardHeader>
										<CardTitle className="text-sm">Acciones Rápidas</CardTitle>
									</CardHeader>
									<CardContent className="space-y-2">
										<Button variant="outline" size="sm" className="w-full justify-start">
											<Eye className="h-4 w-4 mr-2" />
											Abrir en visor 3D
										</Button>
										<Button variant="outline" size="sm" className="w-full justify-start">
											<Edit className="h-4 w-4 mr-2" />
											Editar metadatos
										</Button>
										<Button variant="outline" size="sm" className="w-full justify-start">
											<Share2 className="h-4 w-4 mr-2" />
											Generar vista previa
										</Button>
									</CardContent>
								</Card>
							</div>
						</ScrollArea>
					</div>

					<Separator orientation="vertical" />

					{/* Visor 3D */}
					<div className="flex-1 min-w-0">
						<Card className="h-full">
							<CardHeader>
								<CardTitle className="text-sm flex items-center justify-between">
									<span>Vista Previa 3D</span>
									<div className="flex items-center gap-2">
										<Button variant="outline" size="sm">
											<RotateCcw className="h-4 w-4 mr-2" />
											Reset
										</Button>
									</div>
								</CardTitle>
							</CardHeader>
							<CardContent className="h-full flex flex-col">
								{/* Área de renderizado 3D */}
								<div className="flex-1 bg-muted/20 rounded-lg flex items-center justify-center mb-4">
									<div className="text-center space-y-4">
										<Box className="h-16 w-16 mx-auto text-muted-foreground" />
										<div>
											<h3 className="text-lg font-medium">Visor 3D No Disponible</h3>
											<p className="text-sm text-muted-foreground">
												El visor 3D se implementará cuando se conecte con el backend
											</p>
										</div>
										<div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 border">
											<div className="grid grid-cols-3 gap-4 text-sm">
												<div className="text-center">
													<div className="font-medium">{file3DData.vertices.toLocaleString()}</div>
													<div className="text-muted-foreground">Vértices</div>
												</div>
												<div className="text-center">
													<div className="font-medium">{file3DData.faces.toLocaleString()}</div>
													<div className="text-muted-foreground">Caras</div>
												</div>
												<div className="text-center">
													<div className="font-medium">{file3DData.materials}</div>
													<div className="text-muted-foreground">Materiales</div>
												</div>
											</div>
										</div>
									</div>
								</div>

								{/* Controles de vista */}
								<div className="border-t pt-4 space-y-3">
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<span className="text-sm font-medium">Rotación X</span>
											<Slider defaultValue={[0]} min={-180} max={180} step={1} />
										</div>
										<div className="space-y-2">
											<span className="text-sm font-medium">Rotación Y</span>
											<Slider defaultValue={[0]} min={-180} max={180} step={1} />
										</div>
									</div>
									<div className="space-y-2">
										<span className="text-sm font-medium">Zoom</span>
										<Slider defaultValue={[50]} min={10} max={200} step={5} />
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</motion.div>
	);
};

export default File3DContentView;
