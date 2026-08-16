import { Box, Edit2, Loader2, Trash } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDeleteFile3D, useFile3Ds, useUpdateFile3D } from '@/lib/api/file3ds';
import { toastService } from '@/lib/ui/toast';
import type { File3DWithStats } from '@/types/entities/file3d';

export function File3DSettings() {
	const { data, isLoading, error } = useFile3Ds();
	const updateFile3D = useUpdateFile3D();
	const deleteFile3D = useDeleteFile3D();

	const [search, setSearch] = useState('');
	const [editing, setEditing] = useState<File3DWithStats | null>(null);
	const [nameInput, setNameInput] = useState('');

	const file3ds = data ?? [];
	const filtered = useMemo(
		() => file3ds.filter((f: File3DWithStats) => f.name.toLowerCase().includes(search.toLowerCase())),
		[file3ds, search]
	);

	const handleUpdate = async () => {
		try {
			if (!editing) return;
			if (!nameInput.trim()) return;
			await updateFile3D.mutateAsync({
				id: editing.id,
				data: {
					name: nameInput.trim(),
				},
			});
			setEditing(null);
			setNameInput('');
			toastService.success('3D file updated');
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Unknown error';
			toastService.error('Could not update the 3D file', { description: msg });
		}
	};

	const handleDelete = async (id: string) => {
		try {
			await deleteFile3D.mutateAsync(id);
			toastService.success('3D file deleted');
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Unknown error';
			toastService.error('Could not delete the 3D file', { description: msg });
		}
	};

	return (
		<ScrollArea className="h-[calc(100vh-8rem)] w-full">
			<Card className="rounded-dt-md border-none bg-muted/30 shadow-sm">
				<CardHeader className="p-3 pb-2">
					<CardTitle className="flex items-center gap-2 font-medium text-base text-muted-foreground">
						<Box className="h-4 w-4" />
						<span>3D Files</span>
					</CardTitle>
				</CardHeader>
				<CardContent className="p-3">
					<div className="mb-3 flex items-center gap-2">
						<Input onChange={(e) => setSearch(e.target.value)} placeholder="Search 3D files..." value={search} />
					</div>

					{isLoading ? (
						<div className="flex items-center gap-2 text-muted-foreground text-sm">
							<Loader2 className="h-4 w-4 animate-spin" /> Loading...
						</div>
					) : error ? (
						<div className="text-destructive text-sm">{error.message}</div>
					) : (
						<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
							{filtered.map((f: File3DWithStats) => (
								<Card className="p-3" key={f.id}>
									<div className="flex items-start justify-between">
										<div>
											<div className="font-medium text-sm">{f.name}</div>
											<div className="text-muted-foreground text-xs">
											{f.size ? `${(f.size / 1024).toFixed(1)}KB` : 'Size unavailable'}
											</div>
											{f.format && (
											<div className="text-muted-foreground text-xs">Format: {f.format.toUpperCase()}</div>
											)}
											{f.vertices && (
											<div className="text-muted-foreground text-xs">{f.vertices.toLocaleString('en-US')} vertices</div>
											)}
										{f.faces && <div className="text-muted-foreground text-xs">{f.faces.toLocaleString('en-US')} faces</div>}
										</div>
										<div className="flex items-center gap-1">
											<Button
												className="h-8 w-8"
												onClick={() => {
													setEditing(f);
													setNameInput(f.name);
												}}
												size="icon"
											title="Edit"
												variant="ghost"
											>
												<Edit2 className="h-4 w-4" />
											</Button>
											<Button
												className="h-8 w-8 hover:text-destructive"
												onClick={() => handleDelete(f.id)}
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
						<DialogTitle>Edit 3D File</DialogTitle>
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
