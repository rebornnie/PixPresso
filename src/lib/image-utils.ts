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

export function getImageFormat(file: File): ImageFormat {
  const type = file.type as ImageFormat;
  if (type in FORMAT_EXTENSIONS) return type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function compressImage(
  imageSrc: string,
  format: ImageFormat,
  quality: number
): Promise<Blob> {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to compress image"));
      },
      format,
      quality / 100
    );
  });
}

export async function convertImage(
  imageSrc: string,
  targetFormat: ImageFormat,
  quality: number
): Promise<Blob> {
  return compressImage(imageSrc, targetFormat, quality);
}

export async function resizeImage(
  imageSrc: string,
  targetWidth: number,
  targetHeight: number,
  format: ImageFormat,
  quality: number
): Promise<Blob> {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d")!;

  // Contain mode: fit entire image within target, preserving aspect ratio
  const scale = Math.min(
    targetWidth / img.naturalWidth,
    targetHeight / img.naturalHeight
  );
  const scaledW = img.naturalWidth * scale;
  const scaledH = img.naturalHeight * scale;
  const offsetX = (targetWidth - scaledW) / 2;
  const offsetY = (targetHeight - scaledH) / 2;

  // Fill background white for JPG (no transparency)
  if (format === "image/jpeg") {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to resize image"));
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

  const tolSq = tolerance * tolerance;

  for (let i = 0; i < data.length; i += 4) {
    const dr = data[i] - sourceColor.r;
    const dg = data[i + 1] - sourceColor.g;
    const db = data[i + 2] - sourceColor.b;
    const distSq = dr * dr + dg * dg + db * db;

    if (distSq <= tolSq * 3) {
      data[i] = targetColor.r;
      data[i + 1] = targetColor.g;
      data[i + 2] = targetColor.b;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to process image"));
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

      const scaleX = img.naturalWidth / canvasWidth;
      const scaleY = img.naturalHeight / canvasHeight;
      const px = Math.floor(x * scaleX);
      const py = Math.floor(y * scaleY);

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
