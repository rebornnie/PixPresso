"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload, type ImageInfo } from "@/components/image-upload";
import { DownloadButton } from "@/components/download-button";
import { PreviewEmptyState } from "@/components/preview-empty-state";
import {
  convertImage,
  formatFileSize,
  downloadBlob,
  FORMAT_EXTENSIONS,
  FORMAT_LABELS,
  type ImageFormat,
} from "@/lib/image-utils";

const FORMATS: ImageFormat[] = ["image/jpeg", "image/png", "image/webp"];

export default function ConvertPage() {
  const t = useTranslations("convert");
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [targetFormat, setTargetFormat] = useState<ImageFormat>("image/webp");
  const [quality, setQuality] = useState(80);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedKey, setProcessedKey] = useState("");
  const [errorKey, setErrorKey] = useState("");
  const previewUrlRef = useRef<string | null>(null);
  const requestKey = imageInfo ? `${imageInfo.url}|${targetFormat}|${quality}` : "";
  const currentBlob = processedKey === requestKey ? convertedBlob : null;
  // Stats keep showing the last result for the current image while a new
  // one is pending, so the layout below the controls doesn't shift.
  const statsBlob =
    imageInfo && convertedBlob && processedKey.startsWith(`${imageInfo.url}|`)
      ? convertedBlob
      : null;
  // Keep showing the last processed frame while a new one is pending;
  // only hide it when it belongs to a different image.
  const currentPreview =
    imageInfo && previewUrl && processedKey.startsWith(`${imageInfo.url}|`)
      ? previewUrl
      : null;
  const processing = !!imageInfo && processedKey !== requestKey && errorKey !== requestKey;

  const processImage = useCallback(async (isCurrent: () => boolean) => {
    if (!imageInfo) return;
    try {
      const blob = await convertImage(imageInfo.url, targetFormat, quality);
      if (!isCurrent()) return;
      setConvertedBlob(blob);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;
      setPreviewUrl(url);
      setProcessedKey(requestKey);
      setErrorKey("");
    } catch {
      if (isCurrent()) setErrorKey(requestKey);
    }
  }, [imageInfo, targetFormat, quality, requestKey]);

  useEffect(() => {
    if (imageInfo) {
      let active = true;
      const timer = setTimeout(() => { void processImage(() => active); }, 200);
      return () => { active = false; clearTimeout(timer); };
    }
  }, [imageInfo, targetFormat, quality, processImage]);

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
    const ext = FORMAT_EXTENSIONS[targetFormat];
    const baseName = imageInfo.file.name.replace(/\.[^.]+$/, "");
    downloadBlob(currentBlob, `${baseName}_converted.${ext}`);
  };

  const showQuality = targetFormat !== "image/png";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-muted-foreground mb-6">{t("description")}</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <ImageUpload onImageLoad={setImageInfo} imageInfo={imageInfo} />
              </CardContent>
            </Card>

            {imageInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("targetFormat")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    value={targetFormat}
                    onValueChange={(v) => setTargetFormat(v as ImageFormat)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMATS.map((f) => (
                        <SelectItem key={f} value={f}>
                          {FORMAT_LABELS[f]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {showQuality && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>{t("quality")}</Label>
                        <Badge variant="secondary">{quality}</Badge>
                      </div>
                      <Slider
                        value={[quality]}
                        onValueChange={(v) => setQuality(Array.isArray(v) ? v[0] : v)}
                        min={1}
                        max={100}
                        step={1}
                      />
                      <p className="text-xs text-muted-foreground">{t("qualityHint")}</p>
                    </div>
                  )}

                  {statsBlob && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("original")}:</span>
                        <span className="font-medium">
                          {FORMAT_LABELS[imageInfo.format]} · {formatFileSize(imageInfo.file.size)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("converted")}:</span>
                        <span className="font-medium">
                          {FORMAT_LABELS[targetFormat]} · {formatFileSize(statsBlob.size)}
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
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2">
            {currentPreview ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {FORMAT_LABELS[targetFormat]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg overflow-hidden border bg-muted/20">
                    <img
                      src={currentPreview}
                      alt="Converted preview"
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
