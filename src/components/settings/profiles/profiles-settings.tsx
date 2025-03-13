'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useProfileContext } from '@/lib/contexts';
import { cn } from '@/lib/utils';
import type { ProfileUpdate } from '@/services/profile.service';
import { Check, Smile, UserCog, UserPlus, UserX, Users } from 'lucide-react';
import * as React from 'react';
import { CompactPicker } from 'react-color';

export function ProfilesSettings() {
	const { settings, updateProfile, setActiveProfile, deleteProfile } = useProfileContext();
	const { profiles = [], activeProfile } = settings;
	const activeProfileData = profiles.find((p) => p.id === activeProfile) || profiles[0];

	const handleUpdateActiveProfile = async (updates: Partial<ProfileUpdate>) => {
		if (activeProfileData) {
			await updateProfile(activeProfileData.id, updates as ProfileUpdate);
		}
	};

	const handleAddProfile = async () => {
		await updateProfile(null, {
			name: 'Nuevo Perfil',
			emoji: '👤',
			color: '#3b82f6',
		});
	};

	const handleDeleteProfile = async (id: string) => {
		if (profiles.length === 1) {
			return; // No permitir eliminar el último perfil
		}
		await deleteProfile(id);
	};

	if (!profiles || profiles.length === 0) {
		return (
			<Card className="flex flex-col gap-2 bg-muted/30 rounded-sm">
				<CardHeader className="p-2 pb-0 bg-transparent">
					<CardTitle className="text-base text-muted-foreground font-semibold flex items-center justify-between pl-1">
						<span className="flex items-center gap-2 h-7">
							<UserCog className="h-5 w-5" /> Perfiles
						</span>
					</CardTitle>
				</CardHeader>
				<CardContent className="p-6 py-8 text-center">
					<UserPlus className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
					<p className="text-sm text-muted-foreground">No hay perfiles configurados</p>
					<p className="text-xs mt-1 text-muted-foreground/75 mb-4">Crea un perfil para personalizar tu experiencia</p>
					<Button onClick={handleAddProfile} className="mt-2">
						Crear perfil
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="flex flex-col gap-2 bg-muted/30 rounded-sm">
			{/* Perfil Activo */}
			<CardHeader className="p-2 pb-0 bg-transparent">
				<CardTitle className="text-base text-muted-foreground font-semibold flex items-center justify-between pl-1">
					<span className="flex items-center gap-2 h-7">
						<UserCog className="h-5 w-5" /> Perfiles
					</span>
					<Button variant="outline" size="sm" onClick={handleAddProfile} className="h-7 text-xs">
						<UserPlus className="h-3.5 w-3.5" />
					</Button>
				</CardTitle>
			</CardHeader>
			<Separator className="my-0" />
			<CardContent className="p-2 py-0">
				<div className="flex items-center gap-2 text-xs text-muted-foreground/75 mb-3">
					<Smile className="h-4 w-4" /> Perfil Activo
				</div>
				<div>
					<div className="flex items-center gap-2">
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 rounded-md items-center justify-center"
									style={{ backgroundColor: activeProfileData?.color }}
								>
									<span className="text-lg">{activeProfileData?.emoji}</span>
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-[320px] border-none p-0 bg-transparent" align="start">
								<EmojiPicker onEmojiSelect={(emoji: string) => handleUpdateActiveProfile({ emoji: emoji })} />
							</PopoverContent>
						</Popover>
						<div className="flex-1 min-w-0 space-y-1">
							<Input
								value={activeProfileData?.name}
								onChange={(e) => handleUpdateActiveProfile({ name: e.target.value })}
								className="h-8 text-base border-none p-3"
								placeholder="Nombre del perfil"
							/>

							<div className="flex gap-2">
								<select
									value={activeProfileData?.theme || 'system'}
									onChange={(e) => handleUpdateActiveProfile({ theme: e.target.value })}
									className="h-6 text-xs border-none rounded-sm bg-muted/30 px-2"
								>
									<option value="system">Sistema</option>
									<option value="light">Claro</option>
									<option value="dark">Oscuro</option>
								</select>
								<select
									value={activeProfileData?.language || 'es'}
									onChange={(e) => handleUpdateActiveProfile({ language: e.target.value })}
									className="h-6 text-xs border-none rounded-sm bg-muted/30 px-2"
								>
									<option value="es">Español</option>
									<option value="en">English</option>
								</select>
							</div>
						</div>
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
									<div className="h-4 w-4 rounded-full" style={{ backgroundColor: activeProfileData?.color }} />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0 bg-transparent border-none" align="end">
								<CompactPicker
									color={activeProfileData?.color}
									className="bg-black/90 text-white overflow-hidden"
									onChange={(color) => handleUpdateActiveProfile({ color: color.hex })}
								/>
							</PopoverContent>
						</Popover>
					</div>
				</div>
			</CardContent>
			{/* Otros Perfiles */}
			<Separator className="my-0" />
			<CardContent className="px-2">
				<div className="flex items-center gap-2 text-xs text-muted-foreground/75 mb-3">
					<Users className="h-4 w-4" /> Otros Perfiles
				</div>
				<div className="grid grid-cols-2 gap-2">
					{profiles
						.filter((profile) => profile.id !== activeProfile)
						.map((profile) => (
							<Card
								key={profile.id}
								className={cn('bg-muted/30 group rounded-sm', profile.isActive && 'ring-1 ring-primary')}
							>
								<CardContent className="p-2">
									<div className="flex items-center gap-2 relative">
										<div className="flex items-center gap-2 min-w-0">
											<div
												className="h-8 w-8 rounded-full flex items-center justify-center shadow-xs"
												style={{ backgroundColor: profile.color }}
											>
												<span className="text-lg">{profile.emoji}</span>
											</div>
											<div className="flex-1 min-w-0">
												<span className="text-xs font-semibold truncate pl-1">{profile.name}</span>
												<div className="flex gap-1 text-[10px] text-muted-foreground/75">
													<span>
														{profile.theme === 'system' ? 'Sistema' : profile.theme === 'light' ? 'Claro' : 'Oscuro'}
													</span>
													<span>•</span>
													<span>{profile.language === 'es' ? 'Español' : 'English'}</span>
												</div>
											</div>
										</div>
										<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-8 shadow-lg">
											<Button
												variant="outline"
												onClick={() => setActiveProfile(profile.id)}
												className="h-4 text-xs gap-1 text-[9px] rounded-sm p-2"
											>
												<Check className="h-3.5 w-3.5 text-green-500" />
												Activar
											</Button>
											<Button
												variant="ghost"
												onClick={() => handleDeleteProfile(profile.id)}
												className="h-4 text-red-500 hover:text-red-500/90 text-[9px] rounded-sm p-1 py-2"
											>
												<UserX className="h-2 w-2" />
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						))}

					{profiles.length <= 1 && (
						<div className="py-6 text-center">
							<UserPlus className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
							<p className="text-xs text-muted-foreground">No hay perfiles adicionales</p>
							<p className="text-[10px] mt-1 text-muted-foreground/75">
								Crea más perfiles para diferentes configuraciones
							</p>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
