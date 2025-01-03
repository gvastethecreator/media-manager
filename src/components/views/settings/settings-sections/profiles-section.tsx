"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { UserPlus, Trash2, Check, Smile } from "lucide-react";
import { useSettingsContext } from "@/context/settings-context";
import type { ThemeMode, Language } from "@/types/settings";
import { cn } from "@/lib/utils";
import { GithubPicker } from "react-color";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { EmojiPicker } from "@/components/ui/emoji-picker";

export function ProfilesSection() {
	const { settings, updateProfile, setActiveProfile, deleteProfile } =
		useSettingsContext();
	const { profiles, activeProfile } = settings;
	const activeProfileData = profiles.find((p) => p.id === activeProfile);

	const handleUpdateActiveProfile = async (
		updates: Partial<typeof activeProfileData>
	) => {
		if (activeProfileData) {
			await updateProfile(activeProfileData.id, updates);
		}
	};

	const handleAddProfile = async () => {
		await updateProfile(null, {
			name: "Nuevo Perfil",
			emoji: "👤",
			color: "#3b82f6",
		});
	};

	const handleDeleteProfile = async (id: string) => {
		if (profiles.length === 1) {
			return; // No permitir eliminar el último perfil
		}
		await deleteProfile(id);
	};

	return (
		<div className="space-y-3">
			{/* Perfil Activo */}
			<Card className="border-none">
				<CardHeader className="px-4 py-2">
					<CardTitle className="text-base font-semibold flex items-center gap-2">
						<Smile className="h-5 w-5" /> Perfil Activo
					</CardTitle>
				</CardHeader>
				<CardContent className="p-3">
					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										size="icon"
										className="h-8 w-8 rounded-full"
										style={{ backgroundColor: activeProfileData?.color }}
									>
										<span className="text-base">
											{activeProfileData?.emoji}
										</span>
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-[320px] p-0" align="start">
									<EmojiPicker
										onEmojiSelect={(emoji) =>
											handleUpdateActiveProfile({ emoji })
										}
									/>
								</PopoverContent>
							</Popover>
							<div className="flex-1 min-w-0">
								<Input
									value={activeProfileData?.name}
									onChange={(e) =>
										handleUpdateActiveProfile({ name: e.target.value })
									}
									className="h-8 text-sm"
									placeholder="Nombre del perfil"
								/>
							</div>
							<Popover>
								<PopoverTrigger asChild>
									<Button variant="outline" size="icon" className="h-8 w-8">
										<div
											className="h-4 w-4 rounded-full"
											style={{ backgroundColor: activeProfileData?.color }}
										/>
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="end">
									<GithubPicker
										color={activeProfileData?.color}
										onChange={(color) =>
											handleUpdateActiveProfile({ color: color.hex })
										}
									/>
								</PopoverContent>
							</Popover>
						</div>

					</div>
				</CardContent>
			</Card>

			{/* Otros Perfiles */}
			<Card className="border-none">
				<CardHeader className="px-4 py-2">
					<div className="flex items-center justify-between">
						<CardTitle className="text-base font-semibold flex items-center gap-2">
							<UserPlus className="h-5 w-5" /> Otros Perfiles
						</CardTitle>
						<Button
							variant="outline"
							size="sm"
							onClick={handleAddProfile}
							className="h-7 text-xs gap-1.5"
						>
							<UserPlus className="h-3.5 w-3.5" />
							Nuevo Perfil
						</Button>
					</div>
				</CardHeader>
				<CardContent className="p-3">
					<div className="space-y-1.5">
						{profiles
							.filter((profile) => profile.id !== activeProfile)
							.map((profile) => (
								<Card
									key={profile.id}
									className={cn(
										"bg-muted/30 group",
										profile.isActive && "ring-1 ring-primary"
									)}
								>
									<CardContent className="p-2">
										<div className="flex items-center gap-2">
											<div className="flex items-center gap-2 flex-1 min-w-0">
												<Button
													variant="ghost"
													size="icon"
													className="h-7 w-7 rounded-full"
													style={{ backgroundColor: profile.color }}
												>
													<span className="text-sm">{profile.emoji}</span>
												</Button>
												<div className="flex-1 min-w-0">
													<Input
														value={profile.name}
														onChange={(e) =>
															updateProfile(profile.id, {
																name: e.target.value,
															})
														}
														className="h-7 text-xs"
													/>
												</div>
											</div>
											<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => setActiveProfile(profile.id)}
													className="h-7 text-xs gap-1.5"
												>
													<Check className="h-3.5 w-3.5" />
													Activar
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => handleDeleteProfile(profile.id)}
													className="h-7 w-7 text-destructive hover:text-destructive/90"
												>
													<Trash2 className="h-3.5 w-3.5" />
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							))}

						{profiles.length <= 1 && (
							<div className="py-6 text-center">
								<UserPlus className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
								<p className="text-xs text-muted-foreground">
									No hay perfiles adicionales
								</p>
								<p className="text-[10px] mt-1 text-muted-foreground/75">
									Crea más perfiles para diferentes configuraciones
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
