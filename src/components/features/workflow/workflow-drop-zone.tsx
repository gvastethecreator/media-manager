'use client';

import { AlertCircle, CheckCircle, Upload } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Register GSAP plugin
gsap.registerPlugin(useGSAP);

export interface WorkflowDropZoneProps {
	onFileDrop?: (files: FileList) => void;
	accept?: string;
	multiple?: boolean;
	disabled?: boolean;
	className?: string;
	children?: React.ReactNode;
}

interface DropMessage {
	text: string;
	type: 'success' | 'error';
}

export function WorkflowDropZone({
	onFileDrop,
	accept = 'image/*',
	multiple = true,
	disabled = false,
	className,
	children,
}: WorkflowDropZoneProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const cardRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [message, setMessage] = useState<DropMessage | null>(null);

	// GSAP Animations
	useGSAP(
		() => {
			if (!cardRef.current) return;

			// Initial load animation
			gsap.fromTo(
				cardRef.current,
				{ opacity: 0, scale: 0.95 },
				{ opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }
			);

			// Drag state animation
			if (isDragging && !disabled) {
				gsap.to(cardRef.current, {
					scale: 1.02,
					boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
					duration: 0.2,
					ease: 'power2.out',
				});
			} else {
				gsap.to(cardRef.current, {
					scale: 1,
					boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
					duration: 0.2,
					ease: 'power2.out',
				});
			}
		},
		{ scope: containerRef, dependencies: [isDragging, disabled] }
	);

	// Message animation
	useGSAP(
		() => {
			if (!message || !containerRef.current) return;

			const messageElement = containerRef.current.querySelector('[data-message]');
			if (messageElement) {
				gsap.fromTo(messageElement, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });

				// Auto-hide after 5 seconds
				const timer = setTimeout(() => {
					gsap.to(messageElement, {
						opacity: 0,
						y: -10,
						duration: 0.2,
						ease: 'power2.in',
						onComplete: () => setMessage(null),
					});
				}, 5000);

				return () => clearTimeout(timer);
			}
		},
		{ dependencies: [message] }
	);

	const handleDragEnter = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			if (disabled) return;
			setIsDragging(true);
		},
		[disabled]
	);

	const handleDragLeave = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			if (disabled) return;
			setIsDragging(false);
		},
		[disabled]
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);

			if (disabled || !onFileDrop) return;

			const files = e.dataTransfer.files;
			if (files.length === 0) {
				setMessage({
					text: 'No se encontraron archivos válidos',
					type: 'error',
				});
				return;
			}

			// Validate file types if accept is specified
			if (accept !== '*') {
				const validFiles = Array.from(files).filter((file) => {
					const acceptTypes = accept.split(',').map((type) => type.trim());
					return acceptTypes.some((type) => {
						if (type.includes('/')) {
							return file.type.match(type.replace('*', '.*'));
						}
						return file.name.toLowerCase().endsWith(type.toLowerCase());
					});
				});

				if (validFiles.length === 0) {
					setMessage({
						text: `Formato de archivo no válido. Se aceptan: ${accept}`,
						type: 'error',
					});
					return;
				}

				// Create new FileList with valid files
				const dataTransfer = new DataTransfer();
				validFiles.forEach((file) => dataTransfer.items.add(file));
				onFileDrop(dataTransfer.files);
			} else {
				onFileDrop(files);
			}

			setMessage({
				text: `${files.length} archivo(s) procesado(s) correctamente`,
				type: 'success',
			});
		},
		[disabled, onFileDrop, accept]
	);

	return (
		<div ref={containerRef} className={cn('space-y-4', className)}>
			<Card
				ref={cardRef}
				className={cn(
					'border-2 border-dashed transition-colors duration-200',
					isDragging && !disabled && 'border-primary bg-primary/5',
					disabled && 'cursor-not-allowed opacity-50',
					!disabled && 'hover:border-muted-foreground/50'
				)}
				onDragEnter={handleDragEnter}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
			>
				<CardContent className="flex flex-col items-center justify-center p-8 text-center">
					<Upload
						className={cn(
							'h-12 w-12 text-muted-foreground transition-colors',
							isDragging && !disabled && 'text-primary'
						)}
					/>
					<div className="mt-4 space-y-2">
						<h3 className="font-medium">{isDragging ? 'Suelta los archivos aquí' : 'Arrastra archivos aquí'}</h3>
						<p className="text-sm text-muted-foreground">
							{accept !== '*' ? `Archivos permitidos: ${accept}` : 'Cualquier tipo de archivo'}
							{multiple && ' (múltiples archivos permitidos)'}
						</p>
					</div>
					{children}
				</CardContent>
			</Card>

			{/* Message display */}
			{message && (
				<Alert data-message variant={message.type === 'error' ? 'destructive' : 'default'}>
					{message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
					<AlertDescription>{message.text}</AlertDescription>
				</Alert>
			)}
		</div>
	);
}

WorkflowDropZone.displayName = 'WorkflowDropZone';
