"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	copyFileOrDirectory,
	createDirectory,
	deleteFileOrDirectory,
	getFileInfo,
	moveFileOrDirectory,
	readDirectory,
	renameFileOrDirectory,
} from "@/services/file";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
	Copy,
	FileIcon,
	FolderIcon,
	Info,
	Loader2,
	Move,
	Pencil,
	PlusCircle,
	RefreshCw,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function FileExample() {
	const [currentPath, setCurrentPath] = useState("/ejemplo");
	const [loading, setLoading] = useState(false);
	const [directoryContent, setDirectoryContent] = useState<any>(null);
	const [selectedFile, setSelectedFile] = useState<any>(null);
	const [fileInfo, setFileInfo] = useState<any>(null);
	const [newFolderName, setNewFolderName] = useState("");
	const [newName, setNewName] = useState("");
	const [targetPath, setTargetPath] = useState("");
	const [activeTab, setActiveTab] = useState("browse");

	// Función para cargar el contenido del directorio
	const loadDirectory = async () => {
		setLoading(true);
		try {
			const result = await readDirectory(currentPath);
			setDirectoryContent(result);
			setSelectedFile(null);
			setFileInfo(null);
			toast.success(`Directorio cargado: ${currentPath}`);
		} catch (error) {
			console.error("Error al cargar el directorio:", error);
			toast.error(`Error al cargar el directorio: ${(error as Error).message}`);
		} finally {
			setLoading(false);
		}
	};

	// Función para obtener información de un archivo
	const loadFileInfo = async (filePath: string) => {
		setLoading(true);
		try {
			const result = await getFileInfo(filePath);
			setFileInfo(result);
			setSelectedFile(filePath);
			toast.success(`Información obtenida para: ${filePath}`);
		} catch (error) {
			console.error("Error al obtener información del archivo:", error);
			toast.error(`Error al obtener información: ${(error as Error).message}`);
		} finally {
			setLoading(false);
		}
	};

	// Función para crear un directorio
	const handleCreateDirectory = async () => {
		if (!newFolderName.trim()) {
			toast.error("Debe ingresar un nombre para la carpeta");
			return;
		}

		setLoading(true);
		try {
			const newPath = `${currentPath}/${newFolderName}`;
			const result = await createDirectory(newPath);

			if (result.success) {
				toast.success(`Carpeta creada: ${newFolderName}`);
				setNewFolderName("");
				loadDirectory();
			} else {
				toast.error(`Error al crear carpeta: ${result.error}`);
			}
		} catch (error) {
			console.error("Error al crear carpeta:", error);
			toast.error(`Error al crear carpeta: ${(error as Error).message}`);
		} finally {
			setLoading(false);
		}
	};

	// Función para eliminar un archivo o directorio
	const handleDelete = async () => {
		if (!selectedFile) {
			toast.error("Debe seleccionar un archivo o carpeta");
			return;
		}

		setLoading(true);
		try {
			const result = await deleteFileOrDirectory(selectedFile);

			if (result.success) {
				toast.success(`Elemento eliminado: ${selectedFile}`);
				setSelectedFile(null);
				setFileInfo(null);
				loadDirectory();
			} else {
				toast.error(`Error al eliminar: ${result.error}`);
			}
		} catch (error) {
			console.error("Error al eliminar:", error);
			toast.error(`Error al eliminar: ${(error as Error).message}`);
		} finally {
			setLoading(false);
		}
	};

	// Función para copiar un archivo o directorio
	const handleCopy = async () => {
		if (!selectedFile || !targetPath.trim()) {
			toast.error("Debe seleccionar un archivo/carpeta y especificar un destino");
			return;
		}

		setLoading(true);
		try {
			const result = await copyFileOrDirectory(selectedFile, targetPath);

			if (result.success) {
				toast.success(`Elemento copiado a: ${targetPath}`);
				setTargetPath("");
				loadDirectory();
			} else {
				toast.error(`Error al copiar: ${result.error}`);
			}
		} catch (error) {
			console.error("Error al copiar:", error);
			toast.error(`Error al copiar: ${(error as Error).message}`);
		} finally {
			setLoading(false);
		}
	};

	// Función para mover un archivo o directorio
	const handleMove = async () => {
		if (!selectedFile || !targetPath.trim()) {
			toast.error("Debe seleccionar un archivo/carpeta y especificar un destino");
			return;
		}

		setLoading(true);
		try {
			const result = await moveFileOrDirectory(selectedFile, targetPath);

			if (result.success) {
				toast.success(`Elemento movido a: ${targetPath}`);
				setSelectedFile(null);
				setFileInfo(null);
				setTargetPath("");
				loadDirectory();
			} else {
				toast.error(`Error al mover: ${result.error}`);
			}
		} catch (error) {
			console.error("Error al mover:", error);
			toast.error(`Error al mover: ${(error as Error).message}`);
		} finally {
			setLoading(false);
		}
	};

	// Función para renombrar un archivo o directorio
	const handleRename = async () => {
		if (!selectedFile || !newName.trim()) {
			toast.error("Debe seleccionar un archivo/carpeta y especificar un nuevo nombre");
			return;
		}

		setLoading(true);
		try {
			const result = await renameFileOrDirectory(selectedFile, newName);

			if (result.success) {
				toast.success(`Elemento renombrado a: ${newName}`);
				setSelectedFile(null);
				setFileInfo(null);
				setNewName("");
				loadDirectory();
			} else {
				toast.error(`Error al renombrar: ${result.error}`);
			}
		} catch (error) {
			console.error("Error al renombrar:", error);
			toast.error(`Error al renombrar: ${(error as Error).message}`);
		} finally {
			setLoading(false);
		}
	};

	// Función para navegar a una carpeta
	const navigateToFolder = (folderPath: string) => {
		setCurrentPath(folderPath);
		setActiveTab("browse");
	};

	// Función para navegar hacia arriba
	const navigateUp = () => {
		if (currentPath === "/" || currentPath === "") return;

		const parts = currentPath.split("/");
		parts.pop();
		const parentPath = parts.join("/") || "/";
		setCurrentPath(parentPath);
	};

	return (
		<div className="container mx-auto py-6 space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Ejemplo de Servicio de Archivos</CardTitle>
					<CardDescription>
						Demostración del servicio de gestión de archivos y directorios
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-4 mb-4">
						<div className="flex-1">
							<Input
								value={currentPath}
								onChange={(e) => setCurrentPath(e.target.value)}
								placeholder="Ruta del directorio"
							/>
						</div>
						<Button
							onClick={loadDirectory}
							disabled={loading}
							variant="secondary"
						>
							{loading ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<RefreshCw className="mr-2 h-4 w-4" />
							)}
							Cargar
						</Button>
						<Button onClick={navigateUp} variant="outline">
							Subir
						</Button>
					</div>

					<Tabs value={activeTab} onValueChange={setActiveTab}>
						<TabsList className="grid w-full grid-cols-4">
							<TabsTrigger value="browse">Explorar</TabsTrigger>
							<TabsTrigger value="create">Crear</TabsTrigger>
							<TabsTrigger value="modify">Modificar</TabsTrigger>
							<TabsTrigger value="info">Información</TabsTrigger>
						</TabsList>

						<TabsContent value="browse" className="mt-4">
							{directoryContent ? (
								<>
									<div className="mb-4">
										<div className="flex justify-between mb-2">
											<Badge variant="outline" className="px-3 py-1">
												Total: {directoryContent.totalItems}
											</Badge>
											<div className="flex gap-2">
												<Badge variant="secondary" className="px-3 py-1">
													<FolderIcon className="h-4 w-4 mr-1" />
													Carpetas: {directoryContent.dirCount}
												</Badge>
												<Badge variant="secondary" className="px-3 py-1">
													<FileIcon className="h-4 w-4 mr-1" />
													Archivos: {directoryContent.fileCount}
												</Badge>
											</div>
										</div>

										<Table>
											<TableHeader>
												<TableRow>
													<TableHead className="w-10">Tipo</TableHead>
													<TableHead>Nombre</TableHead>
													<TableHead>Tamaño</TableHead>
													<TableHead>Modificado</TableHead>
													<TableHead className="text-right">Acciones</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{directoryContent.items.map((item: any, index: number) => (
													<TableRow
														key={index}
														className={
															selectedFile === item.path
																? "bg-muted/50"
																: ""
														}
													>
														<TableCell>
															{item.isDirectory ? (
																<FolderIcon className="h-4 w-4 text-blue-500" />
															) : (
																<FileIcon className="h-4 w-4 text-gray-500" />
															)}
														</TableCell>
														<TableCell
															className={
																item.isDirectory
																	? "font-medium text-blue-600 cursor-pointer hover:underline"
																	: ""
															}
															onClick={() =>
																item.isDirectory
																	? navigateToFolder(item.path)
																	: {}
															}
														>
															{item.name}
														</TableCell>
														<TableCell>
															{item.isDirectory
																? "-"
																: `${item.size} bytes`}
														</TableCell>
														<TableCell>
															{item.modifiedAt
																? format(
																	new Date(item.modifiedAt),
																	"PPP p",
																	{ locale: es }
																)
																: "-"}
														</TableCell>
														<TableCell className="text-right">
															<Button
																variant="ghost"
																size="sm"
																onClick={() => loadFileInfo(item.path)}
															>
																<Info className="h-4 w-4" />
															</Button>
														</TableCell>
													</TableRow>
												))}
												{directoryContent.items.length === 0 && (
													<TableRow>
														<TableCell
															colSpan={5}
															className="text-center py-8 text-muted-foreground"
														>
															Directorio vacío
														</TableCell>
													</TableRow>
												)}
											</TableBody>
										</Table>
									</div>
								</>
							) : (
								<div className="text-center py-8 text-muted-foreground">
									Haga clic en "Cargar" para ver el contenido del directorio
								</div>
							)}
						</TabsContent>

						<TabsContent value="create" className="mt-4">
							<Card>
								<CardHeader>
									<CardTitle>Crear nuevo directorio</CardTitle>
									<CardDescription>
										Crea un nuevo directorio en la ruta actual
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										<div>
											<p className="text-sm text-muted-foreground mb-2">
												Ruta actual: {currentPath}
											</p>
										</div>
										<div className="flex gap-4">
											<Input
												value={newFolderName}
												onChange={(e) => setNewFolderName(e.target.value)}
												placeholder="Nombre de la nueva carpeta"
												className="flex-1"
											/>
											<Button
												onClick={handleCreateDirectory}
												disabled={loading || !newFolderName.trim()}
											>
												{loading ? (
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												) : (
													<PlusCircle className="mr-2 h-4 w-4" />
												)}
												Crear carpeta
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="modify" className="mt-4">
							<div className="space-y-6">
								<Card>
									<CardHeader>
										<CardTitle>Eliminar archivo/directorio</CardTitle>
										<CardDescription>
											Elimina el archivo o directorio seleccionado
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										<div>
											<p className="text-sm text-muted-foreground mb-2">
												{selectedFile ? (
													<>Seleccionado: <span className="font-medium">{selectedFile}</span></>
												) : (
													"Ningún archivo seleccionado"
												)}
											</p>
										</div>
										<Button
											onClick={handleDelete}
											disabled={loading || !selectedFile}
											variant="destructive"
										>
											{loading ? (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											) : (
												<Trash2 className="mr-2 h-4 w-4" />
											)}
											Eliminar seleccionado
										</Button>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Copiar archivo/directorio</CardTitle>
										<CardDescription>
											Copia el archivo o directorio seleccionado a otra ubicación
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										<div>
											<p className="text-sm text-muted-foreground mb-2">
												{selectedFile ? (
													<>Origen: <span className="font-medium">{selectedFile}</span></>
												) : (
													"Ningún archivo seleccionado"
												)}
											</p>
										</div>
										<div className="flex gap-4">
											<Input
												value={targetPath}
												onChange={(e) => setTargetPath(e.target.value)}
												placeholder="Ruta de destino"
												className="flex-1"
											/>
											<Button
												onClick={handleCopy}
												disabled={loading || !selectedFile || !targetPath.trim()}
											>
												{loading ? (
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												) : (
													<Copy className="mr-2 h-4 w-4" />
												)}
												Copiar
											</Button>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Mover archivo/directorio</CardTitle>
										<CardDescription>
											Mueve el archivo o directorio seleccionado a otra ubicación
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										<div>
											<p className="text-sm text-muted-foreground mb-2">
												{selectedFile ? (
													<>Origen: <span className="font-medium">{selectedFile}</span></>
												) : (
													"Ningún archivo seleccionado"
												)}
											</p>
										</div>
										<div className="flex gap-4">
											<Input
												value={targetPath}
												onChange={(e) => setTargetPath(e.target.value)}
												placeholder="Ruta de destino"
												className="flex-1"
											/>
											<Button
												onClick={handleMove}
												disabled={loading || !selectedFile || !targetPath.trim()}
											>
												{loading ? (
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												) : (
													<Move className="mr-2 h-4 w-4" />
												)}
												Mover
											</Button>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Renombrar archivo/directorio</CardTitle>
										<CardDescription>
											Renombra el archivo o directorio seleccionado
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										<div>
											<p className="text-sm text-muted-foreground mb-2">
												{selectedFile ? (
													<>Seleccionado: <span className="font-medium">{selectedFile}</span></>
												) : (
													"Ningún archivo seleccionado"
												)}
											</p>
										</div>
										<div className="flex gap-4">
											<Input
												value={newName}
												onChange={(e) => setNewName(e.target.value)}
												placeholder="Nuevo nombre"
												className="flex-1"
											/>
											<Button
												onClick={handleRename}
												disabled={loading || !selectedFile || !newName.trim()}
											>
												{loading ? (
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												) : (
													<Pencil className="mr-2 h-4 w-4" />
												)}
												Renombrar
											</Button>
										</div>
									</CardContent>
								</Card>
							</div>
						</TabsContent>

						<TabsContent value="info" className="mt-4">
							{fileInfo ? (
								<Card>
									<CardHeader>
										<CardTitle>Información del archivo</CardTitle>
										<CardDescription>{fileInfo.path}</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<div>
												<p className="text-sm font-medium">Nombre:</p>
												<p className="text-sm text-muted-foreground">
													{fileInfo.name}
												</p>
											</div>
											<div>
												<p className="text-sm font-medium">Tipo:</p>
												<p className="text-sm text-muted-foreground">
													{fileInfo.isDirectory ? "Directorio" : "Archivo"}
												</p>
											</div>
											<div>
												<p className="text-sm font-medium">Tamaño:</p>
												<p className="text-sm text-muted-foreground">
													{fileInfo.isDirectory ? "-" : `${fileInfo.size} bytes`}
												</p>
											</div>
											<div>
												<p className="text-sm font-medium">Creado:</p>
												<p className="text-sm text-muted-foreground">
													{fileInfo.createdAt
														? format(
															new Date(fileInfo.createdAt),
															"PPP p",
															{ locale: es }
														)
														: "-"}
												</p>
											</div>
											<div>
												<p className="text-sm font-medium">Modificado:</p>
												<p className="text-sm text-muted-foreground">
													{fileInfo.modifiedAt
														? format(
															new Date(fileInfo.modifiedAt),
															"PPP p",
															{ locale: es }
														)
														: "-"}
												</p>
											</div>
											<div>
												<p className="text-sm font-medium">Accedido:</p>
												<p className="text-sm text-muted-foreground">
													{fileInfo.accessedAt
														? format(
															new Date(fileInfo.accessedAt),
															"PPP p",
															{ locale: es }
														)
														: "-"}
												</p>
											</div>
										</div>

										{fileInfo.extension && (
											<>
												<Separator />
												<div>
													<p className="text-sm font-medium">Extensión:</p>
													<Badge variant="outline" className="mt-1">
														{fileInfo.extension}
													</Badge>
												</div>
											</>
										)}

										{fileInfo.mime && (
											<div>
												<p className="text-sm font-medium">Tipo MIME:</p>
												<p className="text-sm text-muted-foreground">
													{fileInfo.mime}
												</p>
											</div>
										)}

										{fileInfo.permissions && (
											<div>
												<p className="text-sm font-medium">Permisos:</p>
												<Badge className="mt-1">
													{fileInfo.permissions}
												</Badge>
											</div>
										)}
									</CardContent>
								</Card>
							) : (
								<div className="text-center py-8 text-muted-foreground">
									Seleccione un archivo para ver su información
								</div>
							)}
						</TabsContent>
					</Tabs>
				</CardContent>
				<CardFooter className="flex justify-between">
					<p className="text-sm text-muted-foreground">
						{loading ? "Cargando..." : "Servicio de archivos listo"}
					</p>
					<div>
						{selectedFile && (
							<Badge variant="outline" className="ml-2">
								{selectedFile}
							</Badge>
						)}
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}