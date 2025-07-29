/**
 * View Configuration System
 *
 * This module provides a unified configuration system for all file browser views.
 * It extends the existing view-specific configurations and provides a centralized
 * way to manage view settings, persistence, and customization.
 */

import { z } from 'zod';
import { ListColumnConfig } from './list-column-config';
import { GridViewConfig } from './grid-view-config';
import { CardsViewConfig } from './cards-view-config';
import { MasonryViewConfig } from './masonry-view-config';

// Base view types for file browser
export type FileBrowserViewType = 'list' | 'grid' | 'cards' | 'masonry';
export type ViewType = FileBrowserViewType; // Alias for compatibility

// Common view settings that apply to all views
export interface CommonViewSettings {
  /** Show thumbnails for supported file types */
  showThumbnails: boolean;
  /** Show metadata information */
  showMetadata: boolean;
  /** Show file tags */
  showTags: boolean;
  /** Show file statistics */
  showStats: boolean;
  /** Sort field */
  sortBy: string;
  /** Sort direction */
  sortDirection: 'asc' | 'desc';
  /** Enable animations */
  enableAnimations: boolean;
  /** Animation duration in milliseconds */
  animationDuration: number;
  /** Show hidden files */
  showHiddenFiles: boolean;
  /** Enable hover effects */
  enableHoverEffects: boolean;
}

// View-specific settings union
export type ViewSpecificSettings =
  | { type: 'list'; config: ListViewSettings }
  | { type: 'grid'; config?: GridViewConfig }
  | { type: 'cards'; config?: CardsViewConfig }
  | { type: 'masonry'; config?: MasonryViewConfig };

// List view specific settings (extends existing list column config)
export interface ListViewSettings {
  /** Column configurations */
  columns: ListColumnConfig[];
  /** Row height in pixels */
  rowHeight: number;
  /** Show zebra stripes */
  showZebraStripes: boolean;
  /** Show column headers */
  showHeaders: boolean;
  /** Enable column resizing */
  enableColumnResizing: boolean;
  /** Enable column reordering */
  enableColumnReordering: boolean;
  /** Compact mode */
  compactMode: boolean;
}

// Complete view configuration
export interface ViewConfiguration {
  /** View type identifier */
  type: FileBrowserViewType;
  /** Common settings for all views */
  common: CommonViewSettings;
  /** View-specific settings */
  specific: ViewSpecificSettings;
  /** Configuration metadata */
  metadata: ViewConfigurationMetadata;
}

// Configuration metadata
export interface ViewConfigurationMetadata {
  /** Configuration name/label */
  name: string;
  /** Configuration description */
  description?: string;
  /** Creation timestamp */
  createdAt: number;
  /** Last modified timestamp */
  lastModified: number;
  /** Configuration version */
  version: string;
  /** Whether this is a user-created configuration */
  isCustom: boolean;
  /** Whether this is the default configuration for the view type */
  isDefault: boolean;
}

// Preset configurations
export interface ViewPreset {
  /** Preset identifier */
  id: string;
  /** Preset name */
  name: string;
  /** Preset description */
  description: string;
  /** View configuration */
  configuration: ViewConfiguration;
  /** Preset category */
  category: 'default' | 'compact' | 'detailed' | 'custom';
  /** Supported entity types */
  supportedEntityTypes?: string[];
}

// View customization options
export interface ViewCustomizationOptions {
  /** Available themes */
  themes: ViewTheme[];
  /** Available color schemes */
  colorSchemes: ColorScheme[];
  /** Available density options */
  densityOptions: DensityOption[];
  /** Custom CSS classes */
  customClasses?: string[];
}

// Theme configuration
export interface ViewTheme {
  /** Theme identifier */
  id: string;
  /** Theme name */
  name: string;
  /** Theme CSS variables */
  variables: Record<string, string>;
  /** Dark mode support */
  supportsDarkMode: boolean;
}

// Color scheme
export interface ColorScheme {
  /** Scheme identifier */
  id: string;
  /** Scheme name */
  name: string;
  /** Primary color */
  primary: string;
  /** Secondary color */
  secondary: string;
  /** Accent color */
  accent: string;
  /** Background color */
  background: string;
  /** Text color */
  text: string;
}

// Density options
export interface DensityOption {
  /** Density identifier */
  id: string;
  /** Density name */
  name: string;
  /** Spacing multiplier */
  spacingMultiplier: number;
  /** Size multiplier */
  sizeMultiplier: number;
}

// Configuration validation schemas
export const CommonViewSettingsSchema = z.object({
  showThumbnails: z.boolean().default(true),
  showMetadata: z.boolean().default(true),
  showTags: z.boolean().default(true),
  showStats: z.boolean().default(false),
  sortBy: z.string().default('name'),
  sortDirection: z.enum(['asc', 'desc']).default('asc'),
  enableAnimations: z.boolean().default(true),
  animationDuration: z.number().min(0).max(1000).default(200),
  showHiddenFiles: z.boolean().default(false),
  enableHoverEffects: z.boolean().default(true),
});

export const ListViewSettingsSchema = z.object({
  columns: z.array(z.any()).default([]), // Will be validated by ListColumnConfig schema
  rowHeight: z.number().min(20).max(200).default(40),
  showZebraStripes: z.boolean().default(true),
  showHeaders: z.boolean().default(true),
  enableColumnResizing: z.boolean().default(true),
  enableColumnReordering: z.boolean().default(true),
  compactMode: z.boolean().default(false),
});

export const ViewConfigurationMetadataSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  createdAt: z.number(),
  lastModified: z.number(),
  version: z.string().default('1.0.0'),
  isCustom: z.boolean().default(false),
  isDefault: z.boolean().default(false),
});

export const ViewConfigurationSchema = z.object({
  type: z.enum(['list', 'grid', 'cards', 'masonry']),
  common: CommonViewSettingsSchema,
  specific: z.union([
    z.object({ type: z.literal('list'), config: ListViewSettingsSchema }),
    z.object({ type: z.literal('grid'), config: z.any().optional() }), // GridViewConfig schema
    z.object({ type: z.literal('cards'), config: z.any().optional() }), // CardsViewConfig schema
    z.object({ type: z.literal('masonry'), config: z.any().optional() }), // MasonryViewConfig schema
  ]),
  metadata: ViewConfigurationMetadataSchema,
});

// Default configurations for each view type
export const DEFAULT_COMMON_SETTINGS: CommonViewSettings = {
  showThumbnails: true,
  showMetadata: true,
  showTags: true,
  showStats: false,
  sortBy: 'name',
  sortDirection: 'asc',
  enableAnimations: true,
  animationDuration: 200,
  showHiddenFiles: false,
  enableHoverEffects: true,
};

export const DEFAULT_LIST_SETTINGS: ListViewSettings = {
  columns: [],
  rowHeight: 40,
  showZebraStripes: true,
  showHeaders: true,
  enableColumnResizing: true,
  enableColumnReordering: true,
  compactMode: false,
};

// Configuration factory functions
export function createDefaultViewConfiguration(type: FileBrowserViewType): ViewConfiguration {
  const now = Date.now();

  const baseConfig: Omit<ViewConfiguration, 'specific'> = {
    type,
    common: DEFAULT_COMMON_SETTINGS,
    metadata: {
      name: `Default ${type.charAt(0).toUpperCase() + type.slice(1)} View`,
      description: `Default configuration for ${type} view`,
      createdAt: now,
      lastModified: now,
      version: '1.0.0',
      isCustom: false,
      isDefault: true,
    },
  };

  switch (type) {
    case 'list':
      return {
        ...baseConfig,
        specific: {
          type: 'list',
          config: DEFAULT_LIST_SETTINGS,
        },
      };
    case 'grid':
      return {
        ...baseConfig,
        specific: {
          type: 'grid',
          config: {} as GridViewConfig, // Will be filled by GridViewConfig defaults
        },
      };
    case 'cards':
      return {
        ...baseConfig,
        specific: {
          type: 'cards',
          config: {} as CardsViewConfig, // Will be filled by CardsViewConfig defaults
        },
      };
    case 'masonry':
      return {
        ...baseConfig,
        specific: {
          type: 'masonry',
          config: {} as MasonryViewConfig, // Will be filled by MasonryViewConfig defaults
        },
      };
    default:
      throw new Error(`Unknown view type: ${type}`);
  }
}

// Configuration utilities
export function validateViewConfiguration(config: unknown): ViewConfiguration {
  return ViewConfigurationSchema.parse(config);
}

export function mergeViewConfigurations(
  base: ViewConfiguration,
  override: Partial<ViewConfiguration>
): ViewConfiguration {
  return {
    ...base,
    ...override,
    common: {
      ...base.common,
      ...override.common,
    },
    metadata: {
      ...base.metadata,
      ...override.metadata,
      lastModified: Date.now(),
    },
  };
}

export function cloneViewConfiguration(config: ViewConfiguration): ViewConfiguration {
  return JSON.parse(JSON.stringify(config));
}

// Animation configuration
export interface AnimationConfig {
  /** Enable animations globally */
  enabled: boolean;
  /** Default animation duration in milliseconds */
  duration: number;
  /** Default easing function */
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  /** Reduce motion for users with vestibular disorders */
  reduceMotion?: boolean;
  /** Animation type configurations */
  types: {
    hover: {
      enabled: boolean;
      duration: number;
      scale: number;
    };
    selection: {
      enabled: boolean;
      duration: number;
      highlightColor: string;
    };
    loading: {
      enabled: boolean;
      duration: number;
      type: 'spinner' | 'pulse' | 'skeleton';
    };
    viewTransition: {
      enabled: boolean;
      duration: number;
      type: 'fade' | 'slide' | 'scale';
    };
  };
}

// Accessibility configuration
export interface AccessibilityConfig {
  /** Enable keyboard navigation */
  keyboardNavigation: boolean;
  /** Enable screen reader announcements */
  screenReaderAnnouncements: boolean;
  /** Enable high contrast mode */
  highContrast: boolean;
  /** Reduce motion for users with vestibular disorders */
  reduceMotion: boolean;
  /** Use larger fonts */
  largeFonts: boolean;
  /** Show focus indicators */
  focusIndicators?: boolean;
  /** Use large text */
  largeText?: boolean;
  /** Text scale factor */
  textScale?: number;
  /** Enable descriptive tooltips */
  descriptiveTooltips?: boolean;
  /** Enable audio feedback */
  audioFeedback?: boolean;
  /** Audio volume level */
  audioVolume?: number;
  /** Enable screen reader support */
  screenReader?: boolean;
  /** Additional accessibility features */
  features?: string[];
  /** Focus indicator settings */
  focus: {
    showIndicators: boolean;
    indicatorColor: string;
    indicatorWidth: number;
  };
}

// Performance configuration
export interface PerformanceConfig {
  /** Maximum number of items to render at once */
  maxRenderItems: number;
  /** Enable virtualization for large lists */
  virtualization: boolean;
  /** Virtualization buffer size */
  virtualizationBuffer: number;
  /** Buffer size for additional items */
  bufferSize?: number;
  /** Enable lazy loading for thumbnails */
  lazyThumbnails: boolean;
  /** Thumbnail quality setting */
  thumbnailQuality: 'low' | 'medium' | 'high';
  /** Enable thumbnail cache */
  thumbnailCache?: boolean;
  /** Maximum cache size in MB */
  maxCacheSize?: number;
  /** Enable item preloading */
  preloadItems?: boolean;
  /** Maximum FPS for animations */
  maxFPS?: number;
  /** Scroll debounce time */
  scrollDebounce?: number;
  /** Enable lazy loading */
  lazyLoading?: boolean;
  /** Memory limit in MB */
  memoryLimit?: number;
  /** Enable automatic cleanup */
  autoCleanup?: boolean;
  /** Batch processing size */
  batchSize?: number;
  /** Performance optimizations */
  optimizations?: string[];
  /** Enable virtual scrolling */
  virtualScrolling: boolean;
  /** Enable lazy image loading */
  lazyImageLoading: boolean;
  /** Cache strategy */
  cacheStrategy: 'memory' | 'disk' | 'hybrid';
  /** Maximum memory usage in MB */
  maxMemoryUsage: number;
  /** Compression level */
  compressionLevel: number;
  /** Cache settings */
  cache: {
    thumbnails: boolean;
    maxSize: number;
    ttl: number;
  };
  /** Debounce settings */
  debounce: {
    search: number;
    resize: number;
    scroll: number;
  };
}

// Global view configuration
export interface GlobalViewConfig {
  /** Animation settings */
  animations: AnimationConfig;
  /** Default view mode */
  defaultViewMode: FileBrowserViewType;
  /** Default view */
  defaultView?: string;
  /** Remember view per folder */
  rememberViewPerFolder?: boolean;
  /** Sync settings */
  syncSettings?: boolean;
  /** Accessibility settings */
  accessibility: AccessibilityConfig;
  /** Performance settings */
  performance: PerformanceConfig;
  /** Experimental features */
  experimentalFeatures?: string[];
  /** Preferred view */
  preferredView?: string;
  /** Default sort */
  defaultSort?: { field: string; direction: 'asc' | 'desc' };
  /** Show thumbnails */
  showThumbnails?: boolean;
  /** Show metadata */
  showMetadata?: boolean;
  /** Visible fields */
  visibleFields?: string[];
  /** Custom options */
  customOptions?: Record<string, any>;
  /** Entity type configurations */
  entityTypeConfigs?: Record<string, EntityViewConfig>;
  /** Theme settings */
  theme: {
    mode: 'light' | 'dark' | 'auto';
    colorScheme: string;
    customColors?: Record<string, string>;
  };
  /** Layout settings */
  layout: {
    sidebar: {
      enabled: boolean;
      width: number;
      position: 'left' | 'right';
    };
    toolbar: {
      enabled: boolean;
      position: 'top' | 'bottom';
      compact: boolean;
    };
    statusBar: {
      enabled: boolean;
      showItemCount: boolean;
      showSelectionInfo: boolean;
    };
  };
}

// Entity-specific configuration
export interface EntityViewConfig {
  /** Entity type */
  entityType: string;
  /** View configuration for this entity type */
  viewConfig: ViewConfiguration;
  /** Experimental features */
  experimentalFeatures?: string[];
  /** Preferred view */
  preferredView?: string;
  /** Default sort */
  defaultSort?: { field: string; direction: 'asc' | 'desc' };
  /** Show thumbnails */
  showThumbnails?: boolean;
  /** Show metadata */
  showMetadata?: boolean;
  /** Visible fields */
  visibleFields?: string[];
  /** Custom options */
  customOptions?: Record<string, any>;
  /** Custom display settings */
  display: {
    showPreview: boolean;
    previewSize: 'small' | 'medium' | 'large';
    showMetadata: boolean;
    metadataFields: string[];
  };
}

// Configuration preset
export interface ViewConfigurationPreset {
  /** Preset identifier */
  id: string;
  /** Preset name */
  name: string;
  /** Preset description */
  description: string;
  /** Preset category */
  category: 'default' | 'compact' | 'detailed' | 'performance' | 'accessibility' | 'custom';
  /** Global configuration */
  globalConfig: GlobalViewConfig;
  /** Entity-specific configurations */
  entityConfigs: EntityViewConfig[];
  /** Preset metadata */
  metadata: {
    author: string;
    version: string;
    createdAt: number;
    lastModified: number;
    tags: string[];
  };
}

// All types are already exported with their definitions above