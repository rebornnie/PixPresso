"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageUpload, type ImageInfo } from "@/components/image-upload";
import { DownloadButton } from "@/components/download-button";
import { PreviewEmptyState } from "@/components/preview-empty-state";
import {
  resizeImage,
  isValidImageSize,
  formatFileSize,
  downloadBlob,
  FORMAT_EXTENSIONS,
  type ResizeMode,
} from "@/lib/image-utils";

const PRESETS = [
  { key: "avatar", w: 128, h: 128, mode: "cover" as ResizeMode },
  { key: "thumbnail", w: 256, h: 256, mode: "cover" as ResizeMode },
  { key: "socialCover", w: 1200, h: 630, mode: "contain" as ResizeMode },
  { key: "phoneWallpaper", w: 1080, h: 1920, mode: "contain" as ResizeMode },
  { key: "idPhoto1inch", w: 295, h: 413, mode: "cover" as ResizeMode },
  { key: "idPhoto2inch", w: 413, h: 579, mode: "cover" as ResizeMode },
] as const;

export default function ResizePage() {
  const t = useTranslations("resize");
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockRatio, setLockRatio] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [resizedBlob, setResizedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedKey, setProcessedKey] = useState("");
  const [errorKey, setErrorKey] = useState("");
  const [resizeMode, setResizeMode] = useState<ResizeMode>("contain");
  const previewUrlRef = useRef<string | null>(null);
  const requestKey = imageInfo ? `${imageInfo.url}|${width}|${height}|${resizeMode}` : "";
  const validSize = isValidImageSize(width, height);
  const currentBlob = processedKey === requestKey ? resizedBlob : null;
  // Stats keep showing the last result for the current image while a new
  // one is pending, so the layout below the controls doesn't shift.
  const statsBlob =
    imageInfo && resizedBlob && processedKey.startsWith(`${imageInfo.url}|`)
      ? resizedBlob
      : null;
  // Keep showing the last processed frame while a new one is pending;
  // only hide it when it belongs to a different image.
  const currentPreview =
    imageInfo && previewUrl && processedKey.startsWith(`${imageInfo.url}|`)
      ? previewUrl
      : null;
  const processing = !!imageInfo && validSize && processedKey !== requestKey && errorKey !== requestKey;

  const handleImageLoad = useCallback((info: ImageInfo) => {
    setImageInfo(info);
    setWidth(info.width);
    setHeight(info.height);
    setAspectRatio(info.width / info.height);
  }, []);

  const handleWidthChange = (w: number) => {
    setWidth(w);
    if (lockRatio && w > 0) {
      setHeight(Math.round(w / aspectRatio));
    }
  };

  const handleHeightChange = (h: number) => {
    setHeight(h);
    if (lockRatio && h > 0) {
      setWidth(Math.round(h * aspectRatio));
    }
  };

  const applyPreset = (w: number, h: number, mode: ResizeMode) => {
    setLockRatio(false);
    setWidth(w);
    setHeight(h);
    setResizeMode(mode);
  };

  const processImage = useCallback(async (isCurrent: () => boolean) => {
    if (!imageInfo || !validSize) return;
    try {
      const blob = await resizeImage(
        imageInfo.url,
        Math.round(width),
        Math.round(height),
        imageInfo.format,
        90,
        resizeMode
      );
      if (!isCurrent()) return;
      setResizedBlob(blob);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;
      setPreviewUrl(url);
      setProcessedKey(requestKey);
      setErrorKey("");
    } catch {
      if (isCurrent()) setErrorKey(requestKey);
    }
  }, [imageInfo, width, height, resizeMode, validSize, requestKey]);

  useEffect(() => {
    if (imageInfo && validSize) {
      let active = true;
      const timer = setTimeout(() => { void processImage(() => active); }, 300);
      return () => { active = false; clearTimeout(timer); };
    }
  }, [imageInfo, validSize, processImage]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  const handleDownload = () => {
    if (!currentBlob || !imageInfo) return;
    const ext = FORMAT_EXTENSIONS[imageInfo.format];
    const baseName = imageInfo.file.name.replace(/\.[^.]+$/, "");
    downloadBlob(currentBlob, `${baseName}_${width}x${height}.${ext}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-muted-foreground mb-6">{t("description")}</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <ImageUpload onImageLoad={handleImageLoad} imageInfo={imageInfo} />
              </CardContent>
            </Card>

            {imageInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("presets")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {PRESETS.map((p) => (
                      <Button
                        key={p.key}
                        variant={width === p.w && height === p.h ? "default" : "outline"}
                        size="sm"
                        className="text-xs"
                        onClick={() => applyPreset(p.w, p.h, p.mode)}
                      >
                        {t(`preset.${p.key}`)}
                        <br />
                        <span className="text-[10px] opacity-70">
                          {p.w}x{p.h}
                        </span>
                      </Button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Label className="text-xs">{t("width")}</Label>
                        <Input
                          type="number"
                          value={width || ""}
                          onChange={(e) => handleWidthChange(Number(e.target.value) || 0)}
                          min={1}
                          max={10000}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mt-5 h-8 w-8"
                        onClick={() => setLockRatio(!lockRatio)}
                      >
                        {lockRatio ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <Unlock className="h-4 w-4" />
                        )}
                      </Button>
                      <div className="flex-1">
                        <Label className="text-xs">{t("height")}</Label>
                        <Input
                          type="number"
                          value={height || ""}
                          onChange={(e) => handleHeightChange(Number(e.target.value) || 0)}
                          min={1}
                          max={10000}
                        />
                      </div>
                    </div>
                  </div>

                  {!validSize && <p role="alert" className="text-sm text-destructive">{t("invalidSize")}</p>}
                  {statsBlob && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("original")}:</span>
                        <span className="font-medium">
                          {imageInfo.width} x {imageInfo.height}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("resized")}:</span>
                        <span className="font-medium">
                          {width} x {height} · {formatFileSize(statsBlob.size)}
                        </span>
                      </div>
                    </div>
                  )}

                  <DownloadButton
                    onDownload={handleDownload}
                    disabled={!currentBlob}
                    processing={processing}
                    label={t("download")}
                  />
                  {errorKey === requestKey && <p role="alert" className="text-sm text-destructive">{t("error")}</p>}

                  <div className="text-xs text-muted-foreground text-center">
                    {t("modeLabel")}: {t(`mode.${resizeMode}`)}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2">
            {currentPreview ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t("resized")}: {width} x {height}
                    {processing && (
                      <Badge variant="secondary" className="ml-2">
                        ...
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg overflow-hidden border bg-muted/20">
                    <img
                      src={currentPreview}
                      alt="Resized preview"
                      className="w-full object-contain max-h-[500px]"
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (<PreviewEmptyState />)}
          </div>
        </div>
      </div>
    </div>
  );
}
