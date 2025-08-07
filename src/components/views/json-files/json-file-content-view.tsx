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
						<Brackets className="h-6 w-6 shrink-0 text-primary" />
						<div className="min-w-0 flex-1">
							<h1 className="truncate font-semibold text-xl">{jsonData.name}</h1>
							<p className="truncate text-muted-foreground text-sm">{jsonData.path}</p>
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
											<Code className="mr-2 h-4 w-4" />
											Validar JSON
										</Button>
										<Button className="w-full justify-start" size="sm" variant="outline">
											<Edit className="mr-2 h-4 w-4" />
											Formatear
										</Button>
										<Button className="w-full justify-start" size="sm" variant="outline">
											<Share2 className="mr-2 h-4 w-4" />
											Exportar
										</Button>
									</CardContent>
								</Card>
							</div>
						</ScrollArea>
					</div>

					<Separator orientation="vertical" />

					{/* Editor de JSON */}
					<div className="min-w-0 flex-1">
						<Card className="h-full">
							<CardHeader>
								<CardTitle className="text-sm">Contenido JSON</CardTitle>
							</CardHeader>
							<CardContent className="h-full">
								<ScrollArea className="h-full">
									<pre className="overflow-auto rounded-lg bg-muted/20 p-4 text-sm">
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
