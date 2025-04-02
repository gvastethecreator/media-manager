import {
    deserializeVideoChapters,
    deserializeVideoMetadata,
    deserializeVideoPlayState,
    extendVideo,
    extendVideoComplete,
    serializeVideoChapters,
    serializeVideoMetadata,
    serializeVideoPlayState,
    validateVideo
} from '@/entities/video/serializers';
import { VideoFormat } from '@/types/entities/video/enums';
import type { VideoChapter, VideoComplete, VideoMetadata, VideoPlayState } from '@/types/entities/video/types';
import { describe, expect, it } from '@jest/globals';

describe('🧪 Video Serializers', () => {
  const mockMetadata: VideoMetadata = {
    duration: 120,
    width: 1920,
    height: 1080,
    format: VideoFormat.MP4,
    size: 1024000,
    codec: 'h264',
    bitrate: 5000000,
    frameRate: 30,
    aspectRatio: '16:9',
    hasAudio: true
  };

  const mockPlayState: VideoPlayState = {
    position: 60,
    lastPlayed: new Date('2024-01-01').toISOString(),
    completed: false,
    favorite: false,
    watchCount: 1
  };

  const mockChapters: VideoChapter[] = [
    {
      id: 'chapter-1',
      title: 'Introducción',
      startTime: 0,
      endTime: 30,
      thumbnailPath: '/thumbnails/chapter-1.jpg'
    },
    {
      id: 'chapter-2',
      title: 'Desarrollo',
      startTime: 30,
      endTime: 90,
      thumbnailPath: '/thumbnails/chapter-2.jpg'
    }
  ];

  const mockVideo: VideoComplete = {
    id: 'test-id',
    name: 'test-video.mp4',
    description: 'Test video description',
    path: '/path/to/test-video.mp4',
    hash: 'test-hash',
    size: 1024000,
    duration: 120,
    width: 1920,
    height: 1080,
    metadata: JSON.stringify(mockMetadata),
    thumbnail: null,
    thumbnailSize: null,
    thumbnailWidth: null,
    thumbnailHeight: null,
    isPublic: false,
    isFavorite: false,
    folderId: 'folder-id',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    playState: JSON.stringify(mockPlayState),
    chapters: JSON.stringify(mockChapters)
  };

  describe('serializeVideoMetadata', () => {
    it('debería serializar metadatos válidos', () => {
      const result = serializeVideoMetadata(mockMetadata);
      expect(JSON.parse(result)).toEqual(mockMetadata);
    });

    it('debería manejar metadatos nulos', () => {
      const result = serializeVideoMetadata(null);
      expect(result).toBe('');
    });
  });

  describe('deserializeVideoMetadata', () => {
    it('debería deserializar metadatos válidos', () => {
      const serialized = JSON.stringify(mockMetadata);
      const result = deserializeVideoMetadata(serialized);
      expect(result).toEqual(mockMetadata);
    });

    it('debería manejar metadatos nulos o inválidos', () => {
      expect(deserializeVideoMetadata(null)).toBeNull();
      expect(deserializeVideoMetadata('invalid-json')).toBeNull();
    });
  });

  describe('serializeVideoPlayState', () => {
    it('debería serializar estado de reproducción válido', () => {
      const result = serializeVideoPlayState(mockPlayState);
      expect(JSON.parse(result)).toEqual(mockPlayState);
    });

    it('debería manejar estado nulo', () => {
      const result = serializeVideoPlayState(null);
      expect(result).toBe('');
    });
  });

  describe('deserializeVideoPlayState', () => {
    it('debería deserializar estado de reproducción válido', () => {
      const serialized = JSON.stringify(mockPlayState);
      const result = deserializeVideoPlayState(serialized);
      expect(result).toEqual(mockPlayState);
    });

    it('debería manejar estado nulo o inválido', () => {
      expect(deserializeVideoPlayState(null)).toBeNull();
      expect(deserializeVideoPlayState('invalid-json')).toBeNull();
    });
  });

  describe('serializeVideoChapters', () => {
    it('debería serializar capítulos válidos', () => {
      const result = serializeVideoChapters(mockChapters);
      expect(JSON.parse(result)).toEqual(mockChapters);
    });

    it('debería manejar capítulos nulos', () => {
      const result = serializeVideoChapters(null);
      expect(result).toBe('');
    });
  });

  describe('deserializeVideoChapters', () => {
    it('debería deserializar capítulos válidos', () => {
      const serialized = JSON.stringify(mockChapters);
      const result = deserializeVideoChapters(serialized);
      expect(result).toEqual(mockChapters);
    });

    it('debería manejar capítulos nulos o inválidos', () => {
      expect(deserializeVideoChapters(null)).toBeNull();
      expect(deserializeVideoChapters('invalid-json')).toBeNull();
    });
  });

  describe('extendVideo', () => {
    it('debería extender un video con campos deserializados', () => {
      const result = extendVideo(mockVideo);

      expect(result).toEqual({
        ...mockVideo,
        metadata: mockMetadata,
        playState: mockPlayState,
        chapters: mockChapters
      });
    });

    it('debería manejar campos nulos', () => {
      const videoSinCampos = {
        ...mockVideo,
        metadata: null,
        playState: null,
        chapters: null
      };

      const result = extendVideo(videoSinCampos);

      expect(result).toEqual({
        ...videoSinCampos,
        metadata: null,
        playState: null,
        chapters: null
      });
    });
  });

  describe('extendVideoComplete', () => {
    it('debería extender un video completo', () => {
      const result = extendVideoComplete(mockVideo);

      expect(result).toEqual({
        ...extendVideo(mockVideo),
        thumbnailUrl: null,
        isSelected: false
      });
    });

    it('debería generar thumbnailUrl cuando existe thumbnail', () => {
      const videoConThumbnail = {
        ...mockVideo,
        thumbnail: Buffer.from('test')
      };

      const result = extendVideoComplete(videoConThumbnail);

      expect(result.thumbnailUrl).toBe(`/api/videos/${videoConThumbnail.id}/thumbnail`);
    });
  });

  describe('validateVideo', () => {
    it('debería validar un video válido', () => {
      const result = validateVideo(mockVideo);
      expect(result).toEqual(mockVideo);
    });

    it('debería rechazar un video inválido', () => {
      const videoInvalido = {
        id: 'test-id'
        // Faltan campos requeridos
      };

      expect(() => validateVideo(videoInvalido)).toThrow();
    });
  });
});