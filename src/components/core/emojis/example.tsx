import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
		<div className="mx-auto max-w-4xl space-y-6 p-6">
			<div className="space-y-2 text-center">
				<h1 className="font-bold text-3xl">🎨 EmojiPicker con Frimousse</h1>
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
							<div className="font-medium text-sm">Emoji seleccionado:</div>
							<div className="text-2xl">{selectedEmojis.compact}</div>
						</div>

						<EmojiPicker
							className="w-full"
							compact={true}
							onEmojiSelect={handleEmojiChange('compact')}
							showLabel={true}
							value={selectedEmojis.compact}
						/>

						<div className="text-muted-foreground text-xs">
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
							<div className="font-medium text-sm">Emoji seleccionado:</div>
							<div className="text-2xl">{selectedEmojis.full}</div>
						</div>

						<EmojiPicker
							className="w-full"
							compact={false}
							onEmojiSelect={handleEmojiChange('full')}
							showLabel={true}
							value={selectedEmojis.full}
						/>

						<div className="text-muted-foreground text-xs">
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
							<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
								<div className="space-y-2">
									<label className="font-medium text-sm" htmlFor="album-name">
										Nombre
									</label>
									<input
										className="w-full rounded-md border px-3 py-2"
										defaultValue="Mi Álbum de Fotos"
										id="album-name"
										placeholder="Mi álbum..."
									/>
								</div>

								<div className="space-y-2">
									<div className="font-medium text-sm">Emoji</div>
									<EmojiPicker
										compact={true}
										onEmojiSelect={handleEmojiChange('form')}
										showLabel={false}
										value={selectedEmojis.form}
									/>
								</div>

								<div className="space-y-2">
									<label className="font-medium text-sm" htmlFor="album-category">
										Categoría
									</label>
									<select className="w-full rounded-md border px-3 py-2" id="album-category">
										<option>Personal</option>
										<option>Trabajo</option>
										<option>Viajes</option>
									</select>
								</div>
							</div>

							<div className="border-t pt-4">
								<h4 className="mb-2 font-medium">Vista previa:</h4>
								<div className="flex items-center gap-3 rounded-lg bg-muted p-3">
									<span className="text-2xl">{selectedEmojis.form}</span>
									<div>
										<div className="font-medium">Mi Álbum de Fotos</div>
										<div className="text-muted-foreground text-sm">Personal</div>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Información de migración */}
			<Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
						✅ Migración Exitosa
					</CardTitle>
				</CardHeader>
				<CardContent className="text-green-700 dark:text-green-300">
					<div className="grid gap-4 text-sm md:grid-cols-2">
						<div>
							<h5 className="mb-2 font-medium">Beneficios obtenidos:</h5>
							<ul className="space-y-1">
								<li>• 90% menos bundle size</li>
								<li>• Mejor rendimiento</li>
								<li>• Componentes más flexibles</li>
								<li>• Compatible con React 19</li>
							</ul>
						</div>
						<div>
							<h5 className="mb-2 font-medium">Características nuevas:</h5>
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
