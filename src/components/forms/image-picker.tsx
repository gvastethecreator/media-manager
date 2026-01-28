import { ImageIcon } from 'lucide-react';
import { ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ImagePickerProps {
	value: string | null;
	onChange: (value: string | null) => void;
	className?: string;
}

export function ImagePicker({ value, onChange, className }: ImagePickerProps) {
	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}

		// TODO: Implementar lógica de carga de archivo
		// Por ahora, simularemos una URL local
		const imageUrl = URL.createObjectURL(file);
		onChange(imageUrl);
	};

	return (
		<div className={cn('space-y-4', className)}>
			{value ? (
				<div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
					<img alt="Imagen seleccionada" className="object-cover" src={value} />
					<div className="absolute inset-0 bg-muted/40 opacity-0 transition-opacity hover:opacity-100">
						<div className="absolute inset-0 flex items-center justify-center gap-2">
							<Button onClick={() => onChange(null)} size="sm" type="button" variant="secondary">
								Eliminar
							</Button>
						</div>
					</div>
				</div>
			) : (
				<div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-4">
					<ImageIcon className="h-8 w-8 text-muted-foreground" />
					<div className="flex flex-col items-center gap-1 text-muted-foreground text-sm">
						<p>Arrastra una imagen o haz clic para seleccionar</p>
						<p className="text-xs">PNG, JPG o GIF hasta 10MB</p>
					</div>
					<Input accept="image/*" className="hidden" id="image-upload" onChange={handleFileChange} type="file" />
					<Button
						onClick={() => {
							document.getElementById('image-upload')?.click();
						}}
						type="button"
						variant="secondary"
					>
						Seleccionar archivo
					</Button>
				</div>
			)}
		</div>
	);
}
