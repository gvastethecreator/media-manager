import { Image, X } from 'lucide-react';
import * as React from 'react';
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
				<div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
					<img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
					{!disabled && (
						<Button variant="destructive" size="icon" className="absolute top-2 right-2" onClick={handleRemoveImage}>
							<X className="h-4 w-4" />
						</Button>
					)}
				</div>
			) : (
				<Dialog open={isOpen} onOpenChange={setIsOpen}>
					<DialogTrigger asChild>
						<Button
							variant="outline"
							className="w-full h-32 border-dashed flex flex-col gap-2 items-center justify-center"
							disabled={disabled}
						>
							<Image className="h-8 w-8 opacity-50" />
							<span className="text-sm text-muted-foreground">{placeholder}</span>
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Seleccionar Imagen</DialogTitle>
						</DialogHeader>
						<div className="grid grid-cols-3 gap-4 py-4">
							{/* Aquí irá la galería de imágenes */}
							<div className="text-center text-sm text-muted-foreground">Galería en desarrollo...</div>
						</div>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
