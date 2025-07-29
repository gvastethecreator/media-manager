/**
 * @file AudioViewer component for audio file playback and visualization
 * @module components/features/file-viewer/viewers/audio-viewer
 */

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, SkipBack, SkipForward } from 'lucide-react';
import type { AudioWithStats } from '@/types/entities/audio';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { formatFileSize, formatDuration } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface AudioViewerProps {
  audio: AudioWithStats;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function AudioViewer({ audio, onClose, onNext, onPrevious }: AudioViewerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Audio source URL
  const audioSrc = audio.path || `/api/audio/${audio.id}/stream`;

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handleLoadedMetadata = () => {
      setDuration(audioElement.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audioElement.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setError('Error al cargar el archivo de audio');
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('ended', handleEnded);
    audioElement.addEventListener('error', handleError);
    audioElement.addEventListener('canplay', handleCanPlay);

    return () => {
      audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.removeEventListener('error', handleError);
      audioElement.removeEventListener('canplay', handleCanPlay);
    };
  }, [audioSrc]);

  const togglePlayPause = () => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    audioElement.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (value: number[]) => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const newTime = (value[0] / 100) * duration;
    audioElement.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const newVolume = value[0] / 100;
    audioElement.volume = newVolume;
    setVolume(newVolume);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = audioSrc;
    link.download = audio.name || 'audio';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onPrevious}>
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onNext}>
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Audio Element */}
        <audio
          ref={audioRef}
          src={audioSrc}
          preload="metadata"
          className="hidden"
        />

        {/* Audio Info */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">{audio.name}</h2>
          {audio.description && (
            <p className="text-muted-foreground mb-4">{audio.description}</p>
          )}
          <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
            <span>Tamaño: {formatFileSize(audio.size || 0)}</span>
            {duration > 0 && <span>Duración: {formatDuration(duration)}</span>}
            {audio.stats?.bitrate && <span>Bitrate: {audio.stats.bitrate} kbps</span>}
          </div>
        </div>

        {/* Waveform Placeholder */}
        <div className="w-full max-w-2xl h-32 bg-muted rounded-lg mb-8 flex items-center justify-center">
          <div className="text-muted-foreground text-sm">
            Visualización de forma de onda
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center text-red-500 mb-4">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center text-muted-foreground mb-4">
            Cargando audio...
          </div>
        )}

        {/* Controls */}
        <div className="w-full max-w-2xl">
          {/* Progress Bar */}
          <div className="mb-4">
            <Slider
              value={[progress]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
              className="w-full"
              disabled={isLoading || !!error}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={togglePlayPause}
              disabled={isLoading || !!error}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" onClick={toggleMute}>
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <Slider
                value={[volume * 100]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="w-24"
              />
            </div>

            <Button variant="outline" size="icon" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Metadata Panel */}
      <div className="border-t p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Formato:</span>
            <span className="ml-2 text-muted-foreground">
              {audio.path?.split('.').pop()?.toUpperCase() || 'Audio'}
            </span>
          </div>
          {audio.stats?.sampleRate && (
            <div>
              <span className="font-medium">Sample Rate:</span>
              <span className="ml-2 text-muted-foreground">
                {audio.stats.sampleRate} Hz
              </span>
            </div>
          )}
          {audio.stats?.channels && (
            <div>
              <span className="font-medium">Canales:</span>
              <span className="ml-2 text-muted-foreground">
                {audio.stats.channels === 1 ? 'Mono' : audio.stats.channels === 2 ? 'Estéreo' : `${audio.stats.channels} canales`}
              </span>
            </div>
          )}
          <div>
            <span className="font-medium">Creado:</span>
            <span className="ml-2 text-muted-foreground">
              {new Date(audio.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}