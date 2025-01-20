"use client";

import * as React from "react";
import { EntityForm } from "./entity-form";
import { CharacterFormData } from "./entity-types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface CharacterFormProps {
	initialData?: CharacterFormData;
	onSubmit: (data: CharacterFormData) => Promise<void>;
	onCancel?: () => void;
	isLoading?: boolean;
}

const CHARACTER_CLASSES = [
	"Guerrero",
	"Mago",
	"Clérigo",
	"Pícaro",
	"Paladín",
	"Druida",
	"Bárbaro",
	"Bardo",
	"Monje",
	"Hechicero",
	"Brujo",
	"Explorador",
];

const CHARACTER_RACES = [
	"Humano",
	"Elfo",
	"Enano",
	"Mediano",
	"Gnomo",
	"Semielfo",
	"Semiorco",
	"Dracónido",
	"Tiefling",
];

const CHARACTER_ALIGNMENTS = [
	"Legal Bueno",
	"Neutral Bueno",
	"Caótico Bueno",
	"Legal Neutral",
	"Neutral",
	"Caótico Neutral",
	"Legal Malvado",
	"Neutral Malvado",
	"Caótico Malvado",
];

export function CharacterForm({
	initialData,
	onSubmit,
	onCancel,
	isLoading,
}: CharacterFormProps) {
	const handleSubmit = async (data: CharacterFormData) => {
		await onSubmit(data);
	};

	return (
		<EntityForm<CharacterFormData>
			initialData={initialData}
			onSubmit={handleSubmit}
			onCancel={onCancel}
			isLoading={isLoading}
			title={initialData ? "Editar Personaje" : "Nuevo Personaje"}
			submitLabel={initialData ? "Guardar Cambios" : "Crear"}
			extraFields={
				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label className="text-sm font-medium">Nivel</label>
							<Input
								type="number"
								min={1}
								max={20}
								name="level"
								placeholder="Nivel"
								defaultValue={initialData?.level?.toString() || "1"}
								className="h-8"
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium">Clase</label>
							<Select
								name="class"
								defaultValue={initialData?.class || "unknown"}
							>
								<SelectTrigger className="h-8">
									<SelectValue placeholder="Selecciona una clase" />
								</SelectTrigger>
								<SelectContent>
									{CHARACTER_CLASSES.map((cls) => (
										<SelectItem key={cls} value={cls}>
											{cls}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label className="text-sm font-medium">Raza</label>
							<Select name="race" defaultValue={initialData?.race || "unknown"}>
								<SelectTrigger className="h-8">
									<SelectValue placeholder="Selecciona una raza" />
								</SelectTrigger>
								<SelectContent>
									{CHARACTER_RACES.map((race) => (
										<SelectItem key={race} value={race}>
											{race}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium">Alineamiento</label>
							<Select
								name="alignment"
								defaultValue={initialData?.alignment || "neutral"}
							>
								<SelectTrigger className="h-8">
									<SelectValue placeholder="Selecciona alineamiento" />
								</SelectTrigger>
								<SelectContent>
									{CHARACTER_ALIGNMENTS.map((alignment) => (
										<SelectItem key={alignment} value={alignment}>
											{alignment}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">
							Historia del Personaje
						</label>
						<Textarea
							name="backstory"
							placeholder="Escribe la historia del personaje..."
							defaultValue={initialData?.backstory}
							className="min-h-[100px] resize-y"
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Estadísticas (JSON)</label>
						<Textarea
							name="stats"
							placeholder='{"fuerza": 10, "destreza": 10, ...}'
							defaultValue={initialData?.stats}
							className="font-mono text-sm"
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Perfil Psicológico</label>
						<Textarea
							name="psychologicalProfile"
							placeholder="Describe el perfil psicológico del personaje..."
							defaultValue={initialData?.psychologicalProfile}
							className="min-h-[100px] resize-y"
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Perfil Social</label>
						<Textarea
							name="socialProfile"
							placeholder="Describe el perfil social del personaje..."
							defaultValue={initialData?.socialProfile}
							className="min-h-[100px] resize-y"
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label className="text-sm font-medium">Relaciones (JSON)</label>
							<Textarea
								name="relationships"
								placeholder='[{"nombre": "NPC", "relación": "amigo", ...}]'
								defaultValue={initialData?.relationships}
								className="font-mono text-sm"
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium">Objetivos (JSON)</label>
							<Textarea
								name="goals"
								placeholder='["Objetivo 1", "Objetivo 2", ...]'
								defaultValue={initialData?.goals}
								className="font-mono text-sm"
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label className="text-sm font-medium">Miedos (JSON)</label>
							<Textarea
								name="fears"
								placeholder='["Miedo 1", "Miedo 2", ...]'
								defaultValue={initialData?.fears}
								className="font-mono text-sm"
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium">Creencias (JSON)</label>
							<Textarea
								name="beliefs"
								placeholder='["Creencia 1", "Creencia 2", ...]'
								defaultValue={initialData?.beliefs}
								className="font-mono text-sm"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Personalidad (JSON)</label>
						<Textarea
							name="personality"
							placeholder='["Rasgo 1", "Rasgo 2", ...]'
							defaultValue={initialData?.personality}
							className="font-mono text-sm"
						/>
					</div>
				</div>
			}
		/>
	);
}
