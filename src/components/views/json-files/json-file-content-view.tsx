import { ArrowLeft, Brackets, Code, Download, Edit, Share2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { ViewProps } from '../types';

interface JsonFileContentViewProps extends ViewProps {
	jsonFileId?: string;
}

export const JsonFileContentView: React.FC<JsonFileContentViewProps> = ({ className, jsonFileId }) => {
	const navigate = useNavigate();

	const handleGoBack = () => {
		navigate(-1);
	};

	// Mock data - en una implementación real vendría del store
	const jsonData = {
		id: jsonFileId || '1',
		name: 'config.json',
		size: '1.2 KB',
		created: '2024-01-15',
		modified: '2024-01-20',
		lines: 45,
		structure: {
			objects: 3,
			arrays: 2,
			properties: 12,
		},
		content: {
			name: 'Image Manager',
			version: '1.0.0',
			settings: {
				theme: 'dark',
				language: 'es',
				autoSave: true,
			},
			features: ['upload', 'organize', 'search'],
			metadata: {
				created: '2024-01-15',
				author: 'System',
			},
		},
		tags: ['configuración', 'json', 'settings'],
		path: '/config/config.json',
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
						<Brackets className="h-6 w-6 text-primary shrink-0" />
						<div className="min-w-0 flex-1">
							<h1 className="text-xl font-semibold truncate">{jsonData.name}</h1>
							<p className="text-sm text-muted-foreground truncate">{jsonData.path}</p>
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
										<CardTitle className="text-sm">Información del Archivo JSON</CardTitle>
									</CardHeader>
									<CardContent className="space-y-3">
										<div className="grid grid-cols-2 gap-2 text-sm">
											<span className="text-muted-foreground">Tamaño:</span>
											<span>{jsonData.size}</span>
											<span className="text-muted-foreground">Líneas:</span>
											<span>{jsonData.lines}</span>
											<span className="text-muted-foreground">Objetos:</span>
											<span>{jsonData.structure.objects}</span>
											<span className="text-muted-foreground">Arrays:</span>
											<span>{jsonData.structure.arrays}</span>
											<span className="text-muted-foreground">Propiedades:</span>
											<span>{jsonData.structure.properties}</span>
											<span className="text-muted-foreground">Creado:</span>
											<span>{jsonData.created}</span>
											<span className="text-muted-foreground">Modificado:</span>
											<span>{jsonData.modified}</span>
										</div>
									</CardContent>
								</Card>

								{/* Estructura */}
								<Card>
									<CardHeader>
										<CardTitle className="text-sm">Estructura</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-2 text-sm">
											<div className="flex items-center gap-2">
												<Code className="h-4 w-4" />
												<span>Root Object</span>
											</div>
											<div className="ml-6 space-y-1 text-muted-foreground">
												<div>├── name (string)</div>
												<div>├── version (string)</div>
												<div>├── settings (object)</div>
												<div>├── features (array)</div>
												<div>└── metadata (object)</div>
											</div>
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
											{jsonData.tags.map((tag) => (
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
											<Code className="h-4 w-4 mr-2" />
											Validar JSON
										</Button>
										<Button variant="outline" size="sm" className="w-full justify-start">
											<Edit className="h-4 w-4 mr-2" />
											Formatear
										</Button>
										<Button variant="outline" size="sm" className="w-full justify-start">
											<Share2 className="h-4 w-4 mr-2" />
											Exportar
										</Button>
									</CardContent>
								</Card>
							</div>
						</ScrollArea>
					</div>

					<Separator orientation="vertical" />

					{/* Editor de JSON */}
					<div className="flex-1 min-w-0">
						<Card className="h-full">
							<CardHeader>
								<CardTitle className="text-sm">Contenido JSON</CardTitle>
							</CardHeader>
							<CardContent className="h-full">
								<ScrollArea className="h-full">
									<pre className="text-sm bg-muted/20 p-4 rounded-lg overflow-auto">
										<code className="language-json">{JSON.stringify(jsonData.content, null, 2)}</code>
									</pre>
								</ScrollArea>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</motion.div>
	);
};

export default JsonFileContentView;
