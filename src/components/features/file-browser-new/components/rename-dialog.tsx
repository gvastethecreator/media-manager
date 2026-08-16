/**
 * @file Modal para renombrar archivos (individual y batch)
 * @module file-browser-new/components/rename-dialog
 */

import { FileIcon, FolderIcon, Info } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
	/** Si está procesando */
	isLoading?: boolean;
	/** Si el diálogo está abierto */
	isOpen: boolean;
	/** Items a renombrar */
	items: BrowserItem[];
	/** Callback al cancelar */
	onCancel: () => void;
	/** Callback al confirmar */
	onConfirm: (newNames: Array<{ id: string; newName: string }>) => void;
}

export function RenameDialog({ isOpen, items, onConfirm, onCancel, isLoading = false }: RenameDialogProps) {
	const isSingleItem = items.length === 1;
	const firstItem = items[0];

	// Modo individual
	const [singleName, setSingleName] = useState(firstItem?.name || '');
	const [singleError, setSingleError] = useState<string | null>(null);

	// Modo batch
	const [pattern, setPattern] = useState('image_{n:3}.jpg');
	const [startNumber, setStartNumber] = useState(1);
	const [batchError, setBatchError] = useState<string | null>(null);

	useEffect(() => {
		if (!isOpen) return;
		setSingleName(firstItem?.name ?? '');
		setSingleError(null);
		setPattern('image_{n:3}.jpg');
		setStartNumber(1);
		setBatchError(null);
	}, [firstItem?.id, firstItem?.name, isOpen]);

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
			setSingleError('Name cannot be empty');
			return false;
		}
		if (name.trim() === firstItem?.name) {
			setSingleError('Name has not changed');
			return false;
		}
		const invalidChars = /[<>:"|?*]/;
		if (invalidChars.test(name)) {
			setSingleError('Name contains invalid characters');
			return false;
		}
		setSingleError(null);
		return true;
	};

	// Validar patrón batch
	const validateBatch = (): boolean => {
		if (!pattern.trim()) {
			setBatchError('Pattern cannot be empty');
			return false;
		}
		if (!(pattern.includes('{n') || pattern.includes('{name'))) {
			setBatchError('Pattern must include {n} or {name}');
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
								Rename file
							</>
						) : (
							<>
								<FolderIcon className="h-5 w-5" />
								Rename {items.length} files
							</>
						)}
					</DialogTitle>
					<DialogDescription>
						{isSingleItem ? 'Enter a new name for the file.' : 'Define a pattern for all selected files.'}
					</DialogDescription>
				</DialogHeader>

				{isSingleItem ? (
					// Vista para un solo archivo
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="new-name">New name</Label>
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
								placeholder="New name..."
								value={singleName}
							/>
							{singleError && <p className="text-destructive text-sm">{singleError}</p>}
						</div>

						<div className="text-muted-foreground text-xs">
							<p>
								Current name: <span className="font-medium">{firstItem?.name}</span>
							</p>
						</div>
					</div>
				) : (
					// Vista para múltiples archivos
					<Tabs className="w-full" defaultValue="pattern">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="pattern">Pattern</TabsTrigger>
							<TabsTrigger value="list">Preview</TabsTrigger>
						</TabsList>

						<TabsContent className="space-y-4" value="pattern">
							<div className="grid gap-4 py-4">
								<div className="grid gap-2">
									<Label htmlFor="pattern">Name pattern</Label>
									<Input
										autoFocus
										className={cn(batchError && 'border-destructive')}
										disabled={isLoading}
										id="pattern"
										onChange={(e) => {
											setPattern(e.target.value);
											setBatchError(null);
										}}
										placeholder="image_{n:3}.jpg"
										value={pattern}
									/>
									{batchError && <p className="text-destructive text-sm">{batchError}</p>}
								</div>

								<div className="grid gap-2">
									<Label htmlFor="start-number">Starting number</Label>
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
											<p className="font-medium">Available variables:</p>
											<ul className="mt-1 list-inside list-disc">
												<li>{'{n}'} - Sequential number (1, 2, 3...)</li>
												<li>{'{n:3}'} - Zero-padded number (001, 002...)</li>
												<li>{'{name}'} - Original name</li>
												<li>{'{ext}'} - Original extension</li>
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
										<p className="px-4 py-2 text-center text-muted-foreground text-xs">
											... and {items.length - 5} more
										</p>
									)}
								</div>
							</div>
						</TabsContent>
					</Tabs>
				)}

				<DialogFooter>
					<Button disabled={isLoading} onClick={onCancel} variant="outline">
						Cancel
					</Button>
					<Button disabled={isLoading} onClick={isSingleItem ? handleSingleConfirm : handleBatchConfirm}>
						{isLoading ? 'Processing...' : isSingleItem ? 'Rename' : <>Rename {items.length} files</>}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
