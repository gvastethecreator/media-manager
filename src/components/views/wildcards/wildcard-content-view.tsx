import { Hash } from 'lucide-react';
import { AlertCircle, Check, Edit3, Filter, Globe, Hash, Plus, Search, Star, Trash2, X } from 'lucide-react';

import { memo } from 'react';
import { motion } from 'motion/react';

import { EmptyState } from '@/components/ui/empty-state';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';

interface WildcardContentViewProps {import { Button }
from;
('@/components/ui/button');

className?: string;
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

wildcardId?: string;
import { Input } from '@/components/ui/input';

}
import { Textarea } from '@/components/ui/textarea';

/**/ / 🎯 Mock data para wildcards - en implementación real vendría del store

 * 🎯
Vista;
de;
contenido;
de;
wildcards / patronesconst;
mockWildcards = [

 * Sistema para gestión de patrones de búsqueda y filtrado	{

 */		id: 'wc001',

export const WildcardContentView = memo(function WildcardContentView({ 		pattern: '*.jpg',

	className,		description: 'Archivos de imagen JPEG',

	wildcardId 		matchCount: 1247,

}: WildcardContentViewProps) {		isActive: true,

	// Estado de no selección		category: 'images',

	if (!wildcardId) {		priority: 1,

		return (		createdAt: '2024-01-15T10:30:00Z',

			<div className={className}>		lastUsed: '2024-01-20T14:45:00Z',

				<EmptyState	},

					description="Selecciona un wildcard desde la vista de wildcards para ver su contenido."	{

					icon={Hash}		id: 'wc002',

					title="No hay wildcard seleccionado"		pattern: 'temp_*',

				/>		description: 'Archivos temporales del sistema',

			</div>		matchCount: 89,

		);		isActive: false,

	}		category: 'system',

		priority: 3,

	// Estado de funcionalidad no implementada		createdAt: '2024-01-10T09:15:00Z',

	return (		lastUsed: '2024-01-18T16:20:00Z',

		<div className={className}>	},

			<EmptyState	{

				description="El sistema de wildcards se implementará en futuras versiones. Incluirá patrones de búsqueda, filtros avanzados y reglas de clasificación automática."		id: 'wc003',

				icon={Hash}		pattern: 'backup_*.zip',

				title="Sistema de wildcards no implementado"		description: 'Archivos de respaldo comprimidos',

			/>		matchCount: 23,

		</div>		isActive: true,

	);		category: 'backup',

});		priority: 2,

		createdAt: '2024-01-08T11:45:00Z',

WildcardContentView.displayName = 'WildcardContentView';		lastUsed: '2024-01-19T13:30:00Z',
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
			animate={{ opacity: 1, y: 0 }}
			className="h-full space-y-6 overflow-auto p-6"
			exit={{ opacity: 0, y: -20 }}
			initial={{ opacity: 0, y: 20 }}
			transition={{ duration: 0.3, ease: 'easeOut' }}
		>
			{/* 📊 Header con información del wildcard */}
			<motion.div
				animate={{ opacity: 1, x: 0 }}
				className="flex items-center justify-between"
				initial={{ opacity: 0, x: -20 }}
				transition={{ delay: 0.1 }}
			>
				<div className="flex items-center gap-4">
					<div className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 p-3 text-white">
						<Globe className="h-6 w-6" />
					</div>
					<div>
						<h1 className="font-bold text-2xl text-gray-900">{selectedWildcard.pattern}</h1>
						<p className="text-gray-600">{selectedWildcard.description}</p>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Badge className={getPriorityColor(selectedWildcard.priority)}>Prioridad {selectedWildcard.priority}</Badge>
					<Badge
						className={selectedWildcard.isActive ? 'bg-green-100 text-green-800' : ''}
						variant={selectedWildcard.isActive ? 'default' : 'secondary'}
					>
						{selectedWildcard.isActive ? 'Activo' : 'Inactivo'}
					</Badge>
					<Button onClick={() => setIsEditing(!isEditing)} size="sm" variant="outline">
						<Edit3 className="mr-2 h-4 w-4" />
						{isEditing ? 'Cancelar' : 'Editar'}
					</Button>
				</div>
			</motion.div>

			{/* 🔍 Barra de búsqueda */}
			<motion.div
				animate={{ opacity: 1, x: 0 }}
				className="flex items-center gap-4"
				initial={{ opacity: 0, x: -20 }}
				transition={{ delay: 0.2 }}
			>
				<div className="relative flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-400" />
					<Input
						className="pl-10"
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Buscar archivos coincidentes..."
						value={searchQuery}
					/>
				</div>
				<Button size="icon" variant="outline">
					<Filter className="h-4 w-4" />
				</Button>
			</motion.div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* 📋 Panel de información del wildcard */}
				<motion.div
					animate={{ opacity: 1, y: 0 }}
					className="lg:col-span-1"
					initial={{ opacity: 0, y: 20 }}
					transition={{ delay: 0.3 }}
				>
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Hash className="h-5 w-5" />
								Información del Patrón
							</CardTitle>
							<CardDescription>Detalles y configuración del wildcard</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{isEditing ? (
								<>
									{' '}
									<div className="space-y-2">
										<label className="font-medium text-sm" htmlFor="wildcard-pattern">
											Patrón
										</label>
										<Input defaultValue={selectedWildcard.pattern} id="wildcard-pattern" />
									</div>
									<div className="space-y-2">
										<label className="font-medium text-sm" htmlFor="wildcard-description">
											Descripción
										</label>
										<Textarea defaultValue={selectedWildcard.description} id="wildcard-description" />
									</div>
									<div className="space-y-2">
										<label className="font-medium text-sm" htmlFor="wildcard-category">
											Categoría
										</label>
										<Input defaultValue={selectedWildcard.category} id="wildcard-category" />
									</div>
									<div className="flex gap-2">
										<Button className="flex-1" size="sm">
											<Check className="mr-2 h-4 w-4" />
											Guardar
										</Button>
										<Button onClick={() => setIsEditing(false)} size="sm" variant="outline">
											<X className="h-4 w-4" />
										</Button>
									</div>
								</>
							) : (
								<>
									<div className="space-y-3">
										<div className="flex justify-between">
											<span className="text-gray-600 text-sm">Coincidencias:</span>
											<Badge variant="secondary">{selectedWildcard.matchCount.toLocaleString()}</Badge>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600 text-sm">Categoría:</span>
											<Badge className={getCategoryColor(selectedWildcard.category)}>{selectedWildcard.category}</Badge>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600 text-sm">Creado:</span>
											<span className="text-gray-900 text-sm">
												{new Date(selectedWildcard.createdAt).toLocaleDateString()}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600 text-sm">Último uso:</span>
											<span className="text-gray-900 text-sm">
												{new Date(selectedWildcard.lastUsed).toLocaleDateString()}
											</span>
										</div>
									</div>

									<div className="space-y-2 border-t pt-4">
										<Button
											className="w-full justify-start"
											disabled={!selectedWildcard.isActive}
											size="sm"
											variant="outline"
										>
											<Star className="mr-2 h-4 w-4" />
											Marcar como favorito
										</Button>
										<Button
											className="w-full justify-start text-red-600 hover:text-red-700"
											size="sm"
											variant="outline"
										>
											<Trash2 className="mr-2 h-4 w-4" />
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
					animate={{ opacity: 1, y: 0 }}
					className="lg:col-span-2"
					initial={{ opacity: 0, y: 20 }}
					transition={{ delay: 0.4 }}
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
										animate={{ opacity: 1, x: 0 }}
										className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50"
										initial={{ opacity: 0, x: 20 }}
										key={file.name}
										transition={{ delay: 0.5 + index * 0.1 }}
									>
										<div className="flex items-center gap-3">
											<div className="flex h-10 w-10 items-center justify-center rounded bg-blue-100">
												<span className="font-semibold text-blue-600 text-sm">
													{file.name.split('.').pop()?.toUpperCase()}
												</span>
											</div>
											<div>
												<p className="font-medium text-gray-900">{file.name}</p>
												<p className="text-gray-500 text-sm">{file.path}</p>
											</div>
										</div>
										<div className="text-right">
											<p className="font-medium text-gray-700 text-sm">{file.size}</p>
											<p className="text-gray-500 text-xs">{file.modified}</p>
										</div>
									</motion.div>
								))}

								{/* 🔗 Botón para ver más */}
								<motion.div
									animate={{ opacity: 1 }}
									className="pt-4 text-center"
									initial={{ opacity: 0 }}
									transition={{ delay: 1.0 }}
								>
									<Button variant="outline">
										<Plus className="mr-2 h-4 w-4" />
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
				<motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ delay: 0.6 }}>
					<Card className="border-amber-200 bg-amber-50">
						<CardContent className="pt-6">
							<div className="flex items-center gap-3">
								<AlertCircle className="h-5 w-5 text-amber-600" />
								<div>
									<h4 className="font-medium text-amber-900">Patrón Inactivo</h4>
									<p className="text-amber-700 text-sm">
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
