"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageUpload, type ImageInfo } from "@/components/image-upload";
import { DownloadButton } from "@/components/download-button";
import { PreviewEmptyState } from "@/components/preview-empty-state";
import {
  compressImage,
  compressToTargetSize,
  formatFileSize,
  downloadBlob,
  FORMAT_EXTENSIONS,
  type ImageFormat,
} from "@/lib/image-utils";

export default function CompressPage() {
  const t = useTranslations("compress");
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [mode, setMode] = useState<"quality" | "size">("quality");
  const [quality, setQuality] = useState(80);
  const [targetValue, setTargetValue] = useState("500");
  const [targetUnit, setTargetUnit] = useState<"KB" | "MB">("KB");
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedKey, setProcessedKey] = useState("");
  const [errorKey, setErrorKey] = useState("");
  const [unmetKey, setUnmetKey] = useState("");
  const previewUrlRef = useRef<string | null>(null);
  const parsedTarget = Number(targetValue);
  const targetBytes =
    Number.isFinite(parsedTarget) && parsedTarget > 0
      ? Math.round(parsedTarget * (targetUnit === "MB" ? 1024 * 1024 : 1024))
      : 0;
  const requestKey = imageInfo
    ? `${imageInfo.url}|${mode}|${mode === "quality" ? quality : targetBytes}`
    : "";
  const currentBlob = processedKey === requestKey ? compressedBlob : null;
  // Stats keep showing the last result for the current image while a new
  // one is pending, so the layout below the slider doesn't shift.
  const statsBlob =
    imageInfo && compressedBlob && processedKey.startsWith(`${imageInfo.url}|`)
      ? compressedBlob
      : null;
  // Keep showing the last processed frame while a new one is pending;
  // only hide it when it belongs to a different image.
  const currentPreview =
    imageInfo && previewUrl && processedKey.startsWith(`${imageInfo.url}|`)
      ? previewUrl
      : null;
  const processing = !!imageInfo && processedKey !== requestKey && errorKey !== requestKey && (mode === "quality" || targetBytes > 0);

  // PNG is lossless and ignores the quality parameter in canvas.toBlob,
  // so we compress as JPEG to make quality-based compression work.
  const getOutputFormat = (format: ImageFormat): ImageFormat =>
    format === "image/png" ? "image/jpeg" : format;

  const processImage = useCallback(async (isCurrent: () => boolean) => {
    if (!imageInfo) return;
    if (mode === "size" && !targetBytes) return;
    try {
      let blob: Blob;
      let unmet = false;
      if (mode === "size") {
        const result = await compressToTargetSize(
          imageInfo.url,
          getOutputFormat(imageInfo.format),
          targetBytes
        );
        blob = result.blob;
        unmet = !result.achieved;
      } else if (quality === 100) {
        // Quality 100 = no compression, use original file as-is
        blob = imageInfo.file;
      } else {
        const outputFormat = getOutputFormat(imageInfo.format);
        blob = await compressImage(imageInfo.url, outputFormat, quality);
      }
      if (!isCurrent()) return;
      setCompressedBlob(blob);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const useOriginal = mode === "quality" && quality === 100;
      const url = useOriginal ? imageInfo.url : URL.createObjectURL(blob);
      previewUrlRef.current = useOriginal ? null : url;
      setPreviewUrl(url);
      setProcessedKey(requestKey);
      setErrorKey("");
      setUnmetKey(unmet ? requestKey : "");
    } catch {
      if (isCurrent()) setErrorKey(requestKey);
    }
  }, [imageInfo, quality, mode, targetBytes, requestKey]);

  useEffect(() => {
    if (imageInfo) {
      let active = true;
      const timer = setTimeout(() => { void processImage(() => active); }, 200);
      return () => { active = false; clearTimeout(timer); };
    }
  }, [imageInfo, quality, mode, targetBytes, processImage]);

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
    if (mode === "quality" && quality === 100) {
      downloadBlob(currentBlob, imageInfo.file.name);
    } else {
      const outputFormat = getOutputFormat(imageInfo.format);
      const ext = FORMAT_EXTENSIONS[outputFormat];
      const baseName = imageInfo.file.name.replace(/\.[^.]+$/, "");
      downloadBlob(currentBlob, `${baseName}_compressed.${ext}`);
    }
  };

  const reduction =
    imageInfo && statsBlob
      ? Math.round((1 - statsBlob.size / imageInfo.file.size) * 100)
      : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-muted-foreground mb-6">{t("description")}</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Controls */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <ImageUpload onImageLoad={setImageInfo} imageInfo={imageInfo} />
              </CardContent>
            </Card>

            {imageInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {mode === "quality" ? t("quality") : t("targetSize")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={mode === "quality" ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setMode("quality")}
                    >
                      {t("modeQuality")}
                    </Button>
                    <Button
                      type="button"
                      variant={mode === "size" ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setMode("size")}
                    >
                      {t("modeSize")}
                    </Button>
                  </div>

                  {mode === "quality" && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>1</Label>
                        <Badge variant="secondary">{quality}</Badge>
                        <Label>100</Label>
                      </div>
                      <Slider
                        value={[quality]}
                        onValueChange={(v) => setQuality(Array.isArray(v) ? v[0] : v)}
                        min={1}
                        max={100}
                        step={1}
                      />
                    </div>
                  )}

                  {mode === "size" && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min={1}
                          value={targetValue}
                          onChange={(e) => setTargetValue(e.target.value)}
                        />
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant={targetUnit === "KB" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setTargetUnit("KB")}
                          >
                            KB
                          </Button>
                          <Button
                            type="button"
                            variant={targetUnit === "MB" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setTargetUnit("MB")}
                          >
                            MB
                          </Button>
                        </div>
                      </div>
                      {!targetBytes && (
                        <p className="text-sm text-destructive">{t("invalidTarget")}</p>
                      )}
                    </div>
                  )}

                  {statsBlob && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("original")}:</span>
                        <span className="font-medium">{formatFileSize(imageInfo.file.size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("compressed")}:</span>
                        <span className="font-medium">{formatFileSize(statsBlob.size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("reduction")}:</span>
                        <Badge variant={reduction > 0 ? "default" : "secondary"}>
                          {reduction > 0 ? `-${reduction}%` : `+${Math.abs(reduction)}%`}
                        </Badge>
                      </div>
                    </div>
                  )}

                  <DownloadButton
                    onDownload={handleDownload}
                    disabled={!currentBlob}
                    processing={processing}
                    label={t("download")}
                  />
                  {unmetKey === requestKey && currentBlob && (
                    <p className="text-xs text-muted-foreground">
                      {t("targetUnmet", { size: formatFileSize(currentBlob.size) })}
                    </p>
                  )}
                  {errorKey === requestKey && <p role="alert" className="text-sm text-destructive">{t("error")}</p>}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Preview */}
          <div className="lg:col-span-2">
            {currentPreview ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("preview")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg overflow-hidden border bg-muted/20">
                    <img
                      src={currentPreview}
                      alt="Compressed preview"
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
