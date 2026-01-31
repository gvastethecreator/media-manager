import { Check, Smile, UserCog, UserPlus, Users, UserX } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useProfileContext } from '@/lib/contexts';
import { DEFAULT_ENTITY_COLOR } from '@/lib/styles/color-tokens';
import { cn } from '@/lib/utils';
import type { UpdateProfileInput as ProfileUpdate } from '@/services/profile/client';

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
			color: DEFAULT_ENTITY_COLOR,
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
			<Card className="flex flex-col gap-2 rounded-dt-md border-none bg-muted/30 shadow-sm">
				<CardHeader className="bg-transparent p-2 pb-0">
					<CardTitle className="flex items-center justify-between pl-1 text-heading-sm text-muted-foreground">
						<span className="flex h-7 items-center gap-2">
							<UserCog className="h-5 w-5" /> Perfiles
						</span>
					</CardTitle>
				</CardHeader>
				<CardContent className="p-4 py-6 text-center">
					<UserPlus className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
					<p className="text-muted-foreground text-sm">No hay perfiles configurados</p>
					<p className="mt-1 mb-4 text-muted-foreground/75 text-xs">Crea un perfil para personalizar tu experiencia</p>
					<Button className="mt-2" onClick={handleAddProfile}>
						Crear perfil
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="flex flex-col gap-2 rounded-dt-md border-none bg-muted/30 shadow-sm">
			{/* Perfil Activo */}
			<CardHeader className="bg-transparent p-2 pb-0">
				<CardTitle className="flex items-center justify-between pl-1 text-heading-sm text-muted-foreground">
					<span className="flex h-7 items-center gap-2">
						<UserCog className="h-5 w-5" /> Perfiles
					</span>
					<Button className="h-7 text-xs" onClick={handleAddProfile} size="sm" variant="outline">
						<UserPlus className="h-3.5 w-3.5" />
					</Button>
				</CardTitle>
			</CardHeader>
			<Separator className="my-0" />
			<CardContent className="p-2 py-0">
				<div className="mb-3 flex items-center gap-2 text-muted-foreground/75 text-xs">
					<Smile className="h-4 w-4" /> Perfil Activo
				</div>
				<div>
					<div className="flex items-center gap-2">
						<Popover>
							<PopoverTrigger asChild>
								<Button
									className="h-8 w-8 items-center justify-center rounded-md"
									size="icon"
									style={{ backgroundColor: activeProfileData?.color }}
									variant="ghost"
								>
									<span className="text-lg">{activeProfileData?.emoji}</span>
								</Button>
							</PopoverTrigger>
							<PopoverContent align="start" className="w-[320px] border-none bg-transparent p-0">
								<EmojiPicker onEmojiSelect={(emoji: string) => handleUpdateActiveProfile({ emoji })} />
							</PopoverContent>
						</Popover>
						<div className="min-w-0 flex-1 space-y-1">
							<Input
								className="h-8 border-none p-3 text-base"
								onChange={(e) => handleUpdateActiveProfile({ name: e.target.value })}
								placeholder="Nombre del perfil"
								value={activeProfileData?.name}
							/>

							<div className="flex gap-2">
								<div className="text-muted-foreground text-xs">Perfil: {activeProfileData?.name}</div>
							</div>
						</div>
						<Popover>
							<PopoverTrigger asChild>
								<Button className="h-8 w-8 rounded-full" size="icon" variant="ghost">
									<div className="h-4 w-4 rounded-full" style={{ backgroundColor: activeProfileData?.color }} />
								</Button>
							</PopoverTrigger>
							<PopoverContent align="end" className="w-auto p-3">
								<HexColorPicker
									color={activeProfileData?.color}
									onChange={(color) => handleUpdateActiveProfile({ color })}
								/>
							</PopoverContent>
						</Popover>
					</div>
				</div>
			</CardContent>
			{/* Otros Perfiles */}
			<Separator className="my-0" />
			<CardContent className="px-2">
				<div className="mb-3 flex items-center gap-2 text-muted-foreground/75 text-xs">
					<Users className="h-4 w-4" /> Otros Perfiles
				</div>
				<div className="grid grid-cols-2 gap-2">
					{profiles
						.filter((profile) => profile.id !== activeProfile)
						.map((profile) => (
							<Card
								className={cn('group rounded-dt-sm bg-muted/30', profile.isActive && 'ring-1 ring-primary')}
								key={profile.id}
							>
								<CardContent className="p-2">
									<div className="relative flex items-center gap-2">
										<div className="flex min-w-0 items-center gap-2">
											<div
												className="flex h-8 w-8 items-center justify-center rounded-full shadow-xs"
												style={{ backgroundColor: profile.color }}
											>
												<span className="text-lg">{profile.emoji}</span>
											</div>
											<div className="min-w-0 flex-1">
												<span className="truncate pl-1 font-semibold text-body-sm">{profile.name}</span>
												<div className="flex gap-1 text-caption text-muted-foreground/75">
													<span>
														{profile.preferences?.theme === 'system'
															? 'Sistema'
															: profile.preferences?.theme === 'light'
																? 'Claro'
																: 'Oscuro'}
													</span>
													<span>•</span>
													<span>{profile.preferences?.language === 'es' ? 'Español' : 'English'}</span>
												</div>
											</div>
										</div>
										<div className="absolute top-8 right-0 flex items-center gap-1 opacity-0 shadow-dt-2 transition-opacity group-hover:opacity-100">
											<Button
												className="h-4 gap-1 rounded-sm p-2 text-[9px] text-xs"
												onClick={() => setActiveProfile(profile.id)}
												variant="outline"
											>
												<Check className="h-3.5 w-3.5 text-[color:var(--status-success)]" />
												Activar
											</Button>
											<Button
												className="h-4 rounded-sm p-1 py-2 text-[9px] text-destructive hover:text-destructive/90"
												onClick={() => handleDeleteProfile(profile.id)}
												variant="ghost"
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
							<UserPlus className="mx-auto mb-2 h-6 w-6 text-muted-foreground/50" />
							<p className="text-muted-foreground text-xs">No hay perfiles adicionales</p>
							<p className="mt-1 text-[10px] text-muted-foreground/75">
								Crea más perfiles para diferentes configuraciones
							</p>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
