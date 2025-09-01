import { ArrowLeft, Box, Download, Edit, Eye, RotateCcw, Share2, Trash2 } from 'lucide-react';
import { motion } from '@/components/ui/motion-shim';
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
		vertices: 12_450,
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
			animate={{ opacity: 1, x: 0 }}
			className={className}
			exit={{ opacity: 0, x: -20 }}
			initial={{ opacity: 0, x: 20 }}
			transition={{ duration: 0.3 }}
		>
			<div className="flex h-full flex-col">
				{/* Header con navegación */}
				<div className="flex items-center gap-4 border-border border-b bg-background/50 p-4 backdrop-blur-sm">
					<Button className="shrink-0" onClick={handleGoBack} size="icon" variant="ghost">
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<div className="flex min-w-0 flex-1 items-center gap-3">
						<Box className="h-6 w-6 shrink-0 text-primary" />
						<div className="min-w-0 flex-1">
							<h1 className="truncate font-semibold text-xl">{file3DData.name}</h1>
							<p className="truncate text-muted-foreground text-sm">{file3DData.path}</p>
						</div>
					</div>
					<div className="flex shrink-0 items-center gap-2">
						<Button size="sm" variant="outline">
							<Eye className="mr-2 h-4 w-4" />
							Vista 3D
						</Button>
						<Button size="sm" variant="outline">
							<Download className="mr-2 h-4 w-4" />
							Descargar
						</Button>
						<Button size="sm" variant="outline">
							<Edit className="mr-2 h-4 w-4" />
							Editar
						</Button>
						<Button size="sm" variant="outline">
							<Share2 className="mr-2 h-4 w-4" />
							Compartir
						</Button>
						<Button className="text-destructive hover:text-destructive" size="sm" variant="outline">
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Contenido principal */}
				<div className="flex min-h-0 flex-1 gap-4 p-4">
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
												<Badge className="text-xs" key={tag} variant="outline">
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
										<Button className="w-full justify-start" size="sm" variant="outline">
											<Eye className="mr-2 h-4 w-4" />
											Abrir en visor 3D
										</Button>
										<Button className="w-full justify-start" size="sm" variant="outline">
											<Edit className="mr-2 h-4 w-4" />
											Editar metadatos
										</Button>
										<Button className="w-full justify-start" size="sm" variant="outline">
											<Share2 className="mr-2 h-4 w-4" />
											Generar vista previa
										</Button>
									</CardContent>
								</Card>
							</div>
						</ScrollArea>
					</div>

					<Separator orientation="vertical" />

					{/* Visor 3D */}
					<div className="min-w-0 flex-1">
						<Card className="h-full">
							<CardHeader>
								<CardTitle className="flex items-center justify-between text-sm">
									<span>Vista Previa 3D</span>
									<div className="flex items-center gap-2">
										<Button size="sm" variant="outline">
											<RotateCcw className="mr-2 h-4 w-4" />
											Reset
										</Button>
									</div>
								</CardTitle>
							</CardHeader>
							<CardContent className="flex h-full flex-col">
								{/* Área de renderizado 3D */}
								<div className="mb-4 flex flex-1 items-center justify-center rounded-lg bg-muted/20">
									<div className="space-y-4 text-center">
										<Box className="mx-auto h-16 w-16 text-muted-foreground" />
										<div>
											<h3 className="font-medium text-lg">Visor 3D No Disponible</h3>
											<p className="text-muted-foreground text-sm">
												El visor 3D se implementará cuando se conecte con el backend
											</p>
										</div>
										<div className="rounded-lg border bg-background/80 p-4 backdrop-blur-sm">
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
								<div className="space-y-3 border-t pt-4">
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<span className="font-medium text-sm">Rotación X</span>
											<Slider defaultValue={[0]} max={180} min={-180} step={1} />
										</div>
										<div className="space-y-2">
											<span className="font-medium text-sm">Rotación Y</span>
											<Slider defaultValue={[0]} max={180} min={-180} step={1} />
										</div>
									</div>
									<div className="space-y-2">
										<span className="font-medium text-sm">Zoom</span>
										<Slider defaultValue={[50]} max={200} min={10} step={5} />
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
