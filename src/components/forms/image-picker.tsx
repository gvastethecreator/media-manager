import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ImageIcon } from 'lucide-react';

interface ImagePickerProps {
	value: string | null;
	onChange: (value: string | null) => void;
	className?: string;
}

export function ImagePicker({ value, onChange, className }: ImagePickerProps) {
	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		// TODO: Implementar lógica de carga de archivo
		// Por ahora, simularemos una URL local
		const imageUrl = URL.createObjectURL(file);
		onChange(imageUrl);
	};

	return (
		<div className={cn('space-y-4', className)}>
			{value ? (
				<div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
					<img src={value} alt="Imagen seleccionada" className="object-cover" />
					<div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
						<div className="absolute inset-0 flex items-center justify-center gap-2">
							<Button type="button" variant="secondary" size="sm" onClick={() => onChange(null)}>
								Eliminar
							</Button>
						</div>
					</div>
				</div>
			) : (
				<div className="flex flex-col items-center justify-center gap-4 p-4 border-2 border-dashed rounded-lg">
					<ImageIcon className="h-8 w-8 text-muted-foreground" />
					<div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
						<p>Arrastra una imagen o haz clic para seleccionar</p>
						<p className="text-xs">PNG, JPG o GIF hasta 10MB</p>
					</div>
					<Input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="image-upload" />
					<Button
						type="button"
						variant="secondary"
						onClick={() => {
							document.getElementById('image-upload')?.click();
						}}
					>
						Seleccionar archivo
					</Button>
				</div>
			)}
		</div>
	);
}
