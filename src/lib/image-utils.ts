export type ImageFormat = "image/jpeg" | "image/png" | "image/webp";

export const FORMAT_EXTENSIONS: Record<ImageFormat, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const FORMAT_LABELS: Record<ImageFormat, string> = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WebP",
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function getImageFormat(file: File): ImageFormat | null {
  const type = file.type as ImageFormat;
  if (type in FORMAT_EXTENSIONS) return type;
  if (file.type) return null;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return null;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function encodeImage(
  img: HTMLImageElement,
  width: number,
  height: number,
  format: ImageFormat,
  quality: number
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  if (format === "image/jpeg") {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Failed to compress image"));
        else if (blob.type !== format) reject(new Error("Unsupported output format"));
        else resolve(blob);
      },
      format,
      quality / 100
    );
  });
}

export async function compressImage(
  imageSrc: string,
  format: ImageFormat,
  quality: number
): Promise<Blob> {
  const img = await loadImage(imageSrc);
  return encodeImage(img, img.naturalWidth, img.naturalHeight, format, quality);
}

export async function convertImage(
  imageSrc: string,
  targetFormat: ImageFormat,
  quality: number
): Promise<Blob> {
  return compressImage(imageSrc, targetFormat, quality);
}

export interface TargetSizeResult {
  blob: Blob;
  quality: number;
  scale: number;
  achieved: boolean;
}

const TARGET_SIZE_MAX_ROUNDS = 6;
const TARGET_SIZE_SCALE_STEP = 0.85;
const TARGET_SIZE_MIN_DIMENSION = 64;

// Industry-standard target-size compression: binary search for the highest
// quality that fits, then shrink dimensions as a fallback. The result is at
// most the target size, never an exact match.
export async function compressToTargetSize(
  imageSrc: string,
  format: ImageFormat,
  targetBytes: number
): Promise<TargetSizeResult> {
  if (!Number.isFinite(targetBytes) || targetBytes <= 0) {
    throw new Error("Invalid target size");
  }
  const img = await loadImage(imageSrc);
  let smallest: TargetSizeResult | null = null;

  for (let round = 0; round < TARGET_SIZE_MAX_ROUNDS; round++) {
    const scale = TARGET_SIZE_SCALE_STEP ** round;
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    let lo = 1;
    let hi = 100;
    let best: { blob: Blob; quality: number } | null = null;
    while (lo <= hi) {
      const quality = Math.floor((lo + hi) / 2);
      const blob = await encodeImage(img, width, height, format, quality);
      if (!smallest || blob.size < smallest.blob.size) {
        smallest = { blob, quality, scale, achieved: false };
      }
      if (blob.size <= targetBytes) {
        best = { blob, quality };
        lo = quality + 1;
      } else {
        hi = quality - 1;
      }
    }

    if (best) {
      return { blob: best.blob, quality: best.quality, scale, achieved: true };
    }
    if (Math.min(width, height) <= TARGET_SIZE_MIN_DIMENSION) break;
  }

  return smallest!;
}

export type ResizeMode = "contain" | "cover";

export function isValidImageSize(width: number, height: number): boolean {
  return Number.isInteger(width) && Number.isInteger(height) &&
    width >= 1 && width <= 10000 && height >= 1 && height <= 10000;
}

export async function resizeImage(
  imageSrc: string,
  targetWidth: number,
  targetHeight: number,
  format: ImageFormat,
  quality: number,
  mode: ResizeMode = "contain"
): Promise<Blob> {
  if (!isValidImageSize(targetWidth, targetHeight)) {
    throw new Error("Invalid target dimensions");
  }
  const img = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d")!;

  // Fill background white for JPG (no transparency)
  if (format === "image/jpeg") {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  if (mode === "contain") {
    // Contain mode: fit entire image within target, preserving aspect ratio (may have padding)
    const scale = Math.min(
      targetWidth / img.naturalWidth,
      targetHeight / img.naturalHeight
    );
    const scaledW = img.naturalWidth * scale;
    const scaledH = img.naturalHeight * scale;
    const offsetX = (targetWidth - scaledW) / 2;
    const offsetY = (targetHeight - scaledH) / 2;

    ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);
  } else {
    // Cover mode: fill entire target area, cropping overflow (no padding)
    const scale = Math.max(
      targetWidth / img.naturalWidth,
      targetHeight / img.naturalHeight
    );
    const scaledW = img.naturalWidth * scale;
    const scaledH = img.naturalHeight * scale;
    const offsetX = (targetWidth - scaledW) / 2;
    const offsetY = (targetHeight - scaledH) / 2;

    ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Failed to resize image"));
        else if (blob.type !== format) reject(new Error("Unsupported output format"));
        else resolve(blob);
      },
      format,
      quality / 100
    );
  });
}

export async function replaceBackgroundColor(
  imageSrc: string,
  sourceColor: { r: number; g: number; b: number },
  targetColor: { r: number; g: number; b: number },
  tolerance: number,
  format: ImageFormat,
  quality: number
): Promise<Blob> {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const tolSq = tolerance * tolerance * 3; // Multiply by 3 for RGB distance (3 channels)

  for (let i = 0; i < data.length; i += 4) {
    const dr = data[i] - sourceColor.r;
    const dg = data[i + 1] - sourceColor.g;
    const db = data[i + 2] - sourceColor.b;
    const distSq = dr * dr + dg * dg + db * db;

    if (distSq <= tolSq) {
      data[i] = targetColor.r;
      data[i + 1] = targetColor.g;
      data[i + 2] = targetColor.b;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Failed to process image"));
        else if (blob.type !== format) reject(new Error("Unsupported output format"));
        else resolve(blob);
      },
      format,
      quality / 100
    );
  });
}

export function pickColorFromImage(
  imageSrc: string,
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number
): Promise<{ r: number; g: number; b: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      // The preview uses object-contain: the image is scaled uniformly and
      // centered, so account for letterbox bars before mapping coordinates.
      const scale = Math.min(
        canvasWidth / img.naturalWidth,
        canvasHeight / img.naturalHeight
      );
      const drawnW = img.naturalWidth * scale;
      const drawnH = img.naturalHeight * scale;
      const offsetX = (canvasWidth - drawnW) / 2;
      const offsetY = (canvasHeight - drawnH) / 2;
      const px = Math.min(
        Math.max(Math.floor((x - offsetX) / scale), 0),
        img.naturalWidth - 1
      );
      const py = Math.min(
        Math.max(Math.floor((y - offsetY) / scale), 0),
        img.naturalHeight - 1
      );

      const pixel = ctx.getImageData(px, py, 1, 1).data;
      resolve({ r: pixel[0], g: pixel[1], b: pixel[2] });
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
