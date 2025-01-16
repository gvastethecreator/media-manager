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
	const extraFields = (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<label className="text-sm font-medium">Nivel</label>
					<Input
						type="number"
						min={1}
						max={20}
						placeholder="Nivel"
						name="level"
						className="h-8"
					/>
				</div>
				<div className="space-y-2">
					<label className="text-sm font-medium">Clase</label>
					<Select name="class">
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
					<Select name="race">
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
					<Select name="alignment">
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
				<label className="text-sm font-medium">Historia del Personaje</label>
				<Textarea
					placeholder="Escribe la historia del personaje..."
					name="backstory"
					className="min-h-[100px]"
				/>
			</div>

			<div className="space-y-2">
				<label className="text-sm font-medium">Estadísticas (JSON)</label>
				<Textarea
					placeholder='{"fuerza": 10, "destreza": 10, ...}'
					name="stats"
					className="font-mono text-sm"
				/>
			</div>
		</div>
	);

	return (
		<EntityForm<CharacterFormData>
			initialData={initialData}
			onSubmit={onSubmit}
			onCancel={onCancel}
			isLoading={isLoading}
			title="Personaje"
			submitLabel={initialData ? "Actualizar" : "Crear"}
			extraFields={extraFields}
		/>
	);
}
