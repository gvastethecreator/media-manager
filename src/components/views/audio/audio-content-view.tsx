import { Edit, Music, Pause, Play, Trash2, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useEffect, useRef, useState } from 'react';
import { AudioCard } from '@/components/cards/audio-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import type { AudioWithStats } from '@/types/entities/audio';

interface AudioContentViewProps {
	audios: AudioWithStats[];
	isLoading: boolean;
	error: string | null;
	showForm: boolean;
	newAudioName: string;
	newAudioFile: File | null;
	currentAudio: AudioWithStats | null;
	editingAudio: AudioWithStats | null;
	setShowForm: (show: boolean) => void;
	setNewAudioName: (name: string) => void;
	setNewAudioFile: (file: File | null) => void;
	setCurrentAudio: (audio: AudioWithStats | null) => void;
	setEditingAudio: (audio: AudioWithStats | null) => void;
	handleAudioClick: (audio: AudioWithStats) => void;
	handleEditAudio: (audio: AudioWithStats) => void;
	handleDeleteAudio: (audioId: string) => Promise<void>;
	handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	handleCreateAudio: () => Promise<void>;
}

const MemoizedAudioCard = React.memo(
	({
		audio,
		onAudioClick,
		onEdit,
		onDelete,
	}: {
		audio: AudioWithStats;
		onAudioClick: () => void;
		onEdit: (audio: AudioWithStats) => void;
		onDelete: (audioId: string) => void;
	}) => (
		<div className="relative">
			<AudioCard audio={audio} onClick={onAudioClick} className="h-full" />
			<div className="absolute top-2 right-2 flex gap-1">
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7"
					onClick={(e) => {
						e.stopPropagation();
						onEdit(audio);
					}}
				>
					<Edit className="h-4 w-4" />
				</Button>
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7 text-destructive"
							onClick={(e) => e.stopPropagation()}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
							<AlertDialogDescription>
								Esta acción eliminará permanentemente el audio "{audio.name}".
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancelar</AlertDialogCancel>
							<AlertDialogAction
								onClick={() => onDelete(audio.id)}
								className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							>
								Eliminar
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
	),
	(prevProps, nextProps) =>
		prevProps.audio.id === nextProps.audio.id &&
		prevProps.audio.name === nextProps.audio.name &&
		prevProps.audio.updatedAt === nextProps.audio.updatedAt
);
MemoizedAudioCard.displayName = 'MemoizedAudioCard';

const AudioContentView: React.FC<AudioContentViewProps> = ({
	audios,
	isLoading,
	error,
	showForm,
	newAudioName,
	newAudioFile,
	currentAudio,
	editingAudio,
	setShowForm,
	setNewAudioName,
	setNewAudioFile,
	setCurrentAudio,
	setEditingAudio,
	handleAudioClick,
	handleEditAudio,
	handleDeleteAudio,
	handleFileChange,
	handleCreateAudio,
}) => {
	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Error: {error}</p>
			</div>
		);
	}

	if (isLoading && audios.length === 0) {
		return <LoadingScreen />;
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<h2 className="text-xl font-bold mb-4">Vista de Audios</h2>

				<Button onClick={() => setShowForm(!showForm)} className="mb-4">
					{showForm ? 'Cancelar' : 'Subir Audio'}
				</Button>

				{showForm && (
					<div className="mb-6 p-4 border rounded-lg shadow-sm">
						<h3 className="text-lg font-semibold mb-3">Nuevo Audio</h3>
						<div className="grid gap-2 mb-3">
							<Label htmlFor="audioName">Nombre</Label>
							<Input
								id="audioName"
								value={newAudioName}
								onChange={(e) => setNewAudioName(e.target.value)}
								placeholder="Nombre del audio"
							/>
						</div>
						<div className="grid gap-2 mb-4">
							<Label htmlFor="audioFile">Archivo de Audio</Label>
							<Input id="audioFile" type="file" accept="audio/*" onChange={handleFileChange} />
						</div>
						<Button onClick={handleCreateAudio}>Guardar Audio</Button>
					</div>
				)}

				{(!audios || audios.length === 0) && !isLoading && !showForm ? (
					<EmptyState
						icon={Music}
						title="No hay archivos de audio"
						description="Sube archivos de audio para comenzar a usar el reproductor."
					/>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{audios?.map((audio: AudioWithStats, index: number) => {
							const onAudioClick = () => handleAudioClick(audio);
							return (
								<motion.div
									key={audio.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
									className="perspective-1000"
								>
									<div
										className="h-full w-full transition-all ease-in-out hover:scale-[1.03] active:scale-[0.98] duration-300 hover:z-10"
										data-audio-id={audio.id}
									>
										<MemoizedAudioCard
											audio={audio}
											onAudioClick={onAudioClick}
											onEdit={handleEditAudio}
											onDelete={handleDeleteAudio}
										/>
									</div>
								</motion.div>
							);
						})}
					</div>
				)}

				{/* Reproductor de audio flotante */}
				{currentAudio && <AudioPlayer audio={currentAudio} onClose={() => setCurrentAudio(null)} />}
			</div>
		</ScrollArea>
	);
};

export default AudioContentView;

// Componente de reproductor de audio
const AudioPlayer = ({ audio, onClose }: { audio: AudioWithStats; onClose: () => void }) => {
	const audioRef = useRef<HTMLAudioElement>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [volume, setVolume] = useState(1);
	const [isMuted, setIsMuted] = useState(false);

	useEffect(() => {
		const audioElement = audioRef.current;
		if (!audioElement) return;

		const handleTimeUpdate = () => setCurrentTime(audioElement.currentTime);
		const handleDurationChange = () => setDuration(audioElement.duration);
		const handleEnded = () => setIsPlaying(false);

		audioElement.addEventListener('timeupdate', handleTimeUpdate);
		audioElement.addEventListener('durationchange', handleDurationChange);
		audioElement.addEventListener('ended', handleEnded);

		return () => {
			audioElement.removeEventListener('timeupdate', handleTimeUpdate);
			audioElement.removeEventListener('durationchange', handleDurationChange);
			audioElement.removeEventListener('ended', handleEnded);
		};
	}, []);

	const handlePlayPause = () => {
		if (audioRef.current) {
			if (isPlaying) {
				audioRef.current.pause();
			} else {
				audioRef.current.play();
			}
			setIsPlaying(!isPlaying);
		}
	};

	const handleTimeChange = (value: number[]) => {
		if (audioRef.current) {
			audioRef.current.currentTime = value[0];
			setCurrentTime(value[0]);
		}
	};

	const handleVolumeChange = (value: number[]) => {
		if (audioRef.current) {
			const newVolume = value[0];
			audioRef.current.volume = newVolume;
			setVolume(newVolume);
			setIsMuted(newVolume === 0);
		}
	};

	const handleMute = () => {
		if (audioRef.current) {
			if (isMuted) {
				audioRef.current.volume = volume;
				setIsMuted(false);
			} else {
				audioRef.current.volume = 0;
				setIsMuted(true);
			}
		}
	};

	const formatTime = (time: number) => {
		const minutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	};

	return (
		<Card className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md">
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm font-medium truncate">{audio.name}</CardTitle>
					<Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
						×
					</Button>
				</div>
			</CardHeader>
			<CardContent className="space-y-3">
				<audio ref={audioRef} src={`/api/audio/${audio.id}/stream`} preload="metadata">
					<track kind="captions" srcLang="es" label="Español" />
				</audio>

				{/* Controles de tiempo */}
				<div className="space-y-2">
					<Slider
						value={[currentTime]}
						max={duration}
						step={1}
						onValueChange={handleTimeChange}
						className="cursor-pointer"
					/>
					<div className="flex justify-between text-xs text-muted-foreground">
						<span>{formatTime(currentTime)}</span>
						<span>{formatTime(duration)}</span>
					</div>
				</div>

				{/* Controles de reproducción */}
				<div className="flex items-center justify-between">
					<Button variant="ghost" size="sm" onClick={handlePlayPause} className="h-8 w-8 p-0">
						{isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
					</Button>

					<div className="flex items-center gap-2">
						<Button variant="ghost" size="sm" onClick={handleMute} className="h-6 w-6 p-0">
							{isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
						</Button>
						<Slider
							value={[isMuted ? 0 : volume]}
							max={1}
							step={0.1}
							onValueChange={handleVolumeChange}
							className="w-16"
						/>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};
