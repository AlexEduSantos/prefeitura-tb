export interface ImageDimensionPreset {
  name: string;
  label: string;
  ratio: number; // width / height
  tolerance?: number; // default 0.15 (15%)
  minWidth?: number;
  minHeight?: number;
  description?: string;
}

export const IMAGE_PRESETS: Record<string, ImageDimensionPreset> = {
  story: {
    name: "story",
    label: "Story (9:16 Vertical)",
    ratio: 9 / 16, // 0.5625
    tolerance: 0.15,
    minWidth: 720,
    minHeight: 1280,
    description: "Recomendado para stories: proporção vertical 9:16 (ex: 1080x1920)",
  },
  "article-cover": {
    name: "article-cover",
    label: "Capa de Notícia/Artigo (16:9)",
    ratio: 16 / 9, // 1.777
    tolerance: 0.15,
    minWidth: 800,
    minHeight: 450,
    description: "Recomendado para capa: proporção horizontal 16:9 (ex: 1280x720 ou 1920x1080)",
  },
  avatar: {
    name: "avatar",
    label: "Avatar / Logo (1:1 Quadrado)",
    ratio: 1,
    tolerance: 0.08,
    minWidth: 200,
    minHeight: 200,
    description: "Recomendado para logo ou ícone: formato quadrado (1:1)",
  },
  gallery: {
    name: "gallery",
    label: "Galeria de Fotos (Horizontal)",
    ratio: 16 / 9,
    tolerance: 0.35,
    minWidth: 640,
    minHeight: 360,
    description: "Recomendado para slides de galeria: orientação preferencialmente horizontal",
  },
};

export interface DimensionValidationResult {
  isValid: boolean;
  actualWidth: number;
  actualHeight: number;
  actualRatio: number;
  warningMessage?: string;
}

export async function checkImageDimensions(
  src: string,
  presetOrRatio?: string | ImageDimensionPreset | { ratio: number; label: string },
): Promise<DimensionValidationResult | null> {
  if (!src) return null;

  const preset: ImageDimensionPreset | null =
    typeof presetOrRatio === "string"
      ? IMAGE_PRESETS[presetOrRatio] || null
      : (presetOrRatio as ImageDimensionPreset) || null;

  if (!preset) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const actualRatio = width / height;
      const tolerance = preset.tolerance ?? 0.15;
      const minRatio = preset.ratio * (1 - tolerance);
      const maxRatio = preset.ratio * (1 + tolerance);

      const ratioMatches = actualRatio >= minRatio && actualRatio <= maxRatio;
      const resolutionMatches =
        (!preset.minWidth || width >= preset.minWidth) &&
        (!preset.minHeight || height >= preset.minHeight);

      let warningMessage: string | undefined;

      if (!ratioMatches) {
        warningMessage = `A proporção da imagem (${width}x${height} - ${(width / height).toFixed(2)}) é diferente da recomendada para este local (${preset.label}). A imagem poderá sofrer cortes ou barras pretas.`;
      } else if (!resolutionMatches) {
        warningMessage = `A resolução da imagem (${width}x${height}px) é menor que a recomendada (mínimo ${preset.minWidth}x${preset.minHeight}px). Pode apresentar baixa nitidez.`;
      }

      resolve({
        isValid: ratioMatches && resolutionMatches,
        actualWidth: width,
        actualHeight: height,
        actualRatio,
        warningMessage,
      });
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = src;
  });
}

