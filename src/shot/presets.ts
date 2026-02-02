export interface ImagePreset {
    name: string;
    width: number;
    height: number;
    description: string;
}

export const imagePresets: Record<string, ImagePreset> = {
    og: {
        name: 'og',
        width: 1200,
        height: 630,
        description: 'Open Graph / Social Card (1200×630)',
    },
    infographic: {
        name: 'infographic',
        width: 1080,
        height: 1350,
        description: 'Infographic (1080×1350)',
    },
    poster: {
        name: 'poster',
        width: 1200,
        height: 1500,
        description: 'Poster (1200×1500)',
    },
    banner: {
        name: 'banner',
        width: 1600,
        height: 900,
        description: 'Banner (1600×900)',
    },
    twitter: {
        name: 'twitter',
        width: 1200,
        height: 675,
        description: 'Twitter Card (1200×675)',
    },
    youtube: {
        name: 'youtube',
        width: 1280,
        height: 720,
        description: 'YouTube Thumbnail (1280×720)',
    },
};

export function getPreset(name: string): ImagePreset {
    const preset = imagePresets[name];
    if (!preset) {
        throw new Error(`Unknown image preset: ${name}. Available: ${Object.keys(imagePresets).join(', ')}`);
    }
    return preset;
}
