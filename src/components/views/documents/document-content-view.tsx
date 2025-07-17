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
						<FileText className="h-6 w-6 text-primary shrink-0" />
						<div className="min-w-0 flex-1">
							<h1 className="text-xl font-semibold truncate">{documentData.name}</h1>
							<p className="text-sm text-muted-foreground truncate">{documentData.path}</p>
						</div>
					</div>
					<div className="flex items-center gap-2 shrink-0">
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
											<FileText className="h-4 w-4 mr-2" />
											Ver en visor
										</Button>
										<Button variant="outline" size="sm" className="w-full justify-start">
											<Edit className="h-4 w-4 mr-2" />
											Editar texto
										</Button>
										<Button variant="outline" size="sm" className="w-full justify-start">
											<Share2 className="h-4 w-4 mr-2" />
											Crear enlace
										</Button>
									</CardContent>
								</Card>
							</div>
						</ScrollArea>
					</div>

					<Separator orientation="vertical" />

					{/* Área de vista previa del contenido */}
					<div className="flex-1 min-w-0">
						<Card className="h-full">
							<CardHeader>
								<CardTitle className="text-sm">Vista Previa del Contenido</CardTitle>
							</CardHeader>
							<CardContent className="h-full">
								<ScrollArea className="h-full">
									<div className="bg-muted/20 rounded-lg p-6 h-full flex items-center justify-center">
										<div className="text-center space-y-4">
											<FileText className="h-16 w-16 mx-auto text-muted-foreground" />
											<div>
												<h3 className="text-lg font-medium">Vista Previa No Disponible</h3>
												<p className="text-sm text-muted-foreground">
													La vista previa se implementará cuando se conecte con el backend
												</p>
											</div>
											<Button variant="outline">
												<Download className="h-4 w-4 mr-2" />
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
