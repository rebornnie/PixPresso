"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Download, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageUpload, type ImageInfo } from "@/components/image-upload";
import {
  resizeImage,
  formatFileSize,
  downloadBlob,
  FORMAT_EXTENSIONS,
} from "@/lib/image-utils";

const PRESETS = [
  { key: "avatar", w: 128, h: 128 },
  { key: "thumbnail", w: 256, h: 256 },
  { key: "socialCover", w: 1200, h: 630 },
  { key: "phoneWallpaper", w: 1080, h: 1920 },
  { key: "idPhoto1inch", w: 295, h: 413 },
  { key: "idPhoto2inch", w: 413, h: 579 },
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
  const [processing, setProcessing] = useState(false);
  const previewUrlRef = useRef<string | null>(null);

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

  const applyPreset = (w: number, h: number) => {
    setLockRatio(false);
    setWidth(w);
    setHeight(h);
  };

  const processImage = useCallback(async () => {
    if (!imageInfo || width <= 0 || height <= 0) return;
    setProcessing(true);
    try {
      const blob = await resizeImage(
        imageInfo.url,
        Math.round(width),
        Math.round(height),
        imageInfo.format,
        90
      );
      setResizedBlob(blob);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;
      setPreviewUrl(url);
    } finally {
      setProcessing(false);
    }
  }, [imageInfo, width, height]);

  useEffect(() => {
    if (imageInfo && width > 0 && height > 0) {
      const timer = setTimeout(processImage, 300);
      return () => clearTimeout(timer);
    }
  }, [imageInfo, width, height, processImage]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  const handleDownload = () => {
    if (!resizedBlob || !imageInfo) return;
    const ext = FORMAT_EXTENSIONS[imageInfo.format];
    const baseName = imageInfo.file.name.replace(/\.[^.]+$/, "");
    downloadBlob(resizedBlob, `${baseName}_${width}x${height}.${ext}`);
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
                        onClick={() => applyPreset(p.w, p.h)}
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

                  {resizedBlob && (
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
                          {width} x {height} · {formatFileSize(resizedBlob.size)}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button onClick={handleDownload} disabled={!resizedBlob || processing} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    {processing ? t("title") + "..." : t("download")}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2">
            {previewUrl && (
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
                      src={previewUrl}
                      alt="Resized preview"
                      className="w-full object-contain max-h-[500px]"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
