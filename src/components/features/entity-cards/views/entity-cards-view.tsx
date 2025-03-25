'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutTemplate, Settings, TextSelect } from 'lucide-react';

/**
 * 🃏 Vista de gestión de tarjetas de entidades
 *
 * Esta vista permite ver, configurar y administrar las tarjetas para las diferentes entidades
 * del sistema. Proporciona herramientas para personalizar la apariencia y comportamiento
 * de las tarjetas de imágenes, etiquetas, colecciones, etc.
 */
export function EntityCardsView() {
	return (
		<div className="h-full flex flex-col p-6 gap-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold mb-1">Gestión de Tarjetas de Entidades</h1>
					<p className="text-muted-foreground">
						Configura y personaliza la apariencia de las tarjetas para diferentes entidades
					</p>
				</div>
			</div>

			<Tabs defaultValue="presets" className="flex-grow flex flex-col">
				<TabsList className="grid grid-cols-3 w-fit mb-4">
					<TabsTrigger value="presets" className="flex items-center gap-2">
						<LayoutTemplate className="w-4 h-4" />
						<span>Preajustes</span>
					</TabsTrigger>
					<TabsTrigger value="design" className="flex items-center gap-2">
						<TextSelect className="w-4 h-4" />
						<span>Diseño</span>
					</TabsTrigger>
					<TabsTrigger value="settings" className="flex items-center gap-2">
						<Settings className="w-4 h-4" />
						<span>Configuración</span>
					</TabsTrigger>
				</TabsList>

				<TabsContent value="presets" className="flex-grow flex flex-col">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{['Básico', 'Moderno', 'Retro', 'Glitch', 'Minimalista', 'Colorido'].map((preset) => (
							<Card key={preset} className="p-4 hover:bg-accent/20 cursor-pointer transition-colors">
								<h3 className="font-medium mb-2">{preset}</h3>
								<p className="text-sm text-muted-foreground">
									Estilo {preset.toLowerCase()} para tarjetas
								</p>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="design" className="space-y-4">
					<div className="text-center my-12">
						<p className="text-muted-foreground mb-4">
							El editor de diseño de tarjetas está en desarrollo
						</p>
						<Button variant="outline">Ver vista previa</Button>
					</div>
				</TabsContent>

				<TabsContent value="settings" className="space-y-4">
					<div className="text-center my-12">
						<p className="text-muted-foreground mb-4">
							La configuración avanzada está en desarrollo
						</p>
						<Button variant="outline">Configurar opciones</Button>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
