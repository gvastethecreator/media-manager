import {
    extendVideoCompleteTransform,
    extendVideoTransform,
    toRelatedVideo,
    validateVideoData
} from '@/entities/video/transformer';
import { VideoFormat } from '@/types/entities/video/enums';
import type { VideoBase, VideoComplete, VideoWithRelationsComplete } from '@/types/entities/video/types';
import { describe, expect, it } from '@jest/globals';

describe('🧪 Video Transformer', () => {
  const mockVideoBase: VideoBase = {
    id: 'test-id',
    name: 'test-video.mp4',
    description: 'Test video description',
    path: '/path/to/test-video.mp4',
    hash: 'test-hash',
    size: 1024000,
    duration: 120,
    width: 1920,
    height: 1080,
    metadata: JSON.stringify({
      format: VideoFormat.MP4,
      codec: 'h264',
      bitrate: 5000000,
      frameRate: 30,
      aspectRatio: '16:9',
      hasAudio: true
    }),
    thumbnail: null,
    thumbnailSize: null,
    thumbnailWidth: null,
    thumbnailHeight: null,
    isPublic: false,
    isFavorite: false,
    folderId: 'folder-id',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  const mockVideoComplete: VideoComplete = {
    ...mockVideoBase,
    folder: {
      id: 'folder-id',
      name: 'Test Folder',
      path: '/test-folder'
    },
    _count: {
      albums: 0,
      collections: 0,
      tags: 0,
      characters: 0,
      places: 0,
      worldItems: 0,
      concepts: 0,
      prompts: 0,
      notes: 0,
      wildcards: 0,
      properties: 0,
      groups: 0
    },
    albums: [],
    collections: [],
    tags: [],
    characters: [],
    places: [],
    worldItems: [],
    concepts: [],
    prompts: [],
    notes: [],
    wildcards: [],
    properties: [],
    groups: []
  };

  describe('extendVideoTransform', () => {
    it('debería extender un video con sus relaciones', () => {
      const result = extendVideoTransform(mockVideoComplete);

      expect(result).toEqual({
        ...mockVideoComplete,
        metadata: expect.any(Object),
        thumbnailUrl: expect.any(String)
      });

      // Verificar que el metadata fue deserializado
      expect(result.metadata).toEqual({
        format: VideoFormat.MP4,
        codec: 'h264',
        bitrate: 5000000,
        frameRate: 30,
        aspectRatio: '16:9',
        hasAudio: true
      });
    });

    it('debería manejar un video sin metadata', () => {
      const videoSinMetadata = {
        ...mockVideoComplete,
        metadata: null
      };

      const result = extendVideoTransform(videoSinMetadata);

      expect(result.metadata).toEqual({});
    });
  });

  describe('extendVideoCompleteTransform', () => {
    it('debería extender un video con todos sus campos y relaciones', () => {
      const result = extendVideoCompleteTransform(mockVideoComplete);

      expect(result).toEqual({
        ...mockVideoComplete,
        metadata: expect.any(Object),
        thumbnailUrl: expect.any(String),
        playState: expect.any(Object),
        chapters: expect.any(Array)
      });
    });

    it('debería manejar un video sin relaciones opcionales', () => {
      const videoSinRelaciones = {
        ...mockVideoComplete,
        albums: undefined,
        tags: undefined
      };

      const result = extendVideoCompleteTransform(videoSinRelaciones);

      expect(result.albums).toEqual([]);
      expect(result.tags).toEqual([]);
    });
  });

  describe('toRelatedVideo', () => {
    it('debería transformar a formato de video relacionado', () => {
      const videoWithRelations: VideoWithRelationsComplete = {
        ...mockVideoComplete,
        metadata: {
          format: VideoFormat.MP4,
          codec: 'h264',
          bitrate: 5000000,
          frameRate: 30,
          aspectRatio: '16:9',
          hasAudio: true
        },
        thumbnailUrl: 'http://example.com/thumbnail.jpg'
      };

      const result = toRelatedVideo(videoWithRelations);

      expect(result).toEqual({
        id: videoWithRelations.id,
        name: videoWithRelations.name,
        thumbnailUrl: videoWithRelations.thumbnailUrl,
        duration: videoWithRelations.duration,
        count: expect.any(Number),
        strength: expect.any(Number)
      });
    });
  });

  describe('validateVideoData', () => {
    it('debería validar un video válido', () => {
      const result = validateVideoData(mockVideoComplete);

      expect(result).toEqual(mockVideoComplete);
    });

    it('debería lanzar error con datos inválidos', () => {
      const videoInvalido = {
        id: 'test-id',
        // Faltan campos requeridos
      };

      expect(() => validateVideoData(videoInvalido)).toThrow();
    });

    it('debería validar un video con campos mínimos', () => {
      const videoMinimo = {
        id: 'test-id',
        name: 'test-video.mp4',
        path: '/path/to/test-video.mp4',
        hash: 'test-hash',
        size: 1024000,
        duration: 120,
        width: 1920,
        height: 1080,
        folderId: 'folder-id',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      };

      const result = validateVideoData(videoMinimo);

      expect(result).toMatchObject({
        ...videoMinimo,
        description: null,
        metadata: null,
        thumbnail: null,
        thumbnailSize: null,
        thumbnailWidth: null,
        thumbnailHeight: null,
        isPublic: false,
        isFavorite: false
      });
    });
  });
});