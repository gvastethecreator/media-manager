import { Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { WildcardCard } from "@/components/cards/wildcard-card/wildcard-card";
import { LoadingScreen } from "@/components/core/feedback/loading/loading-screen";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "@/components/ui/motion-shim";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuthorizedRoots } from "@/lib/api/authorized-roots";
import { useCreateWildcard, useWildcards } from "@/lib/api/wildcards";
import { clientEvents } from "@/lib/client/events.client";
import { clientLogger } from "@/lib/logger/client-logger";
// El store se expone desde el barrel de la entidad
import { useWildcardStore } from "@/store/entities/wildcard";
import type { ViewProps } from "../types";

const viewLogger = clientLogger.withContext("WildcardsView");

export function WildcardsView({ isVisible }: ViewProps) {
	const {
		ui: { currentWildcardId },
		setCurrentWildcard,
	} = useWildcardStore();
	const { mutateAsync: createWildcard } = useCreateWildcard();
	const { data: authorizedRoots = [] } = useAuthorizedRoots();
	const writableRoots = useMemo(
		() =>
			authorizedRoots.filter(
				(root) =>
					root.permissions.includes("read") &&
					root.permissions.includes("write") &&
					root.permissions.includes("delete") &&
					root.permissions.includes("index"),
			),
		[authorizedRoots],
	);

	const [localSearch, setLocalSearch] = useState("");
	const [showForm, setShowForm] = useState(false);
	const [newWildcardName, setNewWildcardName] = useState("");
	const [newWildcardDescription, setNewWildcardDescription] = useState("");
	const [newWildcardValues, setNewWildcardValues] = useState("");
	const [artifactRootId, setArtifactRootId] = useState("");

	useEffect(() => {
		if (!artifactRootId && writableRoots[0]) setArtifactRootId(writableRoots[0].id);
	}, [artifactRootId, writableRoots]);

	// Usar React Query hook en lugar de server action
	const {
		data: wildcardsResponse,
		isLoading,
		error,
		refetch,
	} = useWildcards({
		search: localSearch,
		sortBy: "name",
		sortOrder: "asc",
	});

	const wildcards = wildcardsResponse?.data || [];

	const handleWildcardSelect = useCallback(
		(wildcardId: string) => {
			viewLogger.info("✨ Seleccionando wildcard", { wildcardId });
			setCurrentWildcard(wildcardId);
			clientEvents.emit("wildcard:selected", { wildcardId });
		},
		[setCurrentWildcard],
	);

	const { toast } = useToast();
	const handleCreateWildcard = useCallback(async () => {
		if (newWildcardName.trim() === "") {
			toast({
				title: "❌ Error",
				description: "El nombre del wildcard no puede estar vacío.",
				variant: "destructive",
			});
			return;
		}
		const values = newWildcardValues
			.split("\n")
			.map((value) => value.trim())
			.filter(Boolean);
		if (!artifactRootId || values.length === 0) {
			toast({
				title: "Falta el archivo canónico",
				description: artifactRootId
					? "Agrega al menos un valor, uno por línea."
					: "Configura una raíz con permisos completos para crear Wildcards.",
				variant: "destructive",
			});
			return;
		}
		try {
			await createWildcard({
				description: newWildcardDescription,
				fileBacking: { body: values.join("\n"), rootId: artifactRootId },
				name: newWildcardName,
			});
			setNewWildcardName("");
			setNewWildcardDescription("");
			setNewWildcardValues("");
			setShowForm(false);
		} catch (error) {
			toast({
				title: "No se pudo crear el Wildcard",
				description: error instanceof Error ? error.message : "Error inesperado.",
				variant: "destructive",
			});
		}
	}, [artifactRootId, createWildcard, newWildcardDescription, newWildcardName, newWildcardValues, toast]);

	const handleRetry = useCallback(() => {
		viewLogger.info("🔄 Reintentando cargar wildcards");
		refetch();
	}, [refetch]);

	// Si isVisible es explícitamente false (modo tabs), no renderizar
	if (isVisible === false) {
		return null;
	}

	if (isLoading) {
		return <LoadingScreen message="Cargando wildcards..." />;
	}

	if (error) {
		return (
			<EmptyState
				actions={
					<Button onClick={handleRetry} variant="outline">
						Reintentar
					</Button>
				}
				description={error instanceof Error ? error.message : "Ha ocurrido un error inesperado"}
				icon={Sparkles}
				title="Error al cargar wildcards"
			/>
		);
	}

	return (
		<ScrollArea className="flex-1">
			<div className="p-6">
				<h2 className="mb-4 font-bold text-xl">Vista de Wildcards</h2>

				<Button className="mb-4" onClick={() => setShowForm(!showForm)}>
					{showForm ? "Cancelar" : "Crear Wildcard"}
				</Button>

				{showForm && (
					<div className="mb-6 rounded-lg border p-4 shadow-sm">
						<h3 className="mb-3 font-semibold text-lg">Nuevo Wildcard</h3>
						<div className="mb-3 grid gap-2">
							<Label htmlFor="wildcardName">Nombre</Label>
							<Input
								id="wildcardName"
								onChange={(e) => setNewWildcardName(e.target.value)}
								placeholder="Nombre del wildcard"
								value={newWildcardName}
							/>
						</div>
						<div className="mb-4 grid gap-2">
							<Label htmlFor="wildcardDescription">Descripción</Label>
							<Textarea
								id="wildcardDescription"
								onChange={(e) => setNewWildcardDescription(e.target.value)}
								placeholder="Descripción del wildcard (opcional)"
								value={newWildcardDescription}
							/>
						</div>
						<div className="mb-4 grid gap-2">
							<Label htmlFor="wildcardValues">Valores</Label>
							<Textarea
								id="wildcardValues"
								onChange={(event) => setNewWildcardValues(event.target.value)}
								placeholder={"Un valor por línea\nrojo\nverde\nazul"}
								value={newWildcardValues}
							/>
						</div>
						<div className="mb-4 grid gap-2">
							<Label>Biblioteca canónica</Label>
							<Select onValueChange={setArtifactRootId} value={artifactRootId || undefined}>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona una raíz" />
								</SelectTrigger>
								<SelectContent>
									{writableRoots.map((root) => (
										<SelectItem key={root.id} value={root.id}>
											{root.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<Button onClick={handleCreateWildcard}>Guardar Wildcard</Button>
					</div>
				)}

				{wildcards.length || isLoading || showForm ? (
					<motion.div
						animate={{ opacity: 1, y: 0 }}
						className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
						initial={{ opacity: 0, y: 20 }}
						transition={{ duration: 0.3 }}
					>
						{wildcards.map((wildcard, index) => (
							<motion.div
								animate={{ opacity: 1, y: 0 }}
								initial={{ opacity: 0, y: 20 }}
								key={wildcard.id}
								transition={{ duration: 0.3, delay: index * 0.05 }}
							>
								<WildcardCard
									className={wildcard.id === currentWildcardId ? "ring-2 ring-primary" : ""}
									onClick={() => handleWildcardSelect(wildcard.id)}
									wildcard={wildcard}
								/>
							</motion.div>
						))}
					</motion.div>
				) : (
					<EmptyState
						description={
							localSearch
								? `No se encontraron wildcards que coincidan con "${localSearch}"`
								: "No hay wildcards disponibles"
						}
						icon={Sparkles}
						title="Sin wildcards"
					/>
				)}
			</div>
		</ScrollArea>
	);
}
