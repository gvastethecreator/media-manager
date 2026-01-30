/**
 * @file Modal para renombrar archivos (individual y batch)
 * @module file-browser-new/components/rename-dialog
 */

import { FileIcon, FolderIcon, Info } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { generateNameFromPattern } from '../hooks/use-rename';
import type { BrowserItem } from '../types/item.types';

export interface RenameDialogProps {
	/** Si el diálogo está abierto */
	isOpen: boolean;
	/** Items a renombrar */
	items: BrowserItem[];
	/** Callback al confirmar */
	onConfirm: (newNames: Array<{ id: string; newName: string }>) => void;
	/** Callback al cancelar */
	onCancel: () => void;
	/** Si está procesando */
	isLoading?: boolean;
}

export function RenameDialog({ isOpen, items, onConfirm, onCancel, isLoading = false }: RenameDialogProps) {
	const isSingleItem = items.length === 1;
	const firstItem = items[0];

	// Modo individual
	const [singleName, setSingleName] = useState(firstItem?.name || '');
	const [singleError, setSingleError] = useState<string | null>(null);

	// Modo batch
	const [pattern, setPattern] = useState('imagen_{n:3}.jpg');
	const [startNumber, setStartNumber] = useState(1);
	const [batchError, setBatchError] = useState<string | null>(null);

	// Resetear estado al abrir
	useState(() => {
		if (isOpen) {
			setSingleName(firstItem?.name || '');
			setSingleError(null);
			setBatchError(null);
		}
	});

	// Preview de nombres en batch
	const batchPreview = useMemo(() => {
		return items.slice(0, 5).map((item, index) => ({
			original: item.name,
			newName: generateNameFromPattern(pattern, index, startNumber, item.name),
		}));
	}, [items, pattern, startNumber]);

	// Validar nombre individual
	const validateSingle = (name: string): boolean => {
		if (!name.trim()) {
			setSingleError('El nombre no puede estar vacío');
			return false;
		}
		if (name.trim() === firstItem?.name) {
			setSingleError('El nombre no ha cambiado');
			return false;
		}
		const invalidChars = /[<>:"|?*]/;
		if (invalidChars.test(name)) {
			setSingleError('El nombre contiene caracteres inválidos');
			return false;
		}
		setSingleError(null);
		return true;
	};

	// Validar patrón batch
	const validateBatch = (): boolean => {
		if (!pattern.trim()) {
			setBatchError('El patrón no puede estar vacío');
			return false;
		}
		if (!(pattern.includes('{n') || pattern.includes('{name'))) {
			setBatchError('El patrón debe incluir {n} o {name}');
			return false;
		}
		setBatchError(null);
		return true;
	};

	// Manejar confirmación individual
	const handleSingleConfirm = () => {
		if (validateSingle(singleName) && firstItem) {
			onConfirm([{ id: firstItem.id, newName: singleName.trim() }]);
		}
	};

	// Manejar confirmación batch
	const handleBatchConfirm = () => {
		if (validateBatch()) {
			const newNames = items.map((item, index) => ({
				id: item.id,
				newName: generateNameFromPattern(pattern, index, startNumber, item.name),
			}));
			onConfirm(newNames);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			if (isSingleItem) {
				handleSingleConfirm();
			}
		} else if (e.key === 'Escape') {
			onCancel();
		}
	};

	return (
		<Dialog onOpenChange={(open) => !open && onCancel()} open={isOpen}>
			<DialogContent className="sm:max-w-[500px]" onEscapeKeyDown={onCancel}>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						{isSingleItem ? (
							<>
								<FileIcon className="h-5 w-5" />
								Renombrar archivo
							</>
						) : (
							<>
								<FolderIcon className="h-5 w-5" />
								Renombrar {items.length} archivos
							</>
						)}
					</DialogTitle>
					<DialogDescription>
						{isSingleItem
							? 'Ingresa el nuevo nombre para el archivo.'
							: 'Define un patrón para renombrar todos los archivos seleccionados.'}
					</DialogDescription>
				</DialogHeader>

				{isSingleItem ? (
					// Vista para un solo archivo
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="new-name">Nuevo nombre</Label>
							<Input
								autoFocus
								className={cn(singleError && 'border-destructive')}
								disabled={isLoading}
								id="new-name"
								onChange={(e) => {
									setSingleName(e.target.value);
									setSingleError(null);
								}}
								onKeyDown={handleKeyDown}
								placeholder="Nuevo nombre..."
								value={singleName}
							/>
							{singleError && <p className="text-destructive text-sm">{singleError}</p>}
						</div>

						<div className="text-muted-foreground text-xs">
							<p>
								Nombre actual: <span className="font-medium">{firstItem?.name}</span>
							</p>
						</div>
					</div>
				) : (
					// Vista para múltiples archivos
					<Tabs className="w-full" defaultValue="pattern">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="pattern">Por patrón</TabsTrigger>
							<TabsTrigger value="list">Vista previa</TabsTrigger>
						</TabsList>

						<TabsContent className="space-y-4" value="pattern">
							<div className="grid gap-4 py-4">
								<div className="grid gap-2">
									<Label htmlFor="pattern">Patrón de nombre</Label>
									<Input
										autoFocus
										className={cn(batchError && 'border-destructive')}
										disabled={isLoading}
										id="pattern"
										onChange={(e) => {
											setPattern(e.target.value);
											setBatchError(null);
										}}
										placeholder="imagen_{n:3}.jpg"
										value={pattern}
									/>
									{batchError && <p className="text-destructive text-sm">{batchError}</p>}
								</div>

								<div className="grid gap-2">
									<Label htmlFor="start-number">Número inicial</Label>
									<Input
										disabled={isLoading}
										id="start-number"
										min={0}
										onChange={(e) => setStartNumber(Number.parseInt(e.target.value, 10) || 1)}
										type="number"
										value={startNumber}
									/>
								</div>

								<div className="rounded-lg bg-muted p-3">
									<div className="flex items-start gap-2 text-muted-foreground text-xs">
										<Info className="h-4 w-4 shrink-0" />
										<div>
											<p className="font-medium">Variables disponibles:</p>
											<ul className="mt-1 list-inside list-disc">
												<li>{'{n}'} - Número secuencial (1, 2, 3...)</li>
												<li>{'{n:3}'} - Número con ceros (001, 002...)</li>
												<li>{'{name}'} - Nombre original</li>
												<li>{'{ext}'} - Extensión original</li>
											</ul>
										</div>
									</div>
								</div>
							</div>
						</TabsContent>

						<TabsContent value="list">
							<div className="max-h-[250px] overflow-y-auto rounded-lg border">
								<div className="divide-y">
									{batchPreview.map((preview, index) => (
										<div className="flex items-center gap-3 px-4 py-2" key={index}>
											<div className="min-w-0 flex-1">
												<p className="truncate text-muted-foreground text-xs">{preview.original}</p>
												<p className="truncate font-medium text-sm">→ {preview.newName}</p>
											</div>
										</div>
									))}
									{items.length > 5 && (
										<p className="px-4 py-2 text-center text-muted-foreground text-xs">... y {items.length - 5} más</p>
									)}
								</div>
							</div>
						</TabsContent>
					</Tabs>
				)}

				<DialogFooter>
					<Button disabled={isLoading} onClick={onCancel} variant="outline">
						Cancelar
					</Button>
					<Button disabled={isLoading} onClick={isSingleItem ? handleSingleConfirm : handleBatchConfirm}>
						{isLoading ? 'Procesando...' : isSingleItem ? 'Renombrar' : <>Renombrar {items.length} archivos</>}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
