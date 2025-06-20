'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { EmojiPicker } from './emoji-picker';

/**
 * 🧪 Ejemplo de uso del EmojiPicker migrado a Frimousse
 *
 * Este componente demuestra las diferentes formas de usar el EmojiPicker
 * después de la migración de emoji-mart a frimousse.
 */
export function EmojiPickerExample() {
	const [selectedEmojis, setSelectedEmojis] = useState({
		compact: '📦',
		full: '🎨',
		form: '💎',
	});

	const handleEmojiChange = (type: keyof typeof selectedEmojis) => (emoji: string) => {
		setSelectedEmojis((prev) => ({ ...prev, [type]: emoji }));
	};

	return (
		<div className="space-y-6 p-6 max-w-4xl mx-auto">
			<div className="text-center space-y-2">
				<h1 className="text-3xl font-bold">🎨 EmojiPicker con Frimousse</h1>
				<p className="text-muted-foreground">Ejemplos de uso después de la migración de emoji-mart</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				{/* Ejemplo 1: Modo Compacto */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">📱 Modo Compacto</CardTitle>
						<CardDescription>Ideal para formularios y espacios reducidos</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<div className="text-sm font-medium">Emoji seleccionado:</div>
							<div className="text-2xl">{selectedEmojis.compact}</div>
						</div>

						<EmojiPicker
							value={selectedEmojis.compact}
							onEmojiSelect={handleEmojiChange('compact')}
							compact={true}
							showLabel={true}
							className="w-full"
						/>

						<div className="text-xs text-muted-foreground">
							• Emojis frecuentes visibles
							<br />• Búsqueda integrada
							<br />• Optimizado para formularios
						</div>
					</CardContent>
				</Card>

				{/* Ejemplo 2: Modo Completo */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">🖥️ Modo Completo</CardTitle>
						<CardDescription>Para selección detallada con más opciones</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<div className="text-sm font-medium">Emoji seleccionado:</div>
							<div className="text-2xl">{selectedEmojis.full}</div>
						</div>

						<EmojiPicker
							value={selectedEmojis.full}
							onEmojiSelect={handleEmojiChange('full')}
							compact={false}
							showLabel={true}
							className="w-full"
						/>

						<div className="text-xs text-muted-foreground">
							• Más emojis frecuentes
							<br />• Búsqueda expandida
							<br />• Mejor para desktop
						</div>
					</CardContent>
				</Card>

				{/* Ejemplo 3: Uso en Formulario */}
				<Card className="md:col-span-2">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">📝 Integración en Formulario</CardTitle>
						<CardDescription>Ejemplo de uso real en un formulario de creación</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="space-y-2">
									<label htmlFor="album-name" className="text-sm font-medium">
										Nombre
									</label>
									<input
										id="album-name"
										className="w-full px-3 py-2 border rounded-md"
										placeholder="Mi álbum..."
										defaultValue="Mi Álbum de Fotos"
									/>
								</div>

								<div className="space-y-2">
									<div className="text-sm font-medium">Emoji</div>
									<EmojiPicker
										value={selectedEmojis.form}
										onEmojiSelect={handleEmojiChange('form')}
										compact={true}
										showLabel={false}
									/>
								</div>

								<div className="space-y-2">
									<label htmlFor="album-category" className="text-sm font-medium">
										Categoría
									</label>
									<select id="album-category" className="w-full px-3 py-2 border rounded-md">
										<option>Personal</option>
										<option>Trabajo</option>
										<option>Viajes</option>
									</select>
								</div>
							</div>

							<div className="pt-4 border-t">
								<h4 className="font-medium mb-2">Vista previa:</h4>
								<div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
									<span className="text-2xl">{selectedEmojis.form}</span>
									<div>
										<div className="font-medium">Mi Álbum de Fotos</div>
										<div className="text-sm text-muted-foreground">Personal</div>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Información de migración */}
			<Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
						✅ Migración Exitosa
					</CardTitle>
				</CardHeader>
				<CardContent className="text-green-700 dark:text-green-300">
					<div className="grid md:grid-cols-2 gap-4 text-sm">
						<div>
							<h5 className="font-medium mb-2">Beneficios obtenidos:</h5>
							<ul className="space-y-1">
								<li>• 90% menos bundle size</li>
								<li>• Mejor rendimiento</li>
								<li>• Componentes más flexibles</li>
								<li>• Compatible con React 19</li>
							</ul>
						</div>
						<div>
							<h5 className="font-medium mb-2">Características nuevas:</h5>
							<ul className="space-y-1">
								<li>• Emojis frecuentes curados</li>
								<li>• Búsqueda mejorada</li>
								<li>• Mejor accesibilidad</li>
								<li>• Datos siempre actualizados</li>
							</ul>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
