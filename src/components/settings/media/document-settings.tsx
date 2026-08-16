import { Edit2, FileText, Loader2, Trash } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDeleteDocument, useDocuments, useUpdateDocument } from '@/lib/api/documents';
import { toastService } from '@/lib/ui/toast';
import type { DocumentWithStats } from '@/types/entities/document';

export function DocumentSettings() {
	const { data, isLoading, error } = useDocuments();
	const updateDocument = useUpdateDocument();
	const deleteDocument = useDeleteDocument();

	const [search, setSearch] = useState('');
	const [editing, setEditing] = useState<DocumentWithStats | null>(null);
	const [nameInput, setNameInput] = useState('');

	const documents = data ?? [];
	const filtered = useMemo(
		() => documents.filter((d: DocumentWithStats) => d.name.toLowerCase().includes(search.toLowerCase())),
		[documents, search]
	);

	const handleUpdate = async () => {
		try {
			if (!editing) return;
			if (!nameInput.trim()) return;
			await updateDocument.mutateAsync({
				id: editing.id,
				data: {
					name: nameInput.trim(),
					title: nameInput.trim(),
				},
			});
			setEditing(null);
			setNameInput('');
			toastService.success('Document updated');
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Unknown error';
			toastService.error('Could not update the document', { description: msg });
		}
	};

	const handleDelete = async (id: string) => {
		try {
			await deleteDocument.mutateAsync(id);
			toastService.success('Document deleted');
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Unknown error';
			toastService.error('Could not delete the document', { description: msg });
		}
	};

	return (
		<ScrollArea className="h-[calc(100vh-8rem)] w-full">
			<Card className="rounded-dt-md border-none bg-muted/30 shadow-sm">
				<CardHeader className="p-3 pb-2">
					<CardTitle className="flex items-center gap-2 font-medium text-base text-muted-foreground">
						<FileText className="h-4 w-4" />
						<span>Documents</span>
					</CardTitle>
				</CardHeader>
				<CardContent className="p-3">
					<div className="mb-3 flex items-center gap-2">
						<Input onChange={(e) => setSearch(e.target.value)} placeholder="Search documents..." value={search} />
					</div>

					{isLoading ? (
						<div className="flex items-center gap-2 text-muted-foreground text-sm">
							<Loader2 className="h-4 w-4 animate-spin" /> Loading...
						</div>
					) : error ? (
						<div className="text-destructive text-sm">{error.message}</div>
					) : (
						<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
							{filtered.map((d: DocumentWithStats) => (
								<Card className="p-3" key={d.id}>
									<div className="flex items-start justify-between">
										<div>
											<div className="font-medium text-sm">{d.name}</div>
											<div className="text-muted-foreground text-xs">
											{d.size ? `${(d.size / 1024).toFixed(1)}KB` : 'Size unavailable'}
											</div>
										{d.pageCount && <div className="text-muted-foreground text-xs">{d.pageCount} pages</div>}
										{d.wordCount && <div className="text-muted-foreground text-xs">{d.wordCount} words</div>}
										</div>
										<div className="flex items-center gap-1">
											<Button
												className="h-8 w-8"
												onClick={() => {
													setEditing(d);
													setNameInput(d.name);
												}}
												size="icon"
											title="Edit"
												variant="ghost"
											>
												<Edit2 className="h-4 w-4" />
											</Button>
											<Button
												className="h-8 w-8 hover:text-destructive"
												onClick={() => handleDelete(d.id)}
												size="icon"
											title="Delete"
												variant="ghost"
											>
												<Trash className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</Card>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog
				onOpenChange={(o) => {
					if (!o) {
						setEditing(null);
						setNameInput('');
					}
				}}
				open={Boolean(editing)}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Edit Document</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<Input onChange={(e) => setNameInput(e.target.value)} placeholder="Name" value={nameInput} />
						<div className="flex justify-end gap-2">
							<Button
								onClick={() => {
									setEditing(null);
									setNameInput('');
								}}
								variant="outline"
							>
								Cancel
							</Button>
							<Button onClick={handleUpdate}>Save</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</ScrollArea>
	);
}
