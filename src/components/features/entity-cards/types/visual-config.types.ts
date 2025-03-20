import { z } from 'zod';
import type { 
    Prisma,
    FolderVisualConfig as PrismaFolderVisualConfig,
    ImageVisualConfig as PrismaImageVisualConfig,
    VideoVisualConfig as PrismaVideoVisualConfig
} from '@prisma/client';

export interface DesignSystemConfig {
    preset: string;
    cornerStyle: string;
    elevation: number;
}

export interface VisualConfigBase {
    enable3DEffect: boolean;
    designSystem: DesignSystemConfig | null;
    enableHolographicEffect: boolean;
    enableGlowEffect: boolean;
    enableAnimatedBorder: boolean;
    enableLightHalo: boolean;
    effects: string | null;
    layerSystem: {
        layers: Array<{
            id: string;
            type: string;
            visible: boolean;
            opacity: number;
        }>;
    };
    states: {
        hover: boolean;
        focus: boolean;
        active: boolean;
    };
}

export interface FolderVisualConfig extends VisualConfigBase {
    folder: Prisma.FolderWhereUniqueInput;
}

export interface ImageVisualConfig extends VisualConfigBase {
    image: Prisma.ImageWhereUniqueInput;
}

export interface VideoVisualConfig extends VisualConfigBase {
    video: Prisma.VideoWhereUniqueInput;
}

export type VisualConfig = FolderVisualConfig | ImageVisualConfig | VideoVisualConfig;

export const designSystemSchema = z.object({
    preset: z.string(),
    cornerStyle: z.string(),
    elevation: z.number(),
});

export const visualConfigSchema = z.object({
    enable3DEffect: z.boolean(),
    designSystem: designSystemSchema.nullable(),
    enableHolographicEffect: z.boolean(),
    enableGlowEffect: z.boolean(),
    enableAnimatedBorder: z.boolean(),
    enableLightHalo: z.boolean(),
    effects: z.string().nullable(),
    layerSystem: z.object({
        layers: z.array(z.object({
            id: z.string(),
            type: z.string(),
            visible: z.boolean(),
            opacity: z.number(),
        })),
    }),
    states: z.object({
        hover: z.boolean(),
        focus: z.boolean(),
        active: z.boolean(),
    }),
});
