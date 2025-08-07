import { ChevronRight, Heart, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { ExtendedFolder } from './folder-types';

interface FolderHeaderProps {
	folder: ExtendedFolder;
	isEditing: boolean;
	editValues: {
		emoji: string;
		description: string;
		isFavorite: boolean;
	};
	showEmojiPicker: boolean;
	statusMessage: React.ReactNode;
	parentFolderName: string | null;
	onEditValuesChange: (values: { emoji?: string; description?: string; isFavorite?: boolean }) => void;
	onToggleEmojiPicker: () => void;
	onEmojiSelect: (emoji: string) => void;
}

export function FolderHeader({
	folder,
	isEditing,
	editValues,
	showEmojiPicker,
	statusMessage,
	parentFolderName,
	onEditValuesChange,
	onToggleEmojiPicker,
	onEmojiSelect,
}: FolderHeaderProps) {
	return (
		<div className="flex items-center justify-between">
			<div className="flex flex-1 flex-col gap-0.5">
				<div className="flex items-center gap-1">
					{/* Emoji editable */}
					{isEditing ? (
						<div className="relative">
							<Button
								className="h-6 w-6 border border-dashed text-sm"
								onClick={onToggleEmojiPicker}
								size="icon"
								variant="ghost"
							>
								{editValues.emoji || <Smile className="h-3 w-3" />}
							</Button>
							{showEmojiPicker && (
								<div className="absolute top-7 left-0 z-50">
									<EmojiPicker compact={true} onEmojiSelect={onEmojiSelect} />
								</div>
							)}
						</div>
					) : (
						<span className="text-sm">{folder.emoji || '🗂️'}</span>
					)}

					{/* Nombre de la carpeta */}
					<span className="font-medium text-sm">{folder.name}</span>

					{/* Botón de favorito en modo edición */}
					{isEditing ? (
						<Button
							className="h-5 w-5"
							onClick={() => onEditValuesChange({ isFavorite: !editValues.isFavorite })}
							size="icon"
							variant="ghost"
						>
							<Heart
								className={cn('h-3 w-3', editValues.isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground')}
							/>
						</Button>
					) : null}

					{/* Indicador de favorito */}
					{!isEditing && folder.isFavorite && <Heart className="h-3 w-3 fill-red-500 text-red-500" />}

					{/* Mensaje de estado */}
					{statusMessage}
				</div>

				{/* Descripción editable */}
				{isEditing && (
					<Textarea
						className="ml-5 h-16 resize-none text-xs"
						maxLength={200}
						onChange={(e) => onEditValuesChange({ description: e.target.value })}
						placeholder="Descripción de la carpeta..."
						value={editValues.description}
					/>
				)}
				{!isEditing && folder.description && (
					<div className="ml-5 text-muted-foreground text-xs italic">{folder.description}</div>
				)}

				{/* Información del padre */}
				{parentFolderName && (
					<div className="ml-5 flex items-center gap-1 text-muted-foreground text-xs">
						<span>en</span>
						<ChevronRight className="h-3 w-3" />
						<span className="font-medium">{parentFolderName}</span>
					</div>
				)}
			</div>
		</div>
	);
}
