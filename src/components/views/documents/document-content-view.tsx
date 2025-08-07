import { ArrowLeft, Download, Edit, FileText, Share2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { ViewProps } from '../types';

interface DocumentContentViewProps extends ViewProps {
	documentId?: string;
}

export const DocumentContentView: React.FC<DocumentContentViewProps> = ({ className, documentId }) => {
	const navigate = useNavigate();

	const handleGoBack = () => {
		navigate(-1);
	};

	// Mock data - en una implementación real vendría del store
	const documentData = {
		id: documentId || '1',
		name: 'Documento de Ejemplo',
		type: 'PDF',
		size: '2.4 MB',
		created: '2024-01-15',
		modified: '2024-01-20',
		pages: 15,
		content: 'Este es el contenido del documento...',
		tags: ['importante', 'proyecto', 'documentación'],
		path: '/documentos/ejemplo.pdf',
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
						<FileText className="h-6 w-6 shrink-0 text-primary" />
						<div className="min-w-0 flex-1">
							<h1 className="truncate font-semibold text-xl">{documentData.name}</h1>
							<p className="truncate text-muted-foreground text-sm">{documentData.path}</p>
						</div>
					</div>
					<div className="flex shrink-0 items-center gap-2">
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
										<CardTitle className="text-sm">Información del Documento</CardTitle>
									</CardHeader>
									<CardContent className="space-y-3">
										<div className="grid grid-cols-2 gap-2 text-sm">
											<span className="text-muted-foreground">Tipo:</span>
											<Badge variant="secondary">{documentData.type}</Badge>
											<span className="text-muted-foreground">Tamaño:</span>
											<span>{documentData.size}</span>
											<span className="text-muted-foreground">Páginas:</span>
											<span>{documentData.pages}</span>
											<span className="text-muted-foreground">Creado:</span>
											<span>{documentData.created}</span>
											<span className="text-muted-foreground">Modificado:</span>
											<span>{documentData.modified}</span>
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
											{documentData.tags.map((tag) => (
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
											<FileText className="mr-2 h-4 w-4" />
											Ver en visor
										</Button>
										<Button className="w-full justify-start" size="sm" variant="outline">
											<Edit className="mr-2 h-4 w-4" />
											Editar texto
										</Button>
										<Button className="w-full justify-start" size="sm" variant="outline">
											<Share2 className="mr-2 h-4 w-4" />
											Crear enlace
										</Button>
									</CardContent>
								</Card>
							</div>
						</ScrollArea>
					</div>

					<Separator orientation="vertical" />

					{/* Área de vista previa del contenido */}
					<div className="min-w-0 flex-1">
						<Card className="h-full">
							<CardHeader>
								<CardTitle className="text-sm">Vista Previa del Contenido</CardTitle>
							</CardHeader>
							<CardContent className="h-full">
								<ScrollArea className="h-full">
									<div className="flex h-full items-center justify-center rounded-lg bg-muted/20 p-6">
										<div className="space-y-4 text-center">
											<FileText className="mx-auto h-16 w-16 text-muted-foreground" />
											<div>
												<h3 className="font-medium text-lg">Vista Previa No Disponible</h3>
												<p className="text-muted-foreground text-sm">
													La vista previa se implementará cuando se conecte con el backend
												</p>
											</div>
											<Button variant="outline">
												<Download className="mr-2 h-4 w-4" />
												Descargar para Ver
											</Button>
										</div>
									</div>
								</ScrollArea>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</motion.div>
	);
};

export default DocumentContentView;
