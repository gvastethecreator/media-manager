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
		<div className="flex items-center justify-between gap-3 transition-all duration-200">
			<div className="flex flex-1 flex-col gap-1.5">
				<div className="flex items-center gap-2">
					{/* Emoji editable con animaciones */}
					{isEditing ? (
						<div className="relative">
							<Button
								className={cn(
									'h-7 w-7 border-2 border-dashed text-sm transition-all duration-200',
									'hover:scale-110 hover:border-solid hover:bg-accent',
									'focus:outline-none focus:ring-2 focus:ring-primary/20'
								)}
								onClick={onToggleEmojiPicker}
								size="icon"
								variant="ghost"
							>
								{editValues.emoji || <Smile className="h-3.5 w-3.5" />}
							</Button>
							{showEmojiPicker && (
								<div className="zoom-in-95 fade-in-0 absolute top-8 left-0 z-50 animate-in duration-200">
									<EmojiPicker compact={true} onEmojiSelect={onEmojiSelect} />
								</div>
							)}
						</div>
					) : (
						<span className="text-base transition-transform duration-200 hover:scale-110">{folder.emoji || '🗂️'}</span>
					)}

					{/* Nombre de la carpeta con animación en hover */}
					<span className="font-semibold text-sm transition-colors duration-200 hover:text-primary">{folder.name}</span>

					{/* Botón de favorito en modo edición con mejores animaciones */}
					{isEditing ? (
						<Button
							className={cn(
								'h-6 w-6 transition-all duration-200',
								'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/20'
							)}
							onClick={() => onEditValuesChange({ isFavorite: !editValues.isFavorite })}
							size="icon"
							variant="ghost"
						>
							<Heart
								className={cn(
									'h-3.5 w-3.5 transition-all duration-300',
									editValues.isFavorite
										? 'scale-110 animate-pulse fill-red-500 text-red-500'
										: 'text-muted-foreground hover:text-red-400'
								)}
							/>
						</Button>
					) : null}

					{/* Indicador de favorito con animación de latido */}
					{!isEditing && folder.isFavorite && <Heart className="h-3.5 w-3.5 animate-pulse fill-red-500 text-red-500" />}

					{/* Mensaje de estado con slide-in */}
					{statusMessage && (
						<div className="slide-in-from-right-2 fade-in-0 animate-in duration-300">{statusMessage}</div>
					)}
				</div>

				{/* Descripción editable con animación suave */}
				{isEditing && (
					<div className="slide-in-from-top-2 fade-in-0 animate-in duration-300">
						<Textarea
							className={cn(
								'mt-1 h-16 resize-none text-xs transition-all duration-200',
								'focus:border-primary focus:ring-2 focus:ring-primary/20'
							)}
							maxLength={200}
							onChange={(e) => onEditValuesChange({ description: e.target.value })}
							placeholder="Descripción de la carpeta..."
							value={editValues.description}
						/>
					</div>
				)}
				{!isEditing && folder.description && (
					<div className="mt-1 text-muted-foreground text-xs italic transition-colors duration-200 hover:text-muted-foreground/80">
						{folder.description}
					</div>
				)}

				{/* Información del padre con mejor espaciado */}
				{parentFolderName && (
					<div className="mt-1 flex items-center gap-1 text-muted-foreground text-xs">
						<span className="transition-colors duration-200 hover:text-muted-foreground/80">en</span>
						<ChevronRight className="h-3 w-3 transition-transform duration-200 hover:scale-110" />
						<span className="font-medium transition-colors duration-200 hover:text-primary">{parentFolderName}</span>
					</div>
				)}
			</div>
		</div>
	);
}
