import { AlertCircle, Check, Edit3, Filter, Globe, Hash, Plus, Search, Star, Trash2, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// 🎯 Mock data para wildcards - en implementación real vendría del store
const mockWildcards = [
	{
		id: 'wc001',
		pattern: '*.jpg',
		description: 'Archivos de imagen JPEG',
		matchCount: 1247,
		isActive: true,
		category: 'images',
		priority: 1,
		createdAt: '2024-01-15T10:30:00Z',
		lastUsed: '2024-01-20T14:45:00Z',
	},
	{
		id: 'wc002',
		pattern: 'temp_*',
		description: 'Archivos temporales del sistema',
		matchCount: 89,
		isActive: false,
		category: 'system',
		priority: 3,
		createdAt: '2024-01-10T09:15:00Z',
		lastUsed: '2024-01-18T16:20:00Z',
	},
	{
		id: 'wc003',
		pattern: 'backup_*.zip',
		description: 'Archivos de respaldo comprimidos',
		matchCount: 23,
		isActive: true,
		category: 'backup',
		priority: 2,
		createdAt: '2024-01-08T11:45:00Z',
		lastUsed: '2024-01-19T13:30:00Z',
	},
];

/**
 * 🔍 Vista de contenido para wildcards específicos
 * Muestra detalles, configuración y archivos coincidentes de un wildcard
 */
export function WildcardContentView() {
	const [isEditing, setIsEditing] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedWildcard, _setSelectedWildcard] = useState(mockWildcards[0]);

	// 🎨 Función para obtener el color de prioridad
	const getPriorityColor = (priority: number) => {
		switch (priority) {
			case 1:
				return 'bg-red-100 text-red-800 border-red-200';
			case 2:
				return 'bg-yellow-100 text-yellow-800 border-yellow-200';
			case 3:
				return 'bg-green-100 text-green-800 border-green-200';
			default:
				return 'bg-gray-100 text-gray-800 border-gray-200';
		}
	};

	// 🎨 Función para obtener el color de categoría
	const getCategoryColor = (category: string) => {
		const colors: Record<string, string> = {
			images: 'bg-blue-100 text-blue-800 border-blue-200',
			system: 'bg-purple-100 text-purple-800 border-purple-200',
			backup: 'bg-orange-100 text-orange-800 border-orange-200',
			default: 'bg-gray-100 text-gray-800 border-gray-200',
		};
		return colors[category] || colors.default;
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			transition={{ duration: 0.3, ease: 'easeOut' }}
			className="h-full p-6 space-y-6 overflow-auto"
		>
			{/* 📊 Header con información del wildcard */}
			<motion.div
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ delay: 0.1 }}
				className="flex items-center justify-between"
			>
				<div className="flex items-center gap-4">
					<div className="p-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white">
						<Globe className="w-6 h-6" />
					</div>
					<div>
						<h1 className="text-2xl font-bold text-gray-900">{selectedWildcard.pattern}</h1>
						<p className="text-gray-600">{selectedWildcard.description}</p>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Badge className={getPriorityColor(selectedWildcard.priority)}>Prioridad {selectedWildcard.priority}</Badge>
					<Badge
						variant={selectedWildcard.isActive ? 'default' : 'secondary'}
						className={selectedWildcard.isActive ? 'bg-green-100 text-green-800' : ''}
					>
						{selectedWildcard.isActive ? 'Activo' : 'Inactivo'}
					</Badge>
					<Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
						<Edit3 className="w-4 h-4 mr-2" />
						{isEditing ? 'Cancelar' : 'Editar'}
					</Button>
				</div>
			</motion.div>

			{/* 🔍 Barra de búsqueda */}
			<motion.div
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ delay: 0.2 }}
				className="flex items-center gap-4"
			>
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
					<Input
						placeholder="Buscar archivos coincidentes..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-10"
					/>
				</div>
				<Button variant="outline" size="icon">
					<Filter className="w-4 h-4" />
				</Button>
			</motion.div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* 📋 Panel de información del wildcard */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
					className="lg:col-span-1"
				>
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Hash className="w-5 h-5" />
								Información del Patrón
							</CardTitle>
							<CardDescription>Detalles y configuración del wildcard</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{isEditing ? (
								<>
									{' '}
									<div className="space-y-2">
										<label htmlFor="wildcard-pattern" className="text-sm font-medium">
											Patrón
										</label>
										<Input id="wildcard-pattern" defaultValue={selectedWildcard.pattern} />
									</div>
									<div className="space-y-2">
										<label htmlFor="wildcard-description" className="text-sm font-medium">
											Descripción
										</label>
										<Textarea id="wildcard-description" defaultValue={selectedWildcard.description} />
									</div>
									<div className="space-y-2">
										<label htmlFor="wildcard-category" className="text-sm font-medium">
											Categoría
										</label>
										<Input id="wildcard-category" defaultValue={selectedWildcard.category} />
									</div>
									<div className="flex gap-2">
										<Button size="sm" className="flex-1">
											<Check className="w-4 h-4 mr-2" />
											Guardar
										</Button>
										<Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
											<X className="w-4 h-4" />
										</Button>
									</div>
								</>
							) : (
								<>
									<div className="space-y-3">
										<div className="flex justify-between">
											<span className="text-sm text-gray-600">Coincidencias:</span>
											<Badge variant="secondary">{selectedWildcard.matchCount.toLocaleString()}</Badge>
										</div>
										<div className="flex justify-between">
											<span className="text-sm text-gray-600">Categoría:</span>
											<Badge className={getCategoryColor(selectedWildcard.category)}>{selectedWildcard.category}</Badge>
										</div>
										<div className="flex justify-between">
											<span className="text-sm text-gray-600">Creado:</span>
											<span className="text-sm text-gray-900">
												{new Date(selectedWildcard.createdAt).toLocaleDateString()}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-sm text-gray-600">Último uso:</span>
											<span className="text-sm text-gray-900">
												{new Date(selectedWildcard.lastUsed).toLocaleDateString()}
											</span>
										</div>
									</div>

									<div className="pt-4 border-t space-y-2">
										<Button
											variant="outline"
											size="sm"
											className="w-full justify-start"
											disabled={!selectedWildcard.isActive}
										>
											<Star className="w-4 h-4 mr-2" />
											Marcar como favorito
										</Button>
										<Button
											variant="outline"
											size="sm"
											className="w-full justify-start text-red-600 hover:text-red-700"
										>
											<Trash2 className="w-4 h-4 mr-2" />
											Eliminar patrón
										</Button>
									</div>
								</>
							)}
						</CardContent>
					</Card>
				</motion.div>

				{/* 📁 Lista de archivos coincidentes */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
					className="lg:col-span-2"
				>
					<Card>
						<CardHeader>
							<CardTitle>Archivos Coincidentes</CardTitle>
							<CardDescription>Archivos que coinciden con el patrón {selectedWildcard.pattern}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{/* 📄 Mock de archivos coincidentes */}
								{[
									{ name: 'photo_001.jpg', size: '2.3 MB', modified: '2024-01-20', path: '/images/photos/' },
									{ name: 'vacation_2024.jpg', size: '1.8 MB', modified: '2024-01-19', path: '/images/personal/' },
									{ name: 'work_presentation.jpg', size: '987 KB', modified: '2024-01-18', path: '/documents/work/' },
									{ name: 'family_dinner.jpg', size: '3.1 MB', modified: '2024-01-17', path: '/images/family/' },
									{ name: 'screenshot_app.jpg', size: '654 KB', modified: '2024-01-16', path: '/temp/screenshots/' },
								].map((file, index) => (
									<motion.div
										key={file.name}
										initial={{ opacity: 0, x: 20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: 0.5 + index * 0.1 }}
										className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
									>
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center">
												<span className="text-blue-600 font-semibold text-sm">
													{file.name.split('.').pop()?.toUpperCase()}
												</span>
											</div>
											<div>
												<p className="font-medium text-gray-900">{file.name}</p>
												<p className="text-sm text-gray-500">{file.path}</p>
											</div>
										</div>
										<div className="text-right">
											<p className="text-sm font-medium text-gray-700">{file.size}</p>
											<p className="text-xs text-gray-500">{file.modified}</p>
										</div>
									</motion.div>
								))}

								{/* 🔗 Botón para ver más */}
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 1.0 }}
									className="pt-4 text-center"
								>
									<Button variant="outline">
										<Plus className="w-4 h-4 mr-2" />
										Ver más coincidencias ({selectedWildcard.matchCount - 5})
									</Button>
								</motion.div>
							</div>
						</CardContent>
					</Card>
				</motion.div>
			</div>

			{/* ⚠️ Advertencias del sistema */}
			{!selectedWildcard.isActive && (
				<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
					<Card className="border-amber-200 bg-amber-50">
						<CardContent className="pt-6">
							<div className="flex items-center gap-3">
								<AlertCircle className="w-5 h-5 text-amber-600" />
								<div>
									<h4 className="font-medium text-amber-900">Patrón Inactivo</h4>
									<p className="text-sm text-amber-700">
										Este patrón wildcard está desactivado y no se aplicará en las búsquedas.
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</motion.div>
			)}
		</motion.div>
	);
}
