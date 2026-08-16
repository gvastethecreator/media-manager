import { Edit2, Loader2, Music2, Trash } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAudios, useDeleteAudio, useUpdateAudio } from '@/lib/api/audio';
import { toastService } from '@/lib/ui/toast';
import type { AudioWithStats } from '@/types/entities/audio';

export function AudioSettings() {
	const { data, isLoading, error } = useAudios();
	const updateAudio = useUpdateAudio();
	const deleteAudio = useDeleteAudio();

	const [search, setSearch] = useState('');
	const [editing, setEditing] = useState<AudioWithStats | null>(null);
	const [nameInput, setNameInput] = useState('');

	const audios = data ?? [];
	const filtered = useMemo(
		() => audios.filter((a) => a.name.toLowerCase().includes(search.toLowerCase())),
		[audios, search]
	);

	const handleUpdate = async () => {
		try {
			if (!editing) return;
			if (!nameInput.trim()) return;
			await updateAudio.mutateAsync({ id: editing.id, data: { name: nameInput.trim() } });
			setEditing(null);
			setNameInput('');
			toastService.success('Audio updated');
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Unknown error';
			toastService.error('Could not update the audio file', { description: msg });
		}
	};

	const handleDelete = async (id: string) => {
		try {
			await deleteAudio.mutateAsync(id);
			toastService.success('Audio deleted');
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Unknown error';
			toastService.error('Could not delete the audio file', { description: msg });
		}
	};

	return (
		<ScrollArea className="h-[calc(100vh-8rem)] w-full">
			<Card className="rounded-dt-md border-none bg-muted/30 shadow-sm">
				<CardHeader className="p-3 pb-2">
					<CardTitle className="flex items-center gap-2 font-medium text-base text-muted-foreground">
						<Music2 className="h-4 w-4" />
						<span>Audio</span>
					</CardTitle>
				</CardHeader>
				<CardContent className="p-3">
					<div className="mb-3 flex items-center gap-2">
						<Input onChange={(e) => setSearch(e.target.value)} placeholder="Search audio files..." value={search} />
					</div>

					{isLoading ? (
						<div className="flex items-center gap-2 text-muted-foreground text-sm">
							<Loader2 className="h-4 w-4 animate-spin" /> Loading...
						</div>
					) : error ? (
						<div className="text-destructive text-sm">{error.message}</div>
					) : (
						<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
							{filtered.map((a) => (
								<Card className="p-3" key={a.id}>
									<div className="flex items-start justify-between">
										<div>
											<div className="font-medium text-sm">{a.name}</div>
											<div className="text-muted-foreground text-xs">{a.format ?? a.extension}</div>
										</div>
										<div className="flex items-center gap-1">
											<Button
												className="h-8 w-8"
												onClick={() => {
													setEditing(a);
													setNameInput(a.name);
												}}
												size="icon"
												title="Edit"
												variant="ghost"
											>
												<Edit2 className="h-4 w-4" />
											</Button>
											<Button
												className="h-8 w-8 hover:text-destructive"
												onClick={() => handleDelete(a.id)}
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
						<DialogTitle>Edit Audio</DialogTitle>
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
