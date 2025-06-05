'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	Activity,
	CreditCard,
	Database,
	Folder,
	LayoutGrid,
	ListOrdered,
	LucideFilm,
	LucideGalleryHorizontal,
	LucideImage,
	LucideImagePlus,
	LucideLibrary,
	LucideMap,
	LucideTag,
	LucideUsers,
	LucideUsers2,
	LucideVideo,
	Plus,
	Server,
	Settings,
} from 'lucide-react';
import { DialogUploader } from '../dialogs/uploader/dialog-uploader';

export function DevelopmentView() {
	return (
		<div className="h-full flex-1 flex-col space-y-8 p-8 flex">
			<div className="flex items-center justify-between space-y-2">
				<div>
					<h2 className="text-2xl font-bold tracking-tight">Panel de Desarrollo</h2>
					<p className="text-muted-foreground">Componentes y características en desarrollo para pruebas</p>
				</div>
				<div className="flex items-center space-x-2">
					<DialogUploader />
					<Button variant="outline">
						<Plus className="mr-2 h-4 w-4" />
						Nuevo componente
					</Button>
					<Button>Documentación</Button>
				</div>
			</div>

			<Tabs defaultValue="dashboard" className="space-y-4 flex-1 flex flex-col">
				<TabsList>
					<TabsTrigger value="dashboard" className="flex gap-2 items-center">
						<Activity size={16} />
						<span>Dashboard</span>
					</TabsTrigger>
					<TabsTrigger value="settings" className="flex gap-2 items-center">
						<Settings size={16} />
						<span>Configuración</span>
					</TabsTrigger>
					<TabsTrigger value="server" className="flex gap-2 items-center">
						<Server size={16} />
						<span>Servidor</span>
					</TabsTrigger>
					<TabsTrigger value="database" className="flex gap-2 items-center">
						<Database size={16} />
						<span>Base de datos</span>
					</TabsTrigger>
					<TabsTrigger value="folders" className="flex gap-2 items-center">
						<Folder size={16} />
						<span>Carpetas</span>
					</TabsTrigger>
					<TabsTrigger value="tags" className="flex gap-2 items-center">
						<LucideTag className="h-4 w-4" />
						<span>Etiquetas</span>
					</TabsTrigger>
					<TabsTrigger value="groups" className="flex gap-2 items-center">
						<LucideUsers className="h-4 w-4" />
						<span>Grupos</span>
					</TabsTrigger>
					<TabsTrigger value="images" className="flex gap-2 items-center">
						<LucideImage className="h-4 w-4" />
						<span>Imágenes</span>
					</TabsTrigger>
					<TabsTrigger value="collections" className="flex gap-2 items-center">
						<LucideLibrary className="h-4 w-4" />
						<span>Colecciones</span>
					</TabsTrigger>
					<TabsTrigger value="albums" className="flex gap-2 items-center">
						<LucideFilm className="h-4 w-4" />
						<span>Álbumes</span>
					</TabsTrigger>
					<TabsTrigger value="characters" className="flex gap-2 items-center">
						<LucideUsers2 className="h-4 w-4" />
						<span>Personajes</span>
					</TabsTrigger>
					<TabsTrigger value="places" className="flex gap-2 items-center">
						<LucideMap className="h-4 w-4" />
						<span>Lugares</span>
					</TabsTrigger>
					<TabsTrigger value="videos" className="flex gap-2 items-center">
						<LucideVideo className="h-4 w-4" />
						<span>Videos</span>
					</TabsTrigger>
					<TabsTrigger value="ui-components" className="flex gap-2 items-center">
						<LayoutGrid className="h-4 w-4" />
						<span>UI Components</span>
					</TabsTrigger>
					<TabsTrigger value="image-gallery" className="flex gap-2 items-center">
						<LucideGalleryHorizontal className="h-4 w-4" />
						<span>Galería</span>
					</TabsTrigger>
					<TabsTrigger value="image-card" className="flex gap-2 items-center">
						<LucideImage className="h-4 w-4" />
						<span>Tarjetas</span>
					</TabsTrigger>
					<TabsTrigger value="simple" className="flex gap-2 items-center">
						<LucideImagePlus className="h-4 w-4" />
						<span>Simple</span>
					</TabsTrigger>
				</TabsList>

				<TabsContent value="dashboard" className="flex-1 p-0">
					<div className="p-4">
						<h3 className="text-lg font-medium">Dashboard</h3>
						<p className="text-muted-foreground">Contenido del dashboard en desarrollo</p>
					</div>
				</TabsContent>

				<TabsContent value="settings" className="flex-1 p-0">
					<div className="p-4">
						<h3 className="text-lg font-medium">Configuración</h3>
						<p className="text-muted-foreground">Configuración del sistema en desarrollo</p>
					</div>
				</TabsContent>

				<TabsContent value="server" className="flex-1 p-0">
					<div className="p-4">
						<h3 className="text-lg font-medium">Servidor</h3>
						<p className="text-muted-foreground">Información del servidor en desarrollo</p>
					</div>
				</TabsContent>

				<TabsContent value="database" className="flex-1 p-0">
					<div className="p-4">
						<h3 className="text-lg font-medium">Base de datos</h3>
						<p className="text-muted-foreground">Información de la base de datos en desarrollo</p>
					</div>
				</TabsContent>

				<TabsContent value="folders" className="flex-1 p-0">
					<div className="p-4">
						<h3 className="text-lg font-medium">Carpetas</h3>
						<p className="text-muted-foreground">Gestión de carpetas en desarrollo</p>
					</div>
				</TabsContent>

				<TabsContent value="tags" className="flex-1 p-0">
					<div className="p-4">
						<h3 className="text-lg font-medium">Etiquetas</h3>
						<p className="text-muted-foreground">Gestión de etiquetas en desarrollo</p>
					</div>
				</TabsContent>

				<TabsContent value="groups" className="flex-1 p-0">
					<div className="p-4">
						<h3 className="text-lg font-medium">Grupos</h3>
						<p className="text-muted-foreground">Gestión de grupos en desarrollo</p>
					</div>
				</TabsContent>

				<TabsContent value="images" className="flex-1 p-0">
					<div className="p-4">
						<h3 className="text-lg font-medium">Imágenes</h3>
						<p className="text-muted-foreground">Gestión de imágenes en desarrollo</p>
					</div>
				</TabsContent>

				<TabsContent value="collections" className="flex-1 p-0">
					<div className="p-4">
						<h3 className="text-lg font-medium">Colecciones</h3>
						<p className="text-muted-foreground">Gestión de colecciones en desarrollo</p>
					</div>
				</TabsContent>

				<TabsContent value="albums" className="flex-1 p-0">
					<div className="p-4">
						<h3 className="text-lg font-medium">Álbumes</h3>
						<p className="text-muted-foreground">Gestión de álbumes en desarrollo</p>
					</div>
				</TabsContent>

				<TabsContent value="characters" className="flex-1 p-0">
					<div className="p-4">
						<h3 className="text-lg font-medium">Personajes</h3>
						<p className="text-muted-foreground">Gestión de personajes en desarrollo</p>
					</div>
				</TabsContent>

				<TabsContent value="places" className="flex-1 p-0">
					<div className="p-4">
						<h3 className="text-lg font-medium">Lugares</h3>
						<p className="text-muted-foreground">Gestión de lugares en desarrollo</p>
					</div>
				</TabsContent>

				<TabsContent value="videos" className="flex-1 p-0">
					<div className="p-4">
						<h3 className="text-lg font-medium">Videos</h3>
						<p className="text-muted-foreground">Gestión de videos en desarrollo</p>
					</div>
				</TabsContent>

				<TabsContent value="ui-components" className="h-full flex-1">
					<Tabs defaultValue="cards" className="h-full flex flex-col">
						<div className="border-b">
							<TabsList>
								<TabsTrigger value="cards">
									<CreditCard className="h-4 w-4 mr-2" />
									Tarjetas
								</TabsTrigger>
								<TabsTrigger value="lists">
									<ListOrdered className="h-4 w-4 mr-2" />
									Listas
								</TabsTrigger>
							</TabsList>
						</div>
						<TabsContent value="cards" className="flex-1 overflow-y-auto">
							<div className="p-4">
								<h3 className="text-lg font-medium">Tarjetas</h3>
								<p className="text-muted-foreground">Componentes de tarjetas en desarrollo</p>
							</div>
						</TabsContent>
						<TabsContent value="lists" className="flex-1 overflow-y-auto">
							<div className="p-4">
								<h3 className="text-lg font-medium">Listas</h3>
								<p className="text-muted-foreground">Componentes de listas en desarrollo</p>
							</div>
						</TabsContent>
					</Tabs>
				</TabsContent>

				<TabsContent value="image-gallery" className="flex-1 p-0 overflow-auto">
					<div className="p-4">
						<h3 className="text-lg font-medium">Galería de imágenes</h3>
						<p className="text-muted-foreground">Componente de galería en desarrollo</p>
					</div>
				</TabsContent>

				<TabsContent value="image-card" className="flex-1 p-0 overflow-auto">
					<div className="p-4">
						<h3 className="text-lg font-medium">Tarjetas de imágenes</h3>
						<p className="text-muted-foreground">Componente de tarjetas de imágenes en desarrollo</p>
					</div>
				</TabsContent>

				<TabsContent value="simple" className="flex-1 p-0">
					<div className="p-4">
						<h3 className="text-lg font-medium">Componente simple</h3>
						<p className="text-muted-foreground">Componente simple en desarrollo</p>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
