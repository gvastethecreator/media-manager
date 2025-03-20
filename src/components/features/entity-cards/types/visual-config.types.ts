export interface DesignSystemConfig {
    preset: string;
    cornerStyle: string;
    elevation: number;
}

export interface VisualConfigBase {
    enable3DEffect: boolean;
    designSystem: DesignSystemConfig;
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
    folder: string;
}

export interface ImageVisualConfig extends VisualConfigBase {
    image: string;
}

export interface VideoVisualConfig extends VisualConfigBase {
    video: string;
}
