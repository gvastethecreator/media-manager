/**
 * @file Componente de prueba para el nuevo sistema de archivos de carpeta
 * @module components/test/FolderFilesTest
 * @description Componente temporal para probar la funcionalidad de paginación y streaming
 */

import { useState } from 'react';
import { useFolderFilesPaginated } from '@/components/features/file-browser/hooks/use-folder-files-paginated';
import { useFolderFilesStream } from '@/components/features/file-browser/hooks/use-folder-files-stream';
import { useFolderFilesUnified } from '@/components/features/file-browser/hooks/use-folder-files-unified';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FolderFilesTestProps {
	folderId: string;
}

export function FolderFilesTest({ folderId }: FolderFilesTestProps) {
	const [includeSubfolders, setIncludeSubfolders] = useState(false);
	const [search, setSearch] = useState('');
	const [selectedFileTypes, setSelectedFileTypes] = useState<
		Array<'image' | 'video' | 'audio' | 'document' | 'json' | '3d'>
	>(['image', 'video']);

	// Hook unificado (modo automático)
	const unified = useFolderFilesUnified({
		folderId,
		includeSubfolders,
		search: search.trim() || undefined,
		fileTypes: selectedFileTypes,
	});

	// Hook de paginación (modo forzado)
	const paginated = useFolderFilesPaginated({
		folderId,
		includeSubfolders,
		search: search.trim() || undefined,
		fileTypes: selectedFileTypes,
		pageSize: 50,
	});

	// Hook de streaming (modo forzado)
	const streaming = useFolderFilesStream({
		folderId,
		includeSubfolders,
		search: search.trim() || undefined,
		fileTypes: selectedFileTypes,
		batchSize: 100,
		enabled: false, // Manual start
	});

	return (
		<div className="space-y-6 p-6">
			<Card>
				<CardHeader>
					<CardTitle>🧪 Prueba del Sistema de Archivos de Carpeta</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Controles */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="flex items-center space-x-2">
								<input
									checked={includeSubfolders}
									onChange={(e) => setIncludeSubfolders(e.target.checked)}
									type="checkbox"
								/>
								<span>Incluir subcarpetas</span>
							</label>
						</div>
						<div>
							<input
								className="w-full rounded border px-3 py-2"
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Buscar archivos..."
								type="text"
								value={search}
							/>
						</div>
					</div>

					{/* Tipos de archivo */}
					<div className="space-y-2">
						<span className="font-medium text-sm">Tipos de archivo:</span>
						<div className="flex flex-wrap gap-2">
							{(['image', 'video', 'audio', 'document', 'json', '3d'] as const).map((type) => (
								<Badge
									className="cursor-pointer"
									key={type}
									onClick={() => {
										setSelectedFileTypes((prev) =>
											prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
										);
									}}
									variant={selectedFileTypes.includes(type) ? 'default' : 'outline'}
								>
									{type}
								</Badge>
							))}
						</div>
					</div>
				</CardContent>
			</Card>

			<Tabs className="w-full" defaultValue="unified">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="unified">Modo Automático</TabsTrigger>
					<TabsTrigger value="paginated">Paginación</TabsTrigger>
					<TabsTrigger value="streaming">Streaming</TabsTrigger>
				</TabsList>

				{/* Modo Unificado (Automático) */}
				<TabsContent className="space-y-4" value="unified">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center justify-between">
								🤖 Modo Automático
								<Badge
									variant={
										unified.mode === 'determining'
											? 'secondary'
											: unified.mode === 'pagination'
												? 'default'
												: 'destructive'
									}
								>
									{unified.mode}
								</Badge>
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Estados */}
							<div className="grid grid-cols-4 gap-4 text-sm">
								<div>
									<strong>Total:</strong> {unified.totalCount.toLocaleString()}
								</div>
								<div>
									<strong>Cargados:</strong> {unified.loadedCount.toLocaleString()}
								</div>
								<div>
									<strong>Progreso:</strong> {Math.round(unified.progress)}%
								</div>
								<div>
									<strong>Tiempo:</strong> {unified.queryTime}ms
								</div>
							</div>

							{/* Barra de progreso */}
							<Progress className="w-full" value={unified.progress} />

							{/* Controles */}
							<div className="flex gap-2">
								{unified.loadMore && (
									<Button disabled={!unified.hasMore || unified.isLoading} onClick={unified.loadMore}>
										Cargar más ({unified.hasMore ? 'disponible' : 'sin más'})
									</Button>
								)}
								{unified.startStream && (
									<Button onClick={unified.startStream} variant="outline">
										Iniciar Streaming
									</Button>
								)}
								{unified.stopStream && (
									<Button onClick={unified.stopStream} variant="destructive">
										Detener Streaming
									</Button>
								)}
							</div>

							{/* Estados de carga */}
							<div className="text-muted-foreground text-sm">
								{unified.isLoading && <p>⏳ Cargando...</p>}
								{unified.isError && <p>❌ Error: {unified.error}</p>}
								{unified.isEmpty && <p>📂 Carpeta vacía</p>}
							</div>

							{/* Lista de archivos */}
							<div className="max-h-64 overflow-y-auto rounded border p-2">
								{unified.files.map((file, index) => (
									<div className="flex items-center justify-between border-b py-1 last:border-b-0" key={file.id}>
										<span className="text-sm">
											{index + 1}. {file.name}
										</span>
										<Badge className="text-xs" variant="outline">
											{file.entityType}
										</Badge>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Modo Paginación */}
				<TabsContent className="space-y-4" value="paginated">
					<Card>
						<CardHeader>
							<CardTitle>📄 Modo Paginación</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Estados */}
							<div className="grid grid-cols-4 gap-4 text-sm">
								<div>
									<strong>Total:</strong> {paginated.total.toLocaleString()}
								</div>
								<div>
									<strong>Cargados:</strong> {paginated.loadedCount.toLocaleString()}
								</div>
								<div>
									<strong>Página:</strong> {paginated.currentPage}/{paginated.totalPages}
								</div>
								<div>
									<strong>Tiempo:</strong> {paginated.queryTime || 0}ms
								</div>
							</div>

							{/* Barra de progreso */}
							<Progress className="w-full" value={(paginated.loadedCount / paginated.total) * 100} />

							{/* Controles */}
							<div className="flex gap-2">
								<Button disabled={!paginated.hasMore || paginated.isLoadingMore} onClick={paginated.loadMore}>
									{paginated.isLoadingMore ? 'Cargando...' : 'Cargar más'}
								</Button>
								<Button onClick={paginated.refetch} variant="outline">
									Refrescar
								</Button>
								<Button onClick={paginated.invalidate} variant="outline">
									Invalidar Cache
								</Button>
							</div>

							{/* Estados de carga */}
							<div className="text-muted-foreground text-sm">
								{paginated.isLoading && <p>⏳ Cargando...</p>}
								{paginated.error && <p>❌ Error: {paginated.error.message}</p>}
							</div>

							{/* Lista de archivos */}
							<div className="max-h-64 overflow-y-auto rounded border p-2">
								{paginated.files.map((file, index) => (
									<div className="flex items-center justify-between border-b py-1 last:border-b-0" key={file.id}>
										<span className="text-sm">
											{index + 1}. {file.name}
										</span>
										<Badge className="text-xs" variant="outline">
											{file.entityType}
										</Badge>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Modo Streaming */}
				<TabsContent className="space-y-4" value="streaming">
					<Card>
						<CardHeader>
							<CardTitle>🌊 Modo Streaming</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Estados */}
							<div className="grid grid-cols-4 gap-4 text-sm">
								<div>
									<strong>Estimado:</strong> {streaming.totalEstimate.toLocaleString()}
								</div>
								<div>
									<strong>Procesados:</strong> {streaming.processedCount.toLocaleString()}
								</div>
								<div>
									<strong>Lote:</strong> {streaming.currentBatch}/{streaming.totalBatches}
								</div>
								<div>
									<strong>Throughput:</strong> {Math.round(streaming.throughput)}/s
								</div>
							</div>

							{/* Barra de progreso */}
							<Progress className="w-full" value={streaming.progress} />

							{/* Controles */}
							<div className="flex gap-2">
								<Button disabled={streaming.isStreaming} onClick={streaming.startStream} variant="default">
									{streaming.isStreaming ? 'Streaming...' : 'Iniciar Stream'}
								</Button>
								<Button disabled={!streaming.isStreaming} onClick={streaming.stopStream} variant="destructive">
									Detener
								</Button>
								<Button onClick={streaming.resetStream} variant="outline">
									Reset
								</Button>
							</div>

							{/* Estados de carga */}
							<div className="text-muted-foreground text-sm">
								{streaming.isStreaming && <p>🌊 Streaming activo...</p>}
								{streaming.isComplete && <p>✅ Stream completado</p>}
								{streaming.error && <p>❌ Error: {streaming.error}</p>}
							</div>

							{/* Lista de archivos */}
							<div className="max-h-64 overflow-y-auto rounded border p-2">
								{streaming.files.map((file, index) => (
									<div className="flex items-center justify-between border-b py-1 last:border-b-0" key={file.id}>
										<span className="text-sm">
											{index + 1}. {file.name}
										</span>
										<Badge className="text-xs" variant="outline">
											{file.entityType}
										</Badge>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
