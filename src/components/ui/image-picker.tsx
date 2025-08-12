import { Image, X } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface ImagePickerProps {
	value?: string | null;
	defaultValue?: string | null;
	onChange?: (value: string | null) => void;
	className?: string;
	disabled?: boolean;
	placeholder?: string;
}

export function ImagePicker({
	value,
	defaultValue = null,
	onChange,
	className,
	disabled = false,
	placeholder = 'Seleccionar imagen',
}: ImagePickerProps) {
	const [selectedImage, setSelectedImage] = React.useState<string | null>(value || defaultValue);
	const [isOpen, setIsOpen] = React.useState(false);

	React.useEffect(() => {
		if (value !== undefined) {
			setSelectedImage(value);
		}
	}, [value]);

	const _handleImageSelect = (image: string) => {
		setSelectedImage(image);
		onChange?.(image);
		setIsOpen(false);
	};

	const handleRemoveImage = () => {
		setSelectedImage(null);
		onChange?.(null);
	};

	return (
		<div className={cn('space-y-2', className)}>
			{selectedImage ? (
				<div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
					<img alt="Selected" className="h-full w-full object-cover" src={selectedImage} />
					{!disabled && (
						<Button className="absolute top-2 right-2" onClick={handleRemoveImage} size="icon" variant="destructive">
							<X className="h-4 w-4" />
						</Button>
					)}
				</div>
			) : (
				<Dialog onOpenChange={setIsOpen} open={isOpen}>
					<DialogTrigger asChild>
						<Button
							className="flex h-32 w-full flex-col items-center justify-center gap-2 border-dashed"
							disabled={disabled}
							variant="outline"
						>
							<Image className="h-8 w-8 opacity-50" />
							<span className="text-muted-foreground text-sm">{placeholder}</span>
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Seleccionar Imagen</DialogTitle>
						</DialogHeader>
						<div className="grid grid-cols-3 gap-4 py-4">
							{/* Aquí irá la galería de imágenes */}
							<div className="text-center text-muted-foreground text-sm">Galería en desarrollo...</div>
						</div>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
