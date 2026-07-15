import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type AuthorizedPathReference, useAuthorizedRoots } from '@/lib/api/authorized-roots';
import { clientLogger } from '@/lib/logger/client-logger';

// Logger específico para este componente
const formLogger = clientLogger.withContext('FolderForm');

interface FolderFormProps {
	isLoading: boolean;
	isProcessing: boolean;
	onAddFolder: (source: AuthorizedPathReference) => Promise<void>;
}

export function FolderForm({ onAddFolder, isProcessing, isLoading }: FolderFormProps) {
	const { data: roots = [], error: rootsError, isLoading: isLoadingRoots } = useAuthorizedRoots();
	const eligibleRoots = useMemo(
		() => roots.filter((root) => root.permissions.includes('read') && root.permissions.includes('index')),
		[roots]
	);
	const [relativePath, setRelativePath] = useState('');
	const [rootId, setRootId] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		if (!eligibleRoots.some((root) => root.id === rootId)) {
			setRootId(eligibleRoots[0]?.id ?? '');
		}
	}, [eligibleRoots, rootId]);

	const mapErrorToMessage = (err: unknown): string => {
		if (!(err instanceof Error)) {
			return 'Error al agregar carpeta';
		}
		const msg = err.message;
		if (msg.includes('Ya existe una carpeta')) {
			return msg;
		}
		if (msg.includes('409')) {
			return 'La carpeta seleccionada ya existe en el sistema';
		}
		if (msg.includes('404')) {
			return 'La ruta especificada no existe o no es accesible';
		}
		if (msg.includes('403')) {
			return 'No tienes permisos para acceder a esta carpeta';
		}
		return msg;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!rootId) {
			setErrorMessage('Selecciona un media root autorizado');
			return;
		}

		try {
			setIsSubmitting(true);
			setErrorMessage(null);
			formLogger.info('Agregando carpeta desde media root autorizado', { rootId });

			await onAddFolder({ relativePath: relativePath.trim(), rootId });
			setRelativePath('');
			formLogger.info('✅ Carpeta agregada exitosamente');
		} catch (err) {
			formLogger.error('Error al agregar carpeta autorizada', {
				message: err instanceof Error ? err.message : 'Error desconocido',
			});
			setErrorMessage(mapErrorToMessage(err));
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setRelativePath(e.target.value);
		// Limpiar error cuando el usuario modifica el input
		if (errorMessage) {
			setErrorMessage(null);
		}
	};

	return (
		<form className="space-y-3" onSubmit={handleSubmit}>
			<div className="flex flex-col gap-1.5">
				<Label className="font-semibold text-foreground text-sm opacity-90">Media root autorizado</Label>
				<Select disabled={isLoadingRoots || eligibleRoots.length === 0} onValueChange={setRootId} value={rootId}>
					<SelectTrigger aria-label="Media root autorizado" size="sm">
						<SelectValue placeholder={isLoadingRoots ? 'Cargando roots…' : 'Selecciona un root'} />
					</SelectTrigger>
					<SelectContent>
						{eligibleRoots.map((root) => (
							<SelectItem key={root.id} value={root.id}>
								{root.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="flex flex-col gap-1.5">
				<Label className="font-semibold text-foreground text-sm opacity-90" htmlFor="authorized-folder-path">
					Ruta relativa
				</Label>
				<Input
					className={`border-input/60 bg-card focus-visible:ring-primary/20 ${errorMessage ? 'border-destructive' : ''}`}
					disabled={isSubmitting || isProcessing || isLoading || !rootId}
					id="authorized-folder-path"
					onChange={handleInputChange}
					placeholder="Ej.: fotos/2026 (vacío usa el root)"
					type="text"
					value={relativePath}
				/>
				<p className="text-muted-foreground text-xs">Usa `/` y no ingreses una ruta absoluta.</p>
			</div>

			{!isLoadingRoots && eligibleRoots.length === 0 && !rootsError && (
				<div className="rounded-dt-sm border border-border bg-muted/40 p-3 text-muted-foreground text-sm">
					No hay media roots con permisos de lectura e indexación. Configura `MEDIA_MANAGER_ROOT_GRANTS` y reinicia la
					aplicación.
				</div>
			)}

			{rootsError && (
				<div className="rounded-dt-sm border border-destructive/20 bg-ui-error/10 p-3 text-destructive text-sm">
					No se pudieron cargar los media roots autorizados.
				</div>
			)}

			<Button
				className="w-full font-medium"
				disabled={isSubmitting || isProcessing || isLoading || isLoadingRoots || !rootId}
				size="sm"
				type="submit"
				variant="secondary"
			>
				{isSubmitting ? 'Agregando…' : 'Agregar carpeta'}
			</Button>

			{errorMessage && (
				<div className="mt-1 rounded-md border border-destructive/20 border-ui-error-border bg-ui-error/10 p-2">
					<div className="flex items-start gap-2">
						<div className="font-medium text-destructive text-xs">{errorMessage}</div>
					</div>
				</div>
			)}
		</form>
	);
}
