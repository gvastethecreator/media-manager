import { ImageIcon } from 'lucide-react';
import { ChangeEvent, useEffect, useId, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ImagePickerProps {
	className?: string;
	onChange: (value: string | null) => void;
	value: string | null;
}

export function ImagePicker({ value, onChange, className }: ImagePickerProps) {
	const inputId = useId();
	const inputRef = useRef<HTMLInputElement>(null);
	const temporaryObjectUrlRef = useRef<string | null>(null);

	useEffect(() => {
		return () => {
			if (temporaryObjectUrlRef.current) {
				URL.revokeObjectURL(temporaryObjectUrlRef.current);
			}
		};
	}, []);

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}

		if (temporaryObjectUrlRef.current) {
			URL.revokeObjectURL(temporaryObjectUrlRef.current);
		}

		const imageUrl = URL.createObjectURL(file);
		temporaryObjectUrlRef.current = imageUrl;
		onChange(imageUrl);
	};

	const handleClear = () => {
		if (temporaryObjectUrlRef.current) {
			URL.revokeObjectURL(temporaryObjectUrlRef.current);
			temporaryObjectUrlRef.current = null;
		}
		if (inputRef.current) {
			inputRef.current.value = '';
		}
		onChange(null);
	};

	return (
		<div className={cn('space-y-4', className)}>
			{value ? (
				<div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
					<img alt="Selected media" className="h-full w-full object-cover" src={value} />
					<div className="absolute inset-0 bg-muted/40 opacity-0 transition-opacity hover:opacity-100">
						<div className="absolute inset-0 flex items-center justify-center gap-2">
							<Button onClick={handleClear} size="sm" type="button" variant="secondary">
								Remove
							</Button>
						</div>
					</div>
				</div>
			) : (
				<div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-4">
					<ImageIcon className="h-8 w-8 text-muted-foreground" />
					<div className="flex flex-col items-center gap-1 text-muted-foreground text-sm">
						<p>Drop an image here or click to select</p>
						<p className="text-xs">PNG, JPG o GIF hasta 10MB</p>
					</div>
					<Input
						accept="image/*"
						className="hidden"
						id={inputId}
						onChange={handleFileChange}
						ref={inputRef}
						type="file"
					/>
					<Button
						onClick={() => {
							inputRef.current?.click();
						}}
						type="button"
						variant="secondary"
					>
						Select file
					</Button>
				</div>
			)}
		</div>
	);
}
